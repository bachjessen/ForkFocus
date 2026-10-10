import sqlite3
from pathlib import Path

profile = Path.home() / "Library/Application Support/zen/Profiles/ygjsu79f.Default (twilight)"
for relative in ("storage.sqlite", "chrome_debugger_profile/storage.sqlite"):
    database = profile / relative
    if not database.is_file():
        continue
    connection = sqlite3.connect(f"file:{database}?mode=ro&immutable=1", uri=True, timeout=1)
    try:
        print(f"=== {database} ===")
        for table in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"):
            name = table[0]
            quoted = name.replace('"', '""')
            columns = [row[1] for row in connection.execute(f'PRAGMA table_info("{quoted}")')]
            for row in connection.execute(f'SELECT * FROM "{quoted}"'):
                text = str(row).lower()
                if "18cb37f9-8072-4633-a2e7-0f50ff07f695" in text or "forkfocus" in text:
                    print(name, columns, row)
    finally:
        connection.close()
