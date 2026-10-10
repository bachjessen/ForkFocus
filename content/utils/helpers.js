/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

function getSiteInfo(href = location.href) {
  for (const website of WEBSITES) {
    for (const domain of website.domain) {
      if (href.includes(domain)) {
        return website;
      }
    }
  }
  return null;
}

function isMobileVersion() {
  const mobileSelectors = getSiteInfo()?.mobileSelectorCheck ?? [];

  if (mobileSelectors) {
    var found = false;

    for (const mobileSelector of mobileSelectors) {
      if (mobileSelector != "") {
        const checkSelect = document.querySelector(mobileSelector);
        if (checkSelect) {
          found = true;
          break;
        }
      }
    }

    return found;
  } else {
    return false;
  }
}

function getKeyIdentifier(event) {
  const modifiers = ["Control", "Shift", "Alt", "Meta"];
  return modifiers.includes(event.key) ? event.key : event.code;
}

function isUserAgentMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
}

function minutesToSeconds(minutes) {
  return Number(minutes) * 60;
}
