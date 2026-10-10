/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import {
  createOptionDefinitionsMap,
  parseOptionsCatalog,
} from "../../shared/options/optionsCatalogParser.js";

export async function loadBundledOptions(browserApi) {
  const response = await fetch(
    browserApi.runtime.getURL("shared/options/options.json"),
  );
  if (!response.ok) throw new Error(`bundled_options_${response.status}`);

  const catalog = await response.json();
  const parsed = parseOptionsCatalog(catalog);
  return {
    catalog,
    definitions: createOptionDefinitionsMap(catalog),
    optionsVersion: parsed.currentVersion,
    remoteOptionsData: {
      desktop: parsed.desktopOptions,
      mobile: parsed.mobileOptions,
    },
  };
}
