from pathlib import Path

root = Path.home() / "Library/Application Support/zen/Profiles"
if not root.is_dir():
    raise SystemExit(f"Zen profiles directory not found: {root}")
for path in sorted(root.rglob("*.sqlite")):
    print(path)
