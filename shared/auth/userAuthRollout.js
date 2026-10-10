/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

// Token logins can fall back to the legacy flow only when the backend returns
// one of the explicit rollout-gate codes. SocialFocus remains excluded from
// production token-session creation until the server allowlist is expanded.
export const USER_AUTH_V2_LOGIN_ENABLED = true;
