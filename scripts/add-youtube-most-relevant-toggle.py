import json
from pathlib import Path

path = Path("shared/options/options.json")
data = json.loads(path.read_text(encoding="utf-8"))
anchor_id = "socialFocus_youtube_hide_home_recommended_videos"
new_id = "socialFocus_youtube_hide_subscriptions_most_relevant"
new_option = {
    "type": "checkbox",
    "name": {
        "da": "Skjul Mest relevant på abonnementssiden",
        "en": "Hide Most Relevant on Subscriptions Page",
    },
    "id": new_id,
    "defaultValue": False,
    "styles": [
        'ytd-browse[page-subtype="subscriptions"] ytd-rich-section-renderer:has(> #content > ytd-rich-shelf-renderer[has-expansion-button][show-bottom-divider] > #dismissible > #contents > ytd-rich-item-renderer[is-shelf-item])'
    ],
}

inserted = False

def visit(value):
    global inserted
    if inserted:
        return
    if isinstance(value, list):
        if any(isinstance(item, dict) and item.get("id") == new_id for item in value):
            inserted = True
            return
        for index, item in enumerate(value):
            if isinstance(item, dict) and item.get("id") == anchor_id:
                value.insert(index + 1, new_option)
                inserted = True
                return
        for item in value:
            visit(item)
            if inserted:
                return
    elif isinstance(value, dict):
        for item in value.values():
            visit(item)
            if inserted:
                return

visit(data)
if not inserted:
    raise RuntimeError("Desktop YouTube insertion point not found")
path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
