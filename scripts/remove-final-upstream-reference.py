from pathlib import Path
root = Path(__file__).resolve().parents[1]
path = root / "popup/constants/html-templates.js"
text = path.read_text(encoding="utf-8")
text = text.replace("https://untrap.app/donate/", "")
path.write_text(text, encoding="utf-8")
