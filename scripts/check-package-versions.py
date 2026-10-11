import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
manifest_version = json.loads((root / "manifest.json").read_text(encoding="utf-8"))["version"]
package_version = json.loads((root / "package.json").read_text(encoding="utf-8"))["version"]

if manifest_version != package_version:
    raise SystemExit(
        f"Version mismatch: manifest.json={manifest_version}, package.json={package_version}"
    )

print(manifest_version)
