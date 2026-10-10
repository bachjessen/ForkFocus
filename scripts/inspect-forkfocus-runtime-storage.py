import json
import sqlite3
from pathlib import Path

needle = "socialFocus_youtube_hide_subscriptions_most_relevant"
database = Path.home() / "Library/Application Support/zen/Profiles/ygjsu79f.Default (twilight)/storage-sync-v2.sqlite"
connection = sqlite3.connect(f"file:{database}?mode=ro&immutable=1", uri=True, timeout=1)
try:
    matches = []
    tables = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")]
    for table in tables:
        quoted = table.replace('"', '""')
        columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{quoted}")')]
        for row in connection.execute(f'SELECT * FROM "{quoted}"'):
            text = str(row)
            if needle in text or "socialfocus_RuntimeSnapshot" in text or "socialfocus_LifecycleMeta" in text or "socialfocus_RemoteOptionsData" in text:
                matches.append({"table": table, "columns": columns, "row": row})
    print(json.dumps(matches, indent=2, default=str))
finally:
    connection.close()
