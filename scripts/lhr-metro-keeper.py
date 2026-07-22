#!/usr/bin/env python3
"""Keep Metro + solve-proxy reachable via localhost.run for phone dogfood.

Cloudflare quick tunnels are often DNS-flaky here; LHR is the fallback.
Always advertise packager as https://<host>:443 (iOS falls back to :8081
if the port is stripped from the Expo hostUri).
"""
from __future__ import annotations

import re
import subprocess
import time
from pathlib import Path
from urllib.parse import quote

TMUX = ["tmux", "-f", "/exec-daemon/tmux.portal.conf"]
ENV = Path("/workspace/apps/mobile/.env")
CONNECT = Path("/tmp/cozbil-metro-connect.txt")
STABLE = Path("/tmp/cozbil-metro-STABLE.txt")
METRO_LOG = Path("/tmp/cozbil-metro-lhr.log")
PROXY_LOG = Path("/tmp/lhr-proxy.log")
WATCH = Path("/tmp/cozbil-lhr-watch.log")
METRO_SESSION = "cozbil-metro"
METRO_TUNNEL = "cozbil-metro-tunnel"
PROXY_TUNNEL = "cozbil-solve-tunnel"


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    prev = WATCH.read_text() if WATCH.exists() else ""
    WATCH.write_text(prev[-12000:] + line + "\n")
    print(line, flush=True)


def sh(cmd: str, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)


def tmux_kill(name: str) -> None:
    sh(f"{' '.join(TMUX)} kill-session -t {name} 2>/dev/null || true")


def latest_lhr(path: Path) -> str:
    if not path.exists():
        return ""
    matches = re.findall(r"https://([a-z0-9]+\.lhr\.life)", path.read_text())
    return matches[-1] if matches else ""


def public_ok(url: str, needle: str) -> bool:
    r = sh(
        "curl -sf -m 12 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' "
        f"{url} || true"
    )
    return needle in (r.stdout or "")


def local_metro_ok() -> bool:
    r = sh("curl -sf -m 3 http://127.0.0.1:8081/status || true")
    return "packager-status:running" in (r.stdout or "")


def local_proxy_ok() -> bool:
    r = sh("curl -sf -m 3 http://127.0.0.1:8787/health || true")
    return "cozbil-solve-proxy" in (r.stdout or "")


def start_ssh_tunnel(session: str, port: int, log_path: Path) -> str:
    tmux_kill(session)
    log_path.write_text("")
    sh(
        f"{' '.join(TMUX)} new-session -d -s {session} -- bash -lc "
        f"\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
        f"-o ServerAliveInterval=30 -R 80:127.0.0.1:{port} nokey@localhost.run "
        f"2>&1 | tee {log_path}\""
    )
    for _ in range(70):
        host = latest_lhr(log_path)
        if host:
            return host
        time.sleep(1)
    return ""


def start_metro(host: str) -> bool:
    proxy = f"http://{host}:443"
    log(f"starting metro EXPO_PACKAGER_PROXY_URL={proxy}")
    tmux_kill(METRO_SESSION)
    sh("fuser -k 8081/tcp 2>/dev/null || true")
    time.sleep(2)
    sh(
        f"{' '.join(TMUX)} new-session -d -s {METRO_SESSION} -c /workspace/apps/mobile -- "
        f"bash -lc \"export EXPO_PACKAGER_PROXY_URL='{proxy}'; "
        f"npx expo start --dev-client --port 8081 --lan 2>&1 | tee /tmp/cozbil-metro.log\""
    )
    for i in range(90):
        if local_metro_ok():
            log(f"metro local up {i}s")
            return True
        time.sleep(1)
    log("metro local failed")
    return False


