/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

function detectBrowser(agent) {
  if (agent.includes("Safari") && !agent.includes("Chrome") && !agent.includes("Edge")) return "safari";
  if (/Edg|Edge/.test(agent)) return "edge";
  if (/firefox|fxios/i.test(agent)) return "firefox";
  if (agent.includes("Whale")) return "whale";
  return "chrome";
}
function detectDevice(agent) {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent) ? "phone" : "laptop";
}
export const environmentService = Object.freeze({
  initialize() {
    const agent = navigator.userAgent ?? "";
    const browser = detectBrowser(agent); const device = detectDevice(agent);
    document.documentElement.setAttribute("browser", browser);
    document.documentElement.setAttribute("device", device);
    return { browser, device };
  },
});
