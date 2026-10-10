from pathlib import Path

root = Path(__file__).resolve().parents[1]
p = root / "popup/constants/html-templates.js"
t = p.read_text(encoding="utf-8")

def remove_element_before(text, token, next_token):
    token_pos = text.index(token)
    start = text.rfind("&lt;div", 0, token_pos)
    next_pos = text.index(next_token, token_pos)
    end = text.rfind("&lt;div", 0, next_pos)
    if start < 0 or end <= start:
        raise RuntimeError(f"Invalid element bounds for {token}")
    return text[:start] + text[end:]

def remove_range(text, start_token, end_token):
    start = text.index(start_token)
    end = text.index(end_token, start)
    return text[:start] + text[end:]

# Main-screen Plus badge and upgrade button.
t = remove_element_before(t, "proBadge", "topHeaderRight")
t = remove_element_before(t, "pro-block-want-more-header", "Settings Container")

# Entire Plus promotion template.
t = remove_range(t, '  "plusPromoScreen": ', '  "moreScreen": ')

# Work only inside the More screen template.
more_start = t.index('  "moreScreen": ')
more_end = t.index('  "', more_start + len('  "moreScreen": '))
more = t[more_start:more_end]

# Header support, rating, donation, and store links.
header_token = "headerRightLinks"
header_pos = more.index(header_token)
header_start = more.rfind("&lt;div", 0, header_pos)
body_pos = more.index("popUpBody", header_pos)
body_start = more.rfind("&lt;div", 0, body_pos)
more = more[:header_start] + more[body_start:]

# Account, cloud sync, and offer panel.
profile_pos = more.index("profileInfo")
commercial_start = more.rfind("&lt;div", 0, profile_pos)
local_settings_pos = more.index("passwordLockingScreen", profile_pos)
local_settings_start = more.rfind("&lt;div", 0, local_settings_pos)
more = more[:commercial_start] + more[local_settings_start:]

# My Apps heading and advertisements.
apps_pos = more.index("popUpMenuListGroupHeaderContainer")
apps_start = more.rfind("&lt;div", 0, apps_pos)
closing = r"&lt;/div&gt;\n    &lt;/div&gt;\n  &lt;/div&gt;"
closing_pos = more.rfind(closing)
if closing_pos <= apps_start:
    raise RuntimeError("Could not locate More screen closing markup")
more = more[:apps_start] + more[closing_pos:]

t = t[:more_start] + more + t[more_end:]
p.write_text(t, encoding="utf-8")

p = root / "shared/product/productConfig.js"
t = p.read_text(encoding="utf-8")
for capability in ("authentication", "cloudSync", "entitlement"):
    old = f"{capability}: true,"
    if old not in t:
        raise RuntimeError(f"Expected enabled capability: {capability}")
    t = t.replace(old, f"{capability}: false,", 1)
p.write_text(t, encoding="utf-8")
