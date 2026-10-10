/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const script = document.createElement("script");
script.src = browser.runtime.getURL(
  "popup/screens/privacyPolicy/privacyPolicyForTab.js"
);
document.head.appendChild(script);
