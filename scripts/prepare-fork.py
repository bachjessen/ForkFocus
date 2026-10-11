from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
manifest_path = root / "manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
manifest.setdefault("browser_specific_settings", {}).setdefault("gecko", {})["id"] = "forkfocus@simonbach.local"
manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

for locale_root in ("_locales", "locales_chromium", "locales_safari"):
    for path in (root / locale_root).glob("*/messages.json"):
        messages = json.loads(path.read_text(encoding="utf-8"))
        changed = False
        for entry in messages.values():
            if isinstance(entry, dict) and isinstance(entry.get("message"), str):
                updated = entry["message"].replace("SocialFocus", "ForkFocus")
                if updated != entry["message"]:
                    entry["message"] = updated
                    changed = True
        if changed:
            path.write_text(json.dumps(messages, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")

for relative_path in (
    "popup/constants/html-templates.js",
    "popup/scripts/screenTranslation.js",
    "popup/application/startupError.js",
    "iframes/privacy-policy.html",
    "shared/options/options.json",
):
    path = root / relative_path
    text = path.read_text(encoding="utf-8")
    updated = text.replace("SocialFocus", "ForkFocus")
    if updated != text:
        path.write_text(updated, encoding="utf-8")

product_config_path = root / "shared/product/productConfig.js"
product_config = product_config_path.read_text(encoding="utf-8")
product_config = product_config.replace('name: "SocialFocus",', 'name: "ForkFocus",')
product_config_path.write_text(product_config, encoding="utf-8")
