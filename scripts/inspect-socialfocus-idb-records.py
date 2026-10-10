import json
import sqlite3
from pathlib import Path

database = Path.home() / "Library/Application Support/zen/Profiles/ygjsu79f.Default (twilight)/storage/default/moz-extension+++05008a6a-4d42-4412-ae85-f40a5b17646f^userContextId=4294967295/idb/3647222921wleabcEoxlt-eengsairo.sqlite"
connection = sqlite3.connect(f"file:{database}?mode=ro&immutable=1", uri=True, timeout=1)
try:
    stores = connection.execute("SELECT id, name, key_path, auto_increment FROM object_store ORDER BY id").fetchall()
    objects = connection.execute("SELECT object_store_id, hex(key), length(data), hex(data) FROM object_data ORDER BY object_store_id, key").fetchall()
    print(json.dumps({"object_stores": stores, "objects": objects}, indent=2))
finally:
    connection.close()
