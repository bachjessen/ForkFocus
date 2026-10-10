/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

import { systemBuckets } from "../../shared/constants/storageKeys.js";
import { storageMutations } from "../core/bootstrap.js";

export async function patchSystemBucket(bucket, patch, { sync = true } = {}) {
  await storageMutations.patchSystemBucket(bucket, patch, { sync });
}

export function patchExtensionUi(patch, options) {
  return patchSystemBucket(systemBuckets.extensionUiState, patch, options);
}
