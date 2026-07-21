#!/usr/bin/env python3
"""Expose solve-proxy via localhost.run (trycloudflare DNS often flaky here)."""
from __future__ import annotations

import json
import re
import subprocess
import time
import urllib.request
from pathlib import Path

TMUX = "tmux -f /exec-daemon/tmux.portal.conf"
ENV_PATH = Path("/workspace/apps/mobile/.env")
CONNECT = Path("/tmp/cozbil-metro-connect.txt")
LOG = Path("/tmp/lhr-proxy.log")


def sh(cmd: str, timeout: int = 60) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)


def local_ok(port: int, path: str, needle: str) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}{path}", timeout=2) as r:
            return needle in r.read().decode()
    except Exception:
        return False


def upsert_proxy(url: str) -> None:
    text = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    line = f"EXPO_PUBLIC_SOLVE_PROXY_URL={url}"
    if re.search(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=", text, re.M):
        text = re.sub(r"^EXPO_PUBLIC_SOLVE_PROXY_URL=.*$", line, text, flags=re.M)
    else:
        text = text.rstrip() + "\n\n" + line + "\n"
    ENV_PATH.write_text(text)


def verify(url: str, path: str, needle: str) -> bool:
    for i in range(25):
        r = sh(f"curl -sS -m 15 -A 'okhttp/4.9.0' -H 'Bypass-Tunnel-Reminder: 1' {url}{path} || true")
        body = r.stdout or ""
        print(f"verify {i} {url}{path} -> {body[:80]}", flush=True)
        if needle in body:
            return True
        time.sleep(2)
    return False


def main() -> int:
    if not local_ok(8787, "/health", "cozbil-solve-proxy"):
        sh(f"{TMUX} kill-session -t cozbil-solve-proxy 2>/dev/null || true")
        sh("fuser -k 8787/tcp 2>/dev/null || true")
        time.sleep(1)
        sh(
            f"{TMUX} new-session -d -s cozbil-solve-proxy -c /workspace/scripts/solve-proxy -- "
            "bash -lc 'node server.mjs > /tmp/cozbil-solve-proxy.log 2>&1'"
        )
        for i in range(40):
            if local_ok(8787, "/health", "cozbil-solve-proxy"):
                print("proxy up", i, flush=True)
                break
            time.sleep(0.5)
        else:
            print("proxy fail", flush=True)
            return 1

    sh(f"{TMUX} kill-session -t cozbil-solve-tunnel 2>/dev/null || true")
    time.sleep(1)
    LOG.write_text("")
    sh(
        f"{TMUX} new-session -d -s cozbil-solve-tunnel -- bash -lc "
        f"\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
        f"-o ServerAliveInterval=30 -R 80:127.0.0.1:8787 nokey@localhost.run 2>&1 | tee {LOG}\""
    )
    proxy_url = ""
    for _ in range(70):
        text = LOG.read_text()
        matches = re.findall(r"https://[a-z0-9-]+\.lhr\.life", text)
        if matches:
            proxy_url = matches[-1]
            break
        time.sleep(1)
    if not proxy_url:
        print("no lhr proxy url", flush=True)
        print(LOG.read_text()[-800:], flush=True)
        return 2
    print("proxy_url", proxy_url, flush=True)
    if not verify(proxy_url, "/health", "cozbil-solve-proxy"):
        print("proxy lhr verify fail", flush=True)
        return 3
    upsert_proxy(proxy_url)

    # smoke via public URL
    payload = {
        "requestId": "dogfood-lgs-public",
        "examType": "lgs",
        "ocrText": (
            "Bir sınıfta 24 öğrenci vardır. Öğrencilerin 3/8'i kızdır. "
            "Kız öğrencilerin 1/3'ü spor kulübüne gidiyorsa, spor kulübüne giden kız öğrenci sayısı kaçtır?\n"
            "A) 2\nB) 3\nC) 4\nD) 6\nE) 8"
        ),
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{proxy_url}/solve",
        data=data,
        headers={
            "Content-Type": "application/json",
            "Bypass-Tunnel-Reminder": "1",
            "User-Agent": "cozbil-dogfood/1",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        body = json.loads(r.read().decode())
    print("public smoke", body.get("status"), body.get("answer"), flush=True)

    # restart metro with new env + lhr metro tunnel
    if not local_ok(8081, "/status", "packager-status:running"):
        sh(f"{TMUX} kill-session -t cozbil-metro 2>/dev/null || true")
        sh("fuser -k 8081/tcp 2>/dev/null || true")
        time.sleep(1)
    else:
        sh(f"{TMUX} kill-session -t cozbil-metro 2>/dev/null || true")
        sh("fuser -k 8081/tcp 2>/dev/null || true")
        time.sleep(2)
    sh(
        f"{TMUX} new-session -d -s cozbil-metro -c /workspace/apps/mobile -- "
        "bash -lc 'npx expo start --dev-client --port 8081 --clear 2>&1 | tee /tmp/cozbil-metro-start.log'"
    )
    for i in range(90):
        if local_ok(8081, "/status", "packager-status:running"):
            print("metro up", i, flush=True)
            break
        time.sleep(1)
    else:
        return 4

    sh(f"{TMUX} kill-session -t cozbil-metro-tunnel 2>/dev/null || true")
    time.sleep(1)
    metro_log = Path("/tmp/cozbil-metro-lhr.log")
    metro_log.write_text("")
    sh(
        f"{TMUX} new-session -d -s cozbil-metro-tunnel -- bash -lc "
        f"\"ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "
        f"-o ServerAliveInterval=30 -R 80:127.0.0.1:8081 nokey@localhost.run 2>&1 | tee {metro_log}\""
    )
    metro_url = ""
    for _ in range(70):
        matches = re.findall(r"https://[a-z0-9-]+\.lhr\.life", metro_log.read_text())
        if matches:
            metro_url = matches[-1]
            break
        time.sleep(1)
    if not metro_url:
        print("no metro lhr", flush=True)
        return 5
    print("metro_url", metro_url, flush=True)
    if not verify(metro_url, "/status", "packager-status:running"):
        print("metro verify fail", flush=True)
        return 6

    from urllib.parse import quote

    host = metro_url.replace("https://", "")
    CONNECT.write_text(
        "\n".join(
            [
                f"TUNNEL_URL={metro_url}",
                f"MANUAL_1={host}:443",
                f"MANUAL_2={metro_url}",
                f"DEEP_LINK=exp+cozbil://expo-development-client/?url={quote(metro_url, safe='')}",
                "PROVIDER=localhost.run",
                "OK=1",
                f"SOLVE_PROXY_URL={proxy_url}",
                "",
            ]
        )
    )
    print(CONNECT.read_text(), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
