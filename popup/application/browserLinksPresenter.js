/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

const browserLinks = Object.freeze({
  safari: Object.freeze({
    rate: "https://apps.apple.com/app/id1661093205?action=write-review",
    untrap: "https://apps.apple.com/app/untrap-for-youtube/id1637438059",
  }),
  firefox: Object.freeze({
    rate: "https://addons.mozilla.org/firefox/addon/socialfocus/",
    untrap: "https://addons.mozilla.org/firefox/addon/untrap-for-youtube/",
  }),
  edge: Object.freeze({
    rate: "https://microsoftedge.microsoft.com/addons/detail/socialfocus-hide-distrac/dkkbdagpdnmdakbbchbicnfcoifbdlfc",
    untrap: "https://microsoftedge.microsoft.com/addons/detail/untrap-for-youtube/ngnefladcohhmmibccafkdbcijjoppdo",
  }),
  chrome: Object.freeze({
    rate: "https://chromewebstore.google.com/detail/socialfocus/abocjojdmemdpiffeadpdnicnlhcndcg",
    untrap: "https://chromewebstore.google.com/detail/enboaomnljigfhfjfoalacienlhjlfil",
  }),
});

export function linksForBrowser(browserName) {
  return browserLinks[browserName] ?? browserLinks.chrome;
}

export function applyBrowserLinks(root, browserName) {
  const links = linksForBrowser(browserName);
  root.querySelector(".dynamic-rate-link")?.setAttribute("href", links.rate);
  root.querySelector(".dynamic-socialfocus-link")?.setAttribute("href", links.untrap);
  return links;
}
