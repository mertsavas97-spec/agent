#!/usr/bin/env python3
"""Retry cloudflared tunnels until /health and /status work via public DNS."""
from __future__ import annotations

import re
import secrets
import subprocess
import time
from pathlib import Path
from urllib.parse import quote

TMUX = "tmux -f /exec-daemon/tmux.portal.conf"
CF = "/workspace/.tools/bin/cloudflared"
LOG = Path("/tmp/retry-tunnels.log")
ENV_PATH = Path("/workspace/apps/mobile/.env")
CONNECT = Path("/tmp/cozbil-metro-connect.txt")
PROXY_TOKEN = secrets.token_urlsafe(24)


def log(msg: str) -> None:
    prev = LOG.read_text() if LOG.exists() else ""
    LOG.write_text(prev + msg + "\n")
    print(msg, flush=True)


def sh(cmd: str, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)


def wait_url(session: str, n: int = 45) -> str:
    for _ in range(n):
        pane = sh(f"{TMUX} capture-pane -t {session} -p -J -S -160").stdout or ""
        m = re.search(r"https://[a-z0-9-]+\.trycloudflare\.com", pane)
        if m:
            return m.group(0)
        time.sleep(1)
    return ""


def verify(url: str, path: str, needle: str, tries: int = 30) -> bool:
    host = url.replace("https://", "")
    for i in range(tries):
        dig = sh(f"dig +short @1.1.1.1 {host} A || true")
        ips = dig.stdout.strip().split()
        if not ips:
            log(f"dig miss {host} {i}")
            time.sleep(2)
            continue
        ip = ips[0]
        r = sh(
            "curl -sS -m 12 -o /tmp/tb -w '%{http_code}' -A 'okhttp/4.9.0' "
            f"--resolve {host}:443:{ip} {url}{path} || echo 000"
        )
        code = (r.stdout or "").strip()
        body = Path("/tmp/tb").read_text() if Path("/tmp/tb").exists() else ""
        log(f"check {url}{path} ip={ip} {code} {body[:70]}")
        if code == "200" and needle in body:
            return True
        time.sleep(2)
    return False


