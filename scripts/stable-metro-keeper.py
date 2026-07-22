#!/usr/bin/env python3
"""Keep Metro (8081) + a public Cloudflare tunnel healthy without restarting Metro.

Writes a phone-ready deep link that ALWAYS pins :443 — Expo defaults to :8081
when the port is omitted, which breaks trycloudflare.com.
"""
from __future__ import annotations

import re
import subprocess
import time
from pathlib import Path
from urllib.parse import quote

TMUX = ["tmux", "-f", "/exec-daemon/tmux.portal.conf"]
CF_BIN = Path("/tmp/cloudflared")
if not CF_BIN.exists():
    CF_BIN = Path("/workspace/.tools/bin/cloudflared")

CONNECT = Path("/tmp/cozbil-metro-connect.txt")
STABLE = Path("/tmp/cozbil-metro-STABLE.txt")
LOG = Path("/tmp/cozbil-metro-keeper.log")
CF_LOG = Path("/tmp/cozbil-cf-stable.log")
SESSION = "cozbil-cf-stable"
METRO_SESSION = "cozbil-metro"


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    prev = LOG.read_text() if LOG.exists() else ""
    LOG.write_text(prev[-8000:] + line + "\n")
    print(line, flush=True)


def sh(cmd: str, timeout: int = 30) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd, shell=True, capture_output=True, text=True, timeout=timeout
    )


def local_metro_ok() -> bool:
    r = sh("curl -sf -m 3 http://127.0.0.1:8081/status || true")
    return "packager-status:running" in (r.stdout or "")


def ensure_metro() -> bool:
    if local_metro_ok():
        return True
    log("metro down — starting (only when dead)")
    sh(f"{' '.join(TMUX)} has-session -t {METRO_SESSION} 2>/dev/null || true")
    sh(f"{' '.join(TMUX)} kill-session -t {METRO_SESSION} 2>/dev/null || true")
    sh("fuser -k 8081/tcp 2>/dev/null || true")
    time.sleep(1)
    sh(
        f"{' '.join(TMUX)} new-session -d -s {METRO_SESSION} -c /workspace/apps/mobile -- "
        "bash -lc 'npx expo start --dev-client --port 8081 2>&1 | tee /tmp/cozbil-metro.log'"
    )
    for i in range(90):
        if local_metro_ok():
            log(f"metro up after {i}s")
            return True
        time.sleep(1)
    log("metro failed to start")
    return False


def public_ok(url: str) -> bool:
    host = url.replace("https://", "").split("/")[0]
    dig = sh(f"dig +short @1.1.1.1 {host} A || true")
    ips = [x for x in dig.stdout.split() if re.match(r"^\d+\.\d+\.\d+\.\d+$", x)]
    if not ips:
        # still try plain curl (some envs block dig)
        r = sh(
            f"curl -sf -m 12 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' "
            f"{url}/status || true"
        )
        return "packager-status:running" in (r.stdout or "")
    ip = ips[0]
    r = sh(
        "curl -sf -m 12 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' "
        f"--resolve {host}:443:{ip} {url}/status || true"
    )
    return "packager-status:running" in (r.stdout or "")


def read_cf_url() -> str:
    text = ""
    if CF_LOG.exists():
        text += CF_LOG.read_text()
    pane = sh(f"{' '.join(TMUX)} capture-pane -t {SESSION}:0.0 -p -J -S -200 || true")
    text += pane.stdout or ""
    matches = re.findall(r"https://[a-z0-9-]+\.trycloudflare\.com", text)
    return matches[-1] if matches else ""


def restart_cf() -> str:
    log("restarting cloudflared tunnel")
    sh(f"{' '.join(TMUX)} kill-session -t {SESSION} 2>/dev/null || true")
    sh("pkill -f 'cloudflared tunnel --url http://127.0.0.1:8081' 2>/dev/null || true")
    time.sleep(1)
    CF_LOG.write_text("")
    bin_path = str(CF_BIN)
    sh(
        f"{' '.join(TMUX)} new-session -d -s {SESSION} -- "
        f"bash -lc '{bin_path} tunnel --url http://127.0.0.1:8081 "
        f"--no-autoupdate --protocol http2 2>&1 | tee {CF_LOG}'"
    )
    for i in range(60):
        url = read_cf_url()
        if url:
            log(f"cf url {url} ({i}s)")
            return url
        time.sleep(1)
    return ""


def write_connect(metro_https: str) -> str:
    """Pin :443 so Expo / RN does not fall back to :8081."""
    host = metro_https.replace("https://", "").split("/")[0].split(":")[0]
    packager = f"https://{host}:443"
    deep = "exp+cozbil://expo-development-client/?url=" + quote(packager, safe="")
    proxy = ""
    env = Path("/workspace/apps/mobile/.env")
    if env.exists():
        m = re.search(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=(.+)$", env.read_text(), re.M)
        if m:
            proxy = m.group(1).strip()
    body = "\n".join(
        [
            f"TUNNEL_URL=https://{host}",
            f"PACKAGER_URL={packager}",
            f"MANUAL={host}:443",
            f"DEEP_LINK={deep}",
            f"SOLVE_PROXY={proxy}",
            "PROVIDER=cloudflared-stable-keeper",
            "NOTE=ALWAYS use :443 — never :8081 on trycloudflare hosts",
            f"UPDATED={time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
            "",
        ]
    )
    CONNECT.write_text(body)
    STABLE.write_text(
        "\n".join(
            [
                "# ÇözBil sabit Metro (bu dosya keeper tarafından güncellenir)",
                f"# Son güncelleme: {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}",
                "",
                "Deep link (kopyala / Safari veya Notes’tan aç):",
                deep,
                "",
                "Manuel (dev client Enter URL):",
                f"{host}:443",
                "",
                "YANLIŞ (çalışmaz):",
                f"{host}:8081",
                f"https://{host}:8081",
                "",
            ]
        )
    )
    return deep


def ensure_tunnel() -> str | None:
    url = read_cf_url()
    if url and public_ok(url):
        return url
    if url:
        log(f"stale tunnel {url}")
    for attempt in range(1, 6):
        log(f"tunnel attempt {attempt}")
        url = restart_cf()
        if not url:
            continue
        for _ in range(15):
            if public_ok(url):
                log(f"tunnel healthy {url}")
                return url
            time.sleep(2)
        log(f"tunnel not healthy yet {url}")
    return None


def once() -> str | None:
    if not ensure_metro():
        return None
    url = ensure_tunnel()
    if not url:
        return None
    deep = write_connect(url)
    log(f"STABLE deep link ready")
    return deep


def loop(interval: int = 40) -> None:
    once()
    while True:
        time.sleep(interval)
        try:
            if not local_metro_ok():
                ensure_metro()
            url = read_cf_url()
            if not url or not public_ok(url):
                log("health fail — repairing tunnel (metro kept)")
                ensure_tunnel()
            else:
                write_connect(url)
                log(f"ok {url}")
        except Exception as exc:  # noqa: BLE001
            log(f"keeper error {exc}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        deep = once()
        raise SystemExit(0 if deep else 1)
    loop()
