#!/usr/bin/env python3
import json
import os
import urllib.request

AMO_URL = "https://addons.mozilla.org/api/v5/addons/addon/socialfocus/"
EXPECTED_GUID = "{26b4f076-089c-4c69-8497-44b7e5c9faef}"


def request_json(url, headers, data=None):
    request = urllib.request.Request(url, headers=headers, data=data)
    with urllib.request.urlopen(request) as response:
        return json.load(response)


def main():
    public_headers = {
        "Accept": "application/json",
        "User-Agent": "ForkFocus upstream monitor",
    }
    addon = request_json(AMO_URL, public_headers)
    if addon.get("slug") != "socialfocus" or addon.get("guid") != EXPECTED_GUID:
        raise RuntimeError("Unexpected AMO add-on identity")

    current = addon.get("current_version") or {}
    file_info = current.get("file") or {}
    version = current.get("version")
    xpi_url = file_info.get("url")
    file_hash = file_info.get("hash")
    if not version or not xpi_url or not file_hash:
        raise RuntimeError("Missing SocialFocus version metadata")

    title = f"SocialFocus {version} available for upstream review"
    repository = os.environ["GITHUB_REPOSITORY"]
    token = os.environ["GITHUB_TOKEN"]
    issues_url = f"https://api.github.com/repos/{repository}/issues"
    github_headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "User-Agent": "ForkFocus upstream monitor",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    issues = request_json(issues_url + "?state=all&per_page=100", github_headers)
    if any(issue.get("title") == title for issue in issues):
        print(f"Existing notification found for SocialFocus {version}")
        return

    body = "\n".join([
        "A new public SocialFocus version is available for manual upstream review.",
        "",
        f"- Version: {version}",
        f"- AMO reviewed: {current.get('reviewed') or 'not supplied'}",
        f"- AMO hash: `{file_hash}`",
        f"- Listing: {addon.get('url')}",
        f"- Public XPI: {xpi_url}",
        "",
        "Review and port relevant changes manually. Do not merge package contents automatically; AMO lists SocialFocus as All Rights Reserved.",
    ])
    payload = json.dumps({"title": title, "body": body}).encode()
    request_json(issues_url, github_headers, payload)
    print(f"Created notification for SocialFocus {version}")


if __name__ == "__main__":
    main()