def upsert_proxy(url: str) -> None:
    text = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    line = f"EXPO_PUBLIC_SOLVE_PROXY_URL={url}"
    if re.search(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=", text, re.M):
        text = re.sub(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=.*$", line, text, flags=re.M)
    else:
        text = text.rstrip() + "\n\n" + line + "\n"
    token_line = f"EXPO_PUBLIC_SOLVE_PROXY_TOKEN={PROXY_TOKEN}"
    if re.search(r"^EXPO_PUBLIC_SOLVE_PROXY_TOKEN=", text, re.M):
        text = re.sub(
            r"^EXPO_PUBLIC_SOLVE_PROXY_TOKEN=.*$", token_line, text, flags=re.M
        )
    else:
        text = text.rstrip() + "\n" + token_line + "\n"
    ENV_PATH.write_text(text)


def ensure_local(port: int, path: str, needle: str) -> bool:
    r = sh(f"curl -sf -m 2 http://127.0.0.1:{port}{path} || true")
    return needle in (r.stdout or "")


def new_tunnel(session: str, local: str) -> str:
    sh(f"{TMUX} kill-session -t {session} 2>/dev/null || true")
    time.sleep(1)
    sh(
        f"{TMUX} new-session -d -s {session} -- "
        f"bash -lc '{CF} tunnel --url {local} --no-autoupdate --protocol http2 "
        f"2>&1 | tee /tmp/{session}.log'"
    )
    return wait_url(session)


def write_connect(metro_url: str, proxy_url: str, ok: bool = True) -> None:
    host = metro_url.replace("https://", "")
    CONNECT.write_text(
        "\n".join(
            [
                f"TUNNEL_URL={metro_url}",
                f"MANUAL_1={host}:443",
                f"MANUAL_2={metro_url}",
                f"DEEP_LINK=exp+cozbil://expo-development-client/?url={quote(metro_url, safe='')}",
                "PROVIDER=cloudflared",
                f"OK={'1' if ok else '0'}",
                f"SOLVE_PROXY_URL={proxy_url}",
                "",
            ]
        )
    )


def main() -> int:
    LOG.write_text("")
    if not Path(CF).exists():
        log("no cloudflared")
        return 1

    if not ensure_local(8787, "/health", "cozbil-solve-proxy"):
        log("starting local proxy")
        sh(f"{TMUX} kill-session -t cozbil-solve-proxy 2>/dev/null || true")
        sh("fuser -k 8787/tcp 2>/dev/null || true")
        time.sleep(1)
        sh(
            f"{TMUX} new-session -d -s cozbil-solve-proxy -c /workspace/scripts/solve-proxy -- "
            f"bash -lc 'COZBIL_PROXY_DOGFOOD=1 COZBIL_PROXY_TOKEN={PROXY_TOKEN} "
            "node server.mjs > /tmp/cozbil-solve-proxy.log 2>&1'"
        )
        for i in range(40):
            if ensure_local(8787, "/health", "cozbil-solve-proxy"):
                log(f"proxy up {i}")
                break
            time.sleep(0.5)
        else:
            log("proxy fail")
            log(Path("/tmp/cozbil-solve-proxy.log").read_text()[-1500:] if Path("/tmp/cozbil-solve-proxy.log").exists() else "")
            return 1

    if not ensure_local(8081, "/status", "packager-status:running"):
        log("starting metro")
        sh(f"{TMUX} kill-session -t cozbil-metro 2>/dev/null || true")
        sh("fuser -k 8081/tcp 2>/dev/null || true")
        time.sleep(1)
        sh(
            f"{TMUX} new-session -d -s cozbil-metro -c /workspace/apps/mobile -- "
            "bash -lc 'npx expo start --dev-client --port 8081 --clear 2>&1 | tee /tmp/cozbil-metro-start.log'"
        )
        for i in range(90):
            if ensure_local(8081, "/status", "packager-status:running"):
                log(f"metro up {i}")
                break
            time.sleep(1)
        else:
            log("metro fail")
            return 1

    proxy_url = ""
    for attempt in range(1, 8):
        log(f"proxy tunnel attempt {attempt}")
        proxy_url = new_tunnel("cozbil-solve-tunnel", "http://127.0.0.1:8787")
        if proxy_url and verify(proxy_url, "/health", "cozbil-solve-proxy"):
            log(f"proxy OK {proxy_url}")
            break
        proxy_url = ""
    if not proxy_url:
        log("proxy tunnel failed")
        return 2
    upsert_proxy(proxy_url)

    # Restart metro so env is loaded, then tunnel it
    log("metro clear restart for proxy env")
    sh(f"{TMUX} kill-session -t cozbil-metro 2>/dev/null || true")
    sh("fuser -k 8081/tcp 2>/dev/null || true")
    time.sleep(2)
    sh(
        f"{TMUX} new-session -d -s cozbil-metro -c /workspace/apps/mobile -- "
        "bash -lc 'npx expo start --dev-client --port 8081 --clear 2>&1 | tee /tmp/cozbil-metro-start.log'"
    )
    for i in range(90):
        if ensure_local(8081, "/status", "packager-status:running"):
            log(f"metro re-up {i}")
            break
        time.sleep(1)
    else:
        return 1

    metro_url = ""
    for attempt in range(1, 8):
        log(f"metro tunnel attempt {attempt}")
        metro_url = new_tunnel("cozbil-metro-tunnel", "http://127.0.0.1:8081")
        if metro_url and verify(metro_url, "/status", "packager-status:running"):
            log(f"metro OK {metro_url}")
            break
        metro_url = ""
    if not metro_url:
        log("metro cf failed; try lhr")
        sh(f"{TMUX} kill-session -t cozbil-metro-tunnel 2>/dev/null || true")
        time.sleep(1)
        ssh_log = Path("/tmp/cozbil-metro-lhr.log")
        ssh_log.write_text("")
        sh(
            f"{TMUX} new-session -d -s cozbil-metro-tunnel -- bash -lc "
            f"\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
            f"-o ServerAliveInterval=30 -R 80:127.0.0.1:8081 nokey@localhost.run 2>&1 | tee {ssh_log}\""
        )
        for _ in range(60):
            matches = re.findall(r"https://[a-z0-9-]+\.lhr\.life", ssh_log.read_text())
            if matches:
                metro_url = matches[-1]
                break
            time.sleep(1)
        if not metro_url or not verify(metro_url, "/status", "packager-status:running", tries=15):
            log("metro public fail")
            return 3

    write_connect(metro_url, proxy_url, True)
    log(CONNECT.read_text())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
