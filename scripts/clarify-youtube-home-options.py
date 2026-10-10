import json
import sys
from pathlib import Path

phase = sys.argv[1]
if phase == "rename":
    source = Path("content/js/sites/youtube/logoSubscriptions.js")
    target = Path("content/js/sites/youtube/homeNavigation.js")
    source.rename(target)
    path = Path("manifest.json")
    data = json.loads(path.read_text())
    scripts = data["content_scripts"][1]["js"]
    scripts[scripts.index("content/js/sites/youtube/logoSubscriptions.js")] = "content/js/sites/youtube/homeNavigation.js"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
elif phase == "labels":
    path = Path("shared/options/options.json")
    data = json.loads(path.read_text())
    youtube = next(x for x in data["data"] if x["categoryId"] == "youtube")
    group = next(x for x in youtube["categoryDesktopGroups"] if x["groupId"] == "options")
    labels = {
        "socialFocus_youtube_hide_home_button": {"da": "Skjul Startside", "en": "Hide Home"},
        "socialFocus_youtube_logo_opens_subscriptions": {"da": "Logo åbner Abonnementer", "en": "Logo Opens Subscriptions"},
        "socialFocus_youtube_hide_subscriptions_most_relevant": {"da": "Skjul Mest relevant", "en": "Hide Most Relevant"},
    }
    for option in group["options"]:
        if option["id"] in labels:
            option["name"] = labels[option["id"]]
    data["currentVersion"] = "1.0.13"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
else:
    raise SystemExit(phase)
