/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import "../../shared/runtime/storageMutationContract.js";
import { createOptionDefinitionsMap, localizeCatalogValue, parseOptionsCatalog } from "../../shared/options/optionsCatalogParser.js";
import {
  preparePopupRuntime,
  refreshPopupUserSession,
  runStartupRouting,
} from "../application/startupFlow.js";
import { uiStateService } from "../services/uiStateService.js";
import { storageService } from "../services/storageService.js";
import { messagingService } from "../services/messagingService.js";
import { localizationService } from "../services/localizationService.js";
import { environmentService } from "../services/environmentService.js";
import { createStorageMutations } from "../../shared/storage/storageMutations.js";
import { createStorageSelectors } from "../../shared/storage/storageSelectors.js";
import { initializeRouter, navigate } from "./router.js";
import { renderStartupError } from "../application/startupError.js";
import { installRuntimeActionErrorBoundary } from "../application/runtimeActionFeedback.js";

installRuntimeActionErrorBoundary();

globalThis.SocialFocusShared = Object.freeze({
  ...(globalThis.SocialFocusShared ?? {}),
  optionsCatalog: Object.freeze({ createOptionDefinitionsMap, localizeCatalogValue, parseOptionsCatalog }),
});

storageService.setSyncHook(() => messagingService.pushCloudSync());
export const storageMutations = createStorageMutations({ storageService });
export const storageSelectors = createStorageSelectors({ storageService });

async function bootstrap() {
  uiStateService.setBootstrapState("preparing");
  const environment = environmentService.initialize();
  await preparePopupRuntime({ browserName: environment.browser });
  globalThis.app_browser = environment.browser;
  globalThis.app_device = environment.device;
  globalThis.app_isPRO = document.documentElement.getAttribute("isPRO") ?? "false";
  globalThis.app_isLogin = document.documentElement.getAttribute("isLogin") ?? "false";
  const root = document.getElementById("app");
  if (!root) throw new Error("Popup root #app is missing");
  const locale = await localizationService.resolveLanguage();
  globalThis.app_language = locale.language;
  initializeRouter();
  await runStartupRouting({ navigate });
  uiStateService.setBootstrapState("ready");
  void refreshPopupUserSession({ browserName: environment.browser });
}

void bootstrap().catch((error) => {
  console.error("SocialFocus popup bootstrap failed:", error);
  uiStateService.setBootstrapState("error");
  renderStartupError(error);
});
