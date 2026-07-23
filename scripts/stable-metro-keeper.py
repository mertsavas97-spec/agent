#!/usr/bin/env python3
"""Stable Metro + Cloudflare for Expo Dev Client (iOS-safe ports).

Root cause of `:8081` on trycloudflare hosts
-------------------------------------------
1. Node's URL API strips default HTTPS port 443 (`new URL('https://x:443').port === ''`).
2. Expo then advertises hostUri / bundle URLs *without* `:443`.
3. iOS expo-dev-launcher does `url.port ?? 8081` → phone requests `:8081` → fail.

Fix: set process env (NOT `.env`):
  EXPO_PACKAGER_PROXY_URL=http://<cf-host>:443
Node keeps `:443` on the *http* scheme; Expo still emits https://host:443 for
HTTPS clients. Metro is only restarted when the tunnel hostname changes.
"""
from __future__ import annotations

import os
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
CF_SESSION = "cozbil-cf-stable"
METRO_SESSION = "cozbil-metro"
STATE = Path("/tmp/cozbil-metro-keeper.state")


def log(msg: str) -> None:
    line = f"{time.strftime('%H:%M:%S')} {msg}"
    prev = LOG.read_text() if LOG.exists() else ""
    LOG.write_text(prev[-12000:] + line + "\n")
    print(line, flush=True)


def sh(cmd: str, timeout: int = 45) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        cmd, shell=True, capture_output=True, text=True, timeout=timeout
    )


def local_metro_ok() -> bool:
    r = sh("curl -sf -m 3 http://127.0.0.1:8081/status || true")
    return "packager-status:running" in (r.stdout or "")


def public_ok(host: str) -> bool:
    r = sh(
        "curl -sf -m 12 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' "
        f"https://{host}:443/status || true"
    )
    return "packager-status:running" in (r.stdout or "")


def manifest_has_443(host: str) -> bool:
    r = sh(
        "curl -sf -m 12 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' "
        "-H 'Accept: application/expo+json' -H 'Expo-Platform: ios' "
        f"https://{host}:443/ || true"
    )
    body = r.stdout or ""
    return f"{host}:443" in body and "8081" not in body.split("launchAsset")[0]


def read_cf_host() -> str:
    text = CF_LOG.read_text() if CF_LOG.exists() else ""
    pane = sh(
        f"{' '.join(TMUX)} capture-pane -t {CF_SESSION}:0.0 -p -J -S -200 || true"
    )
    text += pane.stdout or ""
    matches = re.findall(r"([a-z0-9-]+\.trycloudflare\.com)", text)
    return matches[-1] if matches else ""


def restart_cf() -> str:
    log("restarting cloudflared")
    sh(f"{' '.join(TMUX)} kill-session -t {CF_SESSION} 2>/dev/null || true")
    # Kill by pid file / narrow pattern via pgrep in python
    r = sh("pgrep -af 'cloudflared tunnel' || true")
    for line in (r.stdout or "").splitlines():
        if "127.0.0.1:8081" in line or "localhost:8081" in line:
            pid = line.split()[0]
            sh(f"kill {pid} 2>/dev/null || true")
    time.sleep(1)
    CF_LOG.write_text("")
    sh(
        f"{' '.join(TMUX)} new-session -d -s {CF_SESSION} -- "
        f"bash -lc '{CF_BIN} tunnel --url http://127.0.0.1:8081 "
        f"--no-autoupdate --protocol http2 2>&1 | tee {CF_LOG}'"
    )
    for i in range(60):
        host = read_cf_host()
        if host:
            log(f"cf host {host} ({i}s)")
            return host
        time.sleep(1)
    return ""


def start_metro(host: str) -> bool:
    """Start Metro with EXPO_PACKAGER_PROXY_URL=http://host:443 (port-retention trick)."""
    proxy = f"http://{host}:443"
    log(f"starting metro EXPO_PACKAGER_PROXY_URL={proxy}")
    sh(f"{' '.join(TMUX)} kill-session -t {METRO_SESSION} 2>/dev/null || true")
    sh("fuser -k 8081/tcp 2>/dev/null || true")
    time.sleep(2)
    # Important: export in the same bash -lc so getOriginalEnvValue sees it.
    sh(
        f"{' '.join(TMUX)} new-session -d -s {METRO_SESSION} -c /workspace/apps/mobile -- "
        f"bash -lc \"export EXPO_PACKAGER_PROXY_URL='{proxy}'; "
        f"npx expo start --dev-client --port 8081 --lan 2>&1 | tee /tmp/cozbil-metro.log\""
    )
    for i in range(90):
        if local_metro_ok():
            log(f"metro up {i}s")
            return True
        time.sleep(1)
    log("metro failed")
    return False


def write_connect(host: str) -> str:
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
            f"EXPO_PACKAGER_PROXY_URL=http://{host}:443",
            f"MANUAL={host}:443",
            f"DEEP_LINK={deep}",
            f"SOLVE_PROXY={proxy}",
            "PROVIDER=cloudflared+http-443-port-trick",
            "NOTE=iOS falls back to :8081 if :443 is missing from hostUri — do not strip it",
            f"UPDATED={time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}",
            "",
        ]
    )
    CONNECT.write_text(body)
    STABLE.write_text(
        "\n".join(
            [
                "# ÇözBil sabit Metro",
                f"# {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}",
                "",
                "Deep link:",
                deep,
                "",
                "Manuel:",
                f"{host}:443",
                "",
                "ASLA :8081",
                "",
            ]
        )
    )
    STATE.write_text(host)
    return deep


def ensure() -> str | None:
    host = read_cf_host()
    if not host or not public_ok(host):
        host = restart_cf()
        if not host:
            return None
        for _ in range(20):
            if public_ok(host):
                break
            time.sleep(2)
        else:
            log("tunnel not healthy")
            return None
        # New host → must restart Metro with matching proxy URL
        if not start_metro(host):
            return None
    else:
        prev = STATE.read_text().strip() if STATE.exists() else ""
        if prev != host or not local_metro_ok() or not manifest_has_443(host):
            if not start_metro(host):
                return None

    # Wait for tunnel↔metro after metro restart
    for _ in range(20):
        if public_ok(host) and manifest_has_443(host):
            break
        time.sleep(2)
    else:
        log("manifest missing :443 after metro start")
        return None

    deep = write_connect(host)
    log(f"ready {deep}")
    return deep


def loop(interval: int = 45) -> None:
    ensure()
    while True:
        time.sleep(interval)
        try:
            host = read_cf_host()
            if not host or not public_ok(host) or not manifest_has_443(host):
                log("health fail — repairing")
                ensure()
            else:
                write_connect(host)
                log(f"ok {host}")
        except Exception as exc:  # noqa: BLE001
            log(f"error {exc}")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--once":
        raise SystemExit(0 if ensure() else 1)
    loop()
