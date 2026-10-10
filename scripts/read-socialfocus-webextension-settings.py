import json
import sqlite3
from pathlib import Path

database = Path.home() / "Library/Application Support/zen/Profiles/ygjsu79f.Default (twilight)/storage-sync-v2.sqlite"
connection = sqlite3.connect(f"file:{database}?mode=ro&immutable=1", uri=True, timeout=1)
try:
    tables = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")]
    result = {}
    for table in tables:
        quoted = table.replace('"', '""')
        columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{quoted}")')]
        rows = connection.execute(f'SELECT * FROM "{quoted}"').fetchall()
        matches = [
            row for row in rows
            if "26b4f076-089c-4c69-8497-44b7e5c9faef" in str(row).lower()
            or "socialfocus" in str(row).lower()
        ]
        if matches:
            result[table] = {"columns": columns, "rows": matches}
    print(json.dumps(result, indent=2, default=str))
finally:
    connection.close()
