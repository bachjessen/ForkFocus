/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { storageKeys } from "../../shared/constants/storageKeys.js";
import { storageMutations } from "../core/bootstrap.js";
import { messagingService } from "./messagingService.js";
import { storageService } from "./storageService.js";
import { localizationService } from "./localizationService.js";
import { createPopupCategories } from "../application/optionsCatalog.js";
import { getDailyLimitRuntimeAction } from "../application/dailyLimitPresenter.js";
import {
  clearRuntimeActionError,
  reportRuntimeActionError,
} from "../application/runtimeActionFeedback.js";

function assertRuntimeReady(readiness) {
  if (readiness?.ready !== true) {
    throw new Error(readiness?.error ?? "runtime_not_ready");
  }
  return readiness;
}

let optionMutationQueue = Promise.resolve();

function scheduleOptionMutation(mutation) {
  const operation = optionMutationQueue.then(mutation, mutation);
  optionMutationQueue = operation.catch(() => undefined);
  return operation;
}

export async function rebuildAndConfirmRuntime() {
  try {
    const readiness = assertRuntimeReady(
      await messagingService.ensureRuntimeReady({ forceSnapshot: true }),
    );
    const expectedRevision = readiness.snapshot?.revision;
    const delivery = await messagingService.sendToActiveTab({
      action: "applyRuntime",
      expectedRevision,
    });
    if (
      delivery.supported === true &&
      (delivery.delivered !== true ||
        delivery.response?.applied !== true ||
        delivery.response?.revision < expectedRevision)
    ) {
      throw new Error(
        delivery.response?.error ??
          delivery.error ??
          `active_page_runtime_unconfirmed expected=${expectedRevision} actual=${delivery.response?.revision ?? "none"} errors=${delivery.response?.errors ?? "unknown"}`,
      );
    }
    clearRuntimeActionError();
    return readiness;
  } catch (error) {
    reportRuntimeActionError(error);
    throw error;
  }
}

async function loadCatalog() {
  const response = await fetch((globalThis.browser ?? globalThis.chrome).runtime.getURL("shared/options/options.json"));
  if (!response.ok) throw new Error(`options_catalog_${response.status}`);
  return response.json();
}
export const optionsService = Object.freeze({
  async loadCategories() {
    const catalog = await loadCatalog(); const mobile = document.documentElement.getAttribute("device") === "phone";
    return createPopupCategories(catalog, { mobile });
  },
  async getState() { return storageService.get([storageKeys.optionsState, storageKeys.system]); },
  async setOption(categoryId, optionId, value) {
    return scheduleOptionMutation(async () => {
      await storageMutations.patchOptionsCategory(categoryId, { [optionId]: value });
      await rebuildAndConfirmRuntime();
    });
  },
  async setDailyLimit(categoryId, value) {
    return scheduleOptionMutation(async () => {
      const result = await storageMutations.configureDailyLimit({
        categoryId,
        duration: value,
      });
      await rebuildAndConfirmRuntime();
      const action = getDailyLimitRuntimeAction({
        duration: result.duration,
        elapsedSeconds: result.lastedTime,
      });
      const delivery = await messagingService.sendToActiveTab({
        action,
        categoryId,
      });
      if (delivery.supported === true && delivery.delivered !== true) {
        const error = new Error(
          delivery.error ?? "daily_limit_runtime_unconfirmed",
        );
        reportRuntimeActionError(error);
        throw error;
      }
      return result;
    });
  },
  localize: (value) => localizationService.localize(value),
});
