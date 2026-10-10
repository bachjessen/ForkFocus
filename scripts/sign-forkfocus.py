from pathlib import Path
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
missing = [key for key in ("WEB_EXT_API_KEY", "WEB_EXT_API_SECRET") if not os.environ.get(key)]
if missing:
    print("Missing: " + ", ".join(missing), file=sys.stderr)
    raise SystemExit(2)
for args in (["npm", "test"], ["npm", "run", "lint"], ["npm", "run", "sign"]):
    subprocess.run(args, cwd=root, check=True)
xpis = sorted((root / "web-ext-artifacts").glob("*.xpi"), key=lambda p: p.stat().st_mtime)
if not xpis:
    raise SystemExit("Signing produced no XPI")
print(xpis[-1])
