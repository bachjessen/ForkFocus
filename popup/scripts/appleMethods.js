/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { storageMutations } from "../core/bootstrap.js";
import { messagingService } from "../services/messagingService.js";
import { uiStateService } from "../services/uiStateService.js";

export async function refreshNativeEntitlement(browserName) {
  if (browserName !== "safari") return { refreshed: false, supported: false };

  let response;
  try {
    response = await messagingService.getNativeEntitlement();
  } catch (error) {
    return {
      refreshed: false,
      supported: true,
      error: error?.message ?? "native_entitlement_unavailable",
    };
  }
  if (response?.supported !== true || response.error) {
    return {
      refreshed: false,
      supported: response?.supported === true,
      error: response?.error,
    };
  }

  const isPro = response.isPRO === true;
  const uuid = typeof response.uuid === "string" ? response.uuid : "";
  const email = typeof response.email === "string" ? response.email : "";
  await storageMutations.applyNativeEntitlement({ isPro, uuid, email });
  uiStateService.setProState(isPro);
  uiStateService.setLoginState(Boolean(uuid));
  globalThis.app_isPRO = isPro ? "true" : "false";
  globalThis.app_isLogin = uuid ? "true" : "false";
  return { refreshed: true, supported: true, isPro, uuid, email };
}