def upsert_proxy_env(url: str) -> None:
    if not ENV.exists():
        return
    text = ENV.read_text()
    line = f"EXPO_PUBLIC_SOLVE_PROXY_URL={url}"
    if re.search(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=", text, re.M):
        text = re.sub(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=.*$", line, text, flags=re.M)
    else:
        text = text.rstrip() + "\n" + line + "\n"
    ENV.write_text(text)
    Path("/tmp/cozbil-proxy-url.txt").write_text(url + "\n")


def write_connect(metro_host: str, proxy_url: str) -> str:
    packager = f"https://{metro_host}:443"
    deep = "exp+cozbil://expo-development-client/?url=" + quote(packager, safe="")
    CONNECT.write_text(
        "\n".join(
            [
                f"TUNNEL_URL=https://{metro_host}",
                f"PACKAGER_URL={packager}",
                f"EXPO_PACKAGER_PROXY_URL=http://{metro_host}:443",
                f"MANUAL={metro_host}:443",
                f"DEEP_LINK={deep}",
                f"SOLVE_PROXY={proxy_url}",
                "PROVIDER=localhost.run+http-443-port-trick",
                "NOTE=iOS needs explicit :443 — never :8081",
                f"UPDATED={time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
                "",
            ]
        )
    )
    STABLE.write_text(
        f"Deep link:\n{deep}\n\nManuel:\n{metro_host}:443\nASLA :8081\n"
    )
    return deep


def manifest_has_443(host: str) -> bool:
    r = sh(
        "curl -sf -m 12 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' "
        "-H 'Accept: application/expo+json' -H 'Expo-Platform: ios' "
        f"https://{host}/ || true"
    )
    return f"{host}:443" in (r.stdout or "")


def ensure() -> bool:
    if not local_proxy_ok():
        log("local proxy down — leave existing solve-proxy session")
    if not local_metro_ok():
        # Need a host first — open tunnel then start metro, or start metro on last host
        host = latest_lhr(METRO_LOG) or "pending.lhr.life"
        if host == "pending.lhr.life":
            host = start_ssh_tunnel(METRO_TUNNEL, 8081, METRO_LOG) or host
        if not start_metro(host if host != "pending.lhr.life" else "127.0.0.1"):
            return False

    metro_host = latest_lhr(METRO_LOG)
    if not metro_host or not public_ok(f"https://{metro_host}/status", "packager-status:running"):
        log("metro tunnel unhealthy — recreating")
        metro_host = start_ssh_tunnel(METRO_TUNNEL, 8081, METRO_LOG)
        if not metro_host:
            log("metro tunnel failed")
            return False
        if not start_metro(metro_host):
            return False
        for _ in range(20):
            if public_ok(f"https://{metro_host}/status", "packager-status:running"):
                break
            time.sleep(2)
        else:
            log("metro public still down")
            return False

    if not manifest_has_443(metro_host):
        log("manifest missing :443 — restart metro with packager proxy")
        if not start_metro(metro_host):
            return False
        time.sleep(3)

    proxy_host = latest_lhr(PROXY_LOG)
    proxy_url = f"https://{proxy_host}" if proxy_host else ""
    if not proxy_host or not public_ok(f"{proxy_url}/health", "cozbil-solve-proxy"):
        log("proxy tunnel unhealthy — recreating")
        proxy_host = start_ssh_tunnel(PROXY_TUNNEL, 8787, PROXY_LOG)
        if not proxy_host:
            log("proxy tunnel failed")
            return False
        proxy_url = f"https://{proxy_host}"
        for _ in range(20):
            if public_ok(f"{proxy_url}/health", "cozbil-solve-proxy"):
                break
            time.sleep(2)
        else:
            log("proxy public still down")
            return False

    upsert_proxy_env(proxy_url)
    deep = write_connect(metro_host, proxy_url)
    log(f"ready metro={metro_host} proxy={proxy_url}")
    log(f"deep {deep}")
    return True


def loop(interval: int = 40) -> None:
    ensure()
    while True:
        time.sleep(interval)
        try:
            metro_host = latest_lhr(METRO_LOG)
            proxy_host = latest_lhr(PROXY_LOG)
            m_ok = bool(
                metro_host
                and public_ok(f"https://{metro_host}/status", "packager-status:running")
                and manifest_has_443(metro_host)
            )
            p_ok = bool(
                proxy_host and public_ok(f"https://{proxy_host}/health", "cozbil-solve-proxy")
            )
            log(f"watch metro={int(m_ok)} proxy={int(p_ok)} {metro_host}")
            if not m_ok or not p_ok or not local_metro_ok():
                log("repairing")
                ensure()
            elif metro_host and proxy_host:
                write_connect(metro_host, f"https://{proxy_host}")
        except Exception as exc:  # noqa: BLE001
            log(f"error {exc}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        raise SystemExit(0 if ensure() else 1)
    loop()
