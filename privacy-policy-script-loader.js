/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

const script = document.createElement("script");
script.src = browser.runtime.getURL(
  "popup/screens/privacyPolicy/privacyPolicyForTab.js"
);
document.head.appendChild(script);
