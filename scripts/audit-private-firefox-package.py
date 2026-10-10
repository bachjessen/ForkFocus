from pathlib import Path
import posixpath
import re
import zipfile

archive = Path("web-ext-artifacts/forkfocus-8.0.1.zip")
forbidden_paths = ("background/auth/", "background/options/", "background/sync/", "background/updates/", "shared/api/", "shared/auth/", "shared/sync/", "popup/screens/account/", "popup/screens/plusPromo/", "popup/screens/verification/", "locales_chromium/", "locales_safari/", "scripts/", "docs/", "source/")
forbidden_text = ("untrap.app", "socialfocus.app/offer", "socialfocus://plus", "pushCloudSync", "pullCloudSync", "userAuthApi", "createTokenSessionCoordinator", "createCloudSyncCoordinator", "createServerUpdateService")
pattern = re.compile(r"(?:import|export)\s+(?:[^;]*?\s+from\s+)?[\"']([^\"']+)[\"']")
with zipfile.ZipFile(archive) as package:
    names = set(package.namelist())
    path_hits = sorted(name for name in names if any(name.startswith(prefix) for prefix in forbidden_paths))
    text_hits, missing = [], []
    for name in sorted(names):
        if not name.endswith((".js", ".json", ".html", ".css")): continue
        try: text = package.read(name).decode("utf-8")
        except UnicodeDecodeError: continue
        text_hits.extend(f"{name}: {marker}" for marker in forbidden_text if marker in text)
        if not name.endswith(".js"): continue
        base = posixpath.dirname(name)
        for specifier in pattern.findall(text):
            if not specifier.startswith("."): continue
            target = posixpath.normpath(posixpath.join(base, specifier))
            candidates = {target, target + ".js", target.rstrip("/") + "/index.js"}
            if not candidates & names: missing.append(f"{name} -> {specifier}")
print(f"archive files: {len(names)}")
print(f"forbidden paths: {len(path_hits)}")
for item in path_hits: print(f"PATH {item}")
print(f"forbidden text references: {len(text_hits)}")
for item in text_hits: print(f"TEXT {item}")
print(f"missing relative imports: {len(set(missing))}")
for item in sorted(set(missing)): print(f"IMPORT {item}")
if path_hits or text_hits or missing: raise SystemExit(1)
