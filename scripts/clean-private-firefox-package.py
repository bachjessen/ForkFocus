from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]

routes_path = root / "popup/constants/routes-constants.js"
routes_lines = routes_path.read_text(encoding="utf-8").splitlines()
remove_route_lines = {
    'import { createAccountScreen } from "../screens/account/accountManage/accountManage.js";',
    'import { createDeleteAccountScreen } from "../screens/account/delete-account/delete-account.js";',
    'import { createLoginScreen } from "../screens/account/proLogin/proLogin.js";',
    'import { createSignUpScreen } from "../screens/account/proSignUp/proSignUp.js";',
    'import { createResetPasswordScreen } from "../screens/account/reset-password/reset-password.js";',
    'import { createResetPasswordSuccessfulScreen } from "../screens/account/reset-password-success/reset-password-success.js";',
    'import { createVerificationScreen } from "../screens/verification/verification.js";',
    'import { createPlusPromoScreen } from "../screens/plusPromo/plusPromoScreen.js";',
    '  plusPromoScreen: createPlusPromoScreen,',
    '  accountManageScreen: createAccountScreen,',
    '  proLoginScreen: createLoginScreen,',
    '  proSignUpScreen: createSignUpScreen,',
    '  emailVerification: createVerificationScreen,',
    '  deleteAccountScreen: createDeleteAccountScreen,',
    '  resetPasswordScreen: createResetPasswordScreen,',
    '  resetPasswordSuccessfulScreen: createResetPasswordSuccessfulScreen,',
}
routes_path.write_text("\n".join(line for line in routes_lines if line not in remove_route_lines) + "\n", encoding="utf-8")

popup_path = root / "popup.html"
popup_lines = popup_path.read_text(encoding="utf-8").splitlines()
remove_style_paths = (
    "popup/screens/account/proLogin/proLogin.css",
    "popup/screens/account/proSignUp/proSignUp.css",
    "popup/screens/account/accountManage/accountManage.css",
    "popup/screens/verification/verification.css",
    "popup/screens/account/delete-account/delete-account.css",
    "popup/screens/account/reset-password/reset-password.css",
    "popup/screens/plusPromo/plusPromoScreen.css",
)
popup_path.write_text("\n".join(line for line in popup_lines if not any(path in line for path in remove_style_paths)) + "\n", encoding="utf-8")

startup_path = root / "popup/application/startupFlow.js"
startup = startup_path.read_text(encoding="utf-8")
startup = startup.replace('import { refreshNativeEntitlement } from "../scripts/appleMethods.js";\n', "")
startup = startup.replace('  await refreshNativeEntitlement(browserName);\n', "")
start = startup.index("export async function refreshPopupUserSession")
end = startup.index("\nfunction wait", start)
startup = startup[:start] + "export async function refreshPopupUserSession() {\n  return { refreshed: false, supported: false };\n}\n" + startup[end:]
startup = startup.replace('  navigate(local[localStateKeys.showVerification] ? "emailVerification" : "mainScreen");', '  navigate("mainScreen");')
startup_path.write_text(startup, encoding="utf-8")

bootstrap_path = root / "popup/core/bootstrap.js"
bootstrap = bootstrap_path.read_text(encoding="utf-8")
bootstrap = bootstrap.replace('  refreshPopupUserSession,\n', "")
bootstrap = bootstrap.replace('storageService.setSyncHook(() => messagingService.pushCloudSync());', 'storageService.setSyncHook(() => Promise.resolve({ synced: false, reason: "local_only" }));')
bootstrap = bootstrap.replace('  void refreshPopupUserSession({ browserName: environment.browser });\n', "")
bootstrap_path.write_text(bootstrap, encoding="utf-8")

package_path = root / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
ignored = [
    "tests", "scripts", "node_modules", "package.json", "package-lock.json",
    "AGENTS.md", "docs", "source", "manifestsFiles.txt",
    "locales_chromium", "locales_safari",
    "background/auth", "background/options", "background/platform/safariEntitlementBridge.js",
    "background/sync", "background/updates",
    "shared/api", "shared/auth", "shared/sync",
    "popup/application/accountFlow.js", "popup/application/authFlow.js",
    "popup/application/browserLinksPresenter.js",
    "popup/screens/account", "popup/screens/plusPromo", "popup/screens/verification",
    "popup/services/authService.js", "popup/scripts/appleMethods.js",
    "popup/images/untrapLogo.png", "popup/images/dumbPhoneLogo.png",
]
ignore_args = " ".join(ignored)
package["scripts"]["lint"] = f"web-ext lint --source-dir . --ignore-files {ignore_args}"
package["scripts"]["build"] = f"web-ext build --source-dir . --artifacts-dir web-ext-artifacts --overwrite-dest --ignore-files {ignore_args}"
package["scripts"]["sign"] = f"web-ext sign --source-dir . --artifacts-dir web-ext-artifacts --channel unlisted --ignore-files {ignore_args}"
package_path.write_text(json.dumps(package, indent=2) + "\n", encoding="utf-8")
