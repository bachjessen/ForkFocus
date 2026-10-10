from pathlib import Path

root = Path(__file__).resolve().parents[1]

def remove_range_if_present(text, start, end):
    if start not in text:
        return text
    start_index = text.index(start)
    if end not in text[start_index:]:
        return text
    end_index = text.index(end, start_index)
    return text[:start_index] + text[end_index:]

background_path = root / "background/background.js"
text = background_path.read_text(encoding="utf-8")
blocked_import_terms = (
    "safariEntitlementBridge", "serverContract", "cloudSync",
    "CLOUD_SYNC_ALARM", "serverUpdate", "SERVER_UPDATE_ALARM",
    "userAuth", "tokenSessionCoordinator", "optionsReleaseController",
    "safariTokenProvider",
)
text = "\n".join(
    line for line in text.splitlines()
    if not any(term in line for term in blocked_import_terms)
) + "\n"
for start, end in (
    ("function clearPublishedAuthSession", "const tabRuntimeUpdateCoordinator"),
    ("async function fetchCloudSettings", "const extensionTimerCoordinator"),
    ("const serverUpdateService", "function ensureRuntimeReady"),
    ("function tokenIdentityCommand", "void ensureRuntimeReady"),
    ("    if (alarm.name === CLOUD_SYNC_ALARM) {", "    if ([EXTENSION_BLOCK_ALARM, EXTENSION_ENABLE_ALARM].includes(alarm.name)) {"),
    ("  if (message?.action === USER_AUTH_MESSAGE_ACTION) {", "  if (message?.action === storageMutationContract.diagnosticsAction) {"),
    ("  if (message?.action === \"pullCloudSync\" || message?.action === \"pushCloudSync\") {", "  if (message?.action === \"scheduleExtensionTimer\") {"),
    ("  if (message?.action === \"checkServerUpdates\") {", "  if (message?.action === \"getRuntimeUpdateDiagnostics\") {"),
):
    text = remove_range_if_present(text, start, end)
text = text.replace("  await reconcileOptionsReleaseAccess();\n", "")
text = text.replace("    checkServerUpdates().catch(() => undefined),\n", "")
background_path.write_text(text, encoding="utf-8")

messaging_path = root / "popup/services/messagingService.js"
text = messaging_path.read_text(encoding="utf-8")
if "const browserApi" in text and "  ensureRuntimeReady" in text:
    text = text[text.index("const browserApi"):]
    export_index = text.index("export const messagingService")
    text = text[:export_index] + text[text.index("  ensureRuntimeReady", export_index):]
for line in (
    "  pullCloudSync: () => send(\"pullCloudSync\"),\n",
    "  pushCloudSync: () => send(\"pushCloudSync\"),\n",
    "  checkServerUpdates: ({ force = true } = {}) => send(\"checkServerUpdates\", { force }),\n",
):
    text = text.replace(line, "")
messaging_path.write_text("/** ForkFocus local-only messaging. */\n" + text, encoding="utf-8")

main_path = root / "popup/screens/main/main.js"
text = main_path.read_text(encoding="utf-8")
text = text.replace("export function createMainScreen(context) {", "export function createMainScreen() {")
text = text.replace(
    "    root.querySelectorAll(\".proButton\").forEach((button) => button.setAttribute(\"gradient\", String(gradient)));\n"
    "    root.querySelector(\".proButton\")?.addEventListener(\"click\", () => context.navigate(\"plusPromoScreen\"), { signal });\n",
    "",
)
main_path.write_text(text, encoding="utf-8")

more_path = root / "popup/screens/more/more.js"
text = more_path.read_text(encoding="utf-8")
text = text.replace('import { applyBrowserLinks } from "../../application/browserLinksPresenter.js";\n', "")
text = text.replace('import { messagingService } from "../../services/messagingService.js";\n', "")
for start, end in (
    ("function isSafari()", "export function createMoreScreen"),
    ("    const state = await storageSelectors.getPopupState();", "    root.querySelectorAll(\".popUpMenuList select\")"),
    ("    root.querySelector(\".popUpMenuListGroupHeaderContainer\")", "  }\n\n  function unmount"),
):
    text = remove_range_if_present(text, start, end)
text = text.replace("export function createMoreScreen(context) {", "export function createMoreScreen() {")
more_path.write_text(text, encoding="utf-8")

css_path = root / "popup/css/local-only.css"
css_path.write_text(css_path.read_text(encoding="utf-8").replace("#moreScreeen", "#moreScreen"), encoding="utf-8")
