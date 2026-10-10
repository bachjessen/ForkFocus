from pathlib import Path

selector = 'ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[has-expansion-button][show-bottom-divider] ytd-rich-item-renderer[is-shelf-item])'
root = Path.home() / 'Library/Application Support/zen/Profiles/ygjsu79f.Default (twilight)/storage/default/moz-extension+++18cb37f9-8072-4633-a2e7-0f50ff07f695^userContextId=4294967295/idb'
found = False
for path in sorted(root.glob('3647222921wleabcEoxlt-eengsairo.sqlite*')):
    data = path.read_bytes()
    matches = {
        'utf8': data.count(selector.encode('utf-8')),
        'utf16le': data.count(selector.encode('utf-16le')),
    }
    print(f'{path.name}: utf8={matches["utf8"]} utf16le={matches["utf16le"]}')
    found = found or any(matches.values())
raise SystemExit(0 if found else 1)
