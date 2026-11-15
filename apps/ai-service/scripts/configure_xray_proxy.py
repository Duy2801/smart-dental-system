"""Configure the existing backend Nginx site; validate and roll back on failure."""

import argparse
import hashlib
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path


MARKER = "# Managed by Smart Dental: X-ray timeout"
MANAGED_DIRECTIVE = re.compile(
    r"\n[ \t]*" + re.escape(MARKER) + r"\n[ \t]*proxy_read_timeout \d+s;"
)
SERVER_NAME = re.compile(r"(?m)^([ \t]*)server_name\s+([^;\n]+);[ \t]*$")


def configure(content: str, domain: str, timeout_seconds: int) -> str:
    original = MANAGED_DIRECTIVE.sub("", content)
    matches = [
        match for match in SERVER_NAME.finditer(original)
        if domain in match.group(2).split()
    ]
    if not matches:
        return content
    if re.search(r"(?m)^\s*proxy_read_timeout\s", original):
        raise ValueError("Existing manual proxy_read_timeout requires review")

    def replace(match: re.Match) -> str:
        if domain not in match.group(2).split():
            return match.group(0)
        indent = match.group(1)
        return (
            match.group(0)
            + f"\n{indent}{MARKER}\n{indent}proxy_read_timeout {timeout_seconds}s;"
        )

    return SERVER_NAME.sub(replace, original)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--domain", required=True)
    parser.add_argument("--timeout-seconds", type=int, default=260)
    args = parser.parse_args()
    if args.timeout_seconds <= 0:
        parser.error("timeout must be positive")

    configuration = subprocess.check_output(
        ["nginx", "-T"], text=True, stderr=subprocess.PIPE
    )
    files = re.split(r"(?m)^# configuration file (.+):\n", configuration)
    changes = {}
    for index in range(1, len(files), 2):
        path = Path(files[index]).resolve()
        if not path.is_relative_to(Path("/etc/nginx")) or not path.is_file():
            continue
        content = path.read_text()
        updated = configure(content, args.domain, args.timeout_seconds)
        if updated != content:
            changes[path] = (content, updated)

    if not changes:
        expected = f"proxy_read_timeout {args.timeout_seconds}s;"
        if MARKER in configuration and expected in configuration:
            print("Nginx X-ray timeout already configured")
            return
        raise RuntimeError("Backend Nginx site was not found; no files changed")

    backup_root = Path("/var/backups/smart-dental-nginx")
    backup_root.mkdir(parents=True, exist_ok=True, mode=0o700)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    for path in changes:
        suffix = hashlib.sha256(str(path).encode()).hexdigest()[:12]
        shutil.copy2(path, backup_root / f"{stamp}-{suffix}-{path.name}")

    try:
        for path, (_, updated) in changes.items():
            path.write_text(updated)
        subprocess.run(["nginx", "-t"], check=True, capture_output=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True, capture_output=True)
    except Exception:
        for path, (content, _) in changes.items():
            path.write_text(content)
        subprocess.run(["nginx", "-t"], check=True, capture_output=True)
        subprocess.run(["systemctl", "reload", "nginx"], check=True, capture_output=True)
        raise RuntimeError("Nginx update failed; previous configuration restored") from None
    print(f"Nginx backend read timeout: {args.timeout_seconds}s; config validated and reloaded")


if __name__ == "__main__":
    main()
