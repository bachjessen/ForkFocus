/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

const script = document.createElement("script");
script.src = browser.runtime.getURL(
  "popup/screens/privacyPolicy/privacyPolicyForTab.js"
);
document.head.appendChild(script);
