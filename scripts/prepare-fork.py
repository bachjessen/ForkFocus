from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
manifest_path = root / "manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest["version"] = "8.0.1"
manifest.setdefault("browser_specific_settings", {}).setdefault("gecko", {})["id"] = "forkfocus@simonbach.local"
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

for locale_root in ("_locales", "locales_chromium", "locales_safari"):
    for path in (root / locale_root).glob("*/messages.json"):
        messages = json.loads(path.read_text(encoding="utf-8"))
        if "extension_name" in messages:
            messages["extension_name"]["message"] = "ForkFocus"
            path.write_text(json.dumps(messages, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
