#!/usr/bin/env python3
import base64
import hashlib
import hmac
import json
import os
import secrets
import time
import urllib.request
from pathlib import Path

API_ROOT = "https://addons.mozilla.org/api/v5"
ADDON_ID = "forkfocus@simonbach.local"


def b64url(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def create_jwt(issuer: str, secret: str) -> str:
    now = int(time.time())
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "iss": issuer,
        "jti": secrets.token_hex(16),
        "iat": now,
        "exp": now + 60,
    }
    encoded_header = b64url(json.dumps(header, separators=(",", ":")).encode())
    encoded_payload = b64url(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{encoded_header}.{encoded_payload}".encode()
    signature = b64url(hmac.new(secret.encode(), signing_input, hashlib.sha256).digest())
    return f"{encoded_header}.{encoded_payload}.{signature}"


def api_json(url: str, token: str) -> dict:
    request = urllib.request.Request(
        url,
        headers={"Authorization": f"JWT {token}", "Accept": "application/json"},
    )
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def main() -> None:
    issuer = os.environ["AMO_JWT_ISSUER"]
    secret = os.environ["AMO_JWT_SECRET"]
    token = create_jwt(issuer, secret)
    addon = api_json(f"{API_ROOT}/addons/addon/{ADDON_ID}/", token)
    current = addon.get("current_version") or {}
    version = current.get("version")
    file_info = current.get("file") or {}
    download_url = file_info.get("url")
    if not version or not download_url:
        raise RuntimeError("AMO response did not contain an approved current version and file URL")

    output_dir = Path("release-artifacts")
    output_dir.mkdir(exist_ok=True)
    xpi_path = output_dir / f"forkfocus-{version}.xpi"
    request = urllib.request.Request(
        download_url,
        headers={"Authorization": f"JWT {create_jwt(issuer, secret)}"},
    )
    with urllib.request.urlopen(request) as response, xpi_path.open("wb") as output:
        output.write(response.read())

    digest = hashlib.sha256(xpi_path.read_bytes()).hexdigest()
    checksum_path = xpi_path.with_suffix(xpi_path.suffix + ".sha256")
    checksum_path.write_text(f"{digest}  {xpi_path.name}\n", encoding="utf-8")

    github_output = Path(os.environ["GITHUB_OUTPUT"])
    with github_output.open("a", encoding="utf-8") as output:
        output.write(f"version={version}\n")
        output.write(f"tag=amo-v{version}\n")
        output.write(f"xpi={xpi_path}\n")
        output.write(f"checksum={checksum_path}\n")
        output.write(f"sha256={digest}\n")


if __name__ == "__main__":
    main()
