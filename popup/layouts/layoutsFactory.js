/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { createBlankLayout } from "./blank/blankLayout.js";
import { createDefaultLayout } from "./default/defaultLayout.js";

const layouts = Object.freeze({ default: createDefaultLayout, blank: createBlankLayout });
export function getLayout(name, context) {
  const factory = layouts[name] ?? layouts.default;
  return () => factory(context);
}
