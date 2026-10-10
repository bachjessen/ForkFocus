import json
import sqlite3
from pathlib import Path

database = Path.home() / "Library/Application Support/zen/Profiles/ygjsu79f.Default (twilight)/storage/default/https+++socialfocus.app/ls/data.sqlite"
connection = sqlite3.connect(f"file:{database}?mode=ro", uri=True, timeout=1)
try:
    tables = [row[0] for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")]
    result = {}
    for table in tables:
        quoted = table.replace('"', '""')
        columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{quoted}")')]
        rows = connection.execute(f'SELECT * FROM "{quoted}"').fetchall()
        result[table] = {"columns": columns, "rows": rows}
    print(json.dumps(result, indent=2, default=str))
finally:
    connection.close()
