/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

function groupsFor(category, mobile) {
  return mobile ? category.categoryMobileGroups : category.categoryDesktopGroups;
}

function nameFor(category, mobile) {
  return mobile ? category.categoryMobileName : category.categoryDesktopName;
}

export function createPopupCategories(catalog, { mobile = false } = {}) {
  if (!Array.isArray(catalog?.data)) throw new Error("options_catalog_data_invalid");
  return catalog.data
    .map((category) => ({
      categoryId: category.categoryId,
      categoryName: nameFor(category, mobile),
      categoryGroups: groupsFor(category, mobile) ?? [],
    }))
    .filter((category) => category.categoryId && category.categoryGroups.length);
}
