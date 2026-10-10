from pathlib import Path
import json
import plistlib
import shutil

root = Path(__file__).resolve().parents[1]
app = Path("/Applications/Twilight.app")
with (app / "Contents/Info.plist").open("rb") as stream:
    assert plistlib.load(stream)["CFBundleIdentifier"] == "app.zen-browser.zen"
xpis = sorted((root / "web-ext-artifacts").glob("*.xpi"), key=lambda p: p.stat().st_mtime)
if not xpis:
    raise SystemExit("Run sign-forkfocus.py first")
target = Path.home() / "Library/Application Support/ForkFocus/forkfocus.xpi"
target.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(xpis[-1], target)
policy = {"policies": {"ExtensionSettings": {"forkfocus@simonbach.local": {"installation_mode": "normal_installed", "install_url": target.as_uri()}}}}
policy_path = app / "Contents/Resources/distribution/policies.json"
policy_path.parent.mkdir(parents=True, exist_ok=True)
policy_path.write_text(json.dumps(policy, indent=2) + "\n", encoding="utf-8")
print(policy_path)
