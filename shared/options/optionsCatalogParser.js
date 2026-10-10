/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

function normalizeCatalog(catalog) {
  if (Array.isArray(catalog)) {
    return {
      currentVersion:
        catalog.find((entry) => typeof entry?.currentVersion === "string")
          ?.currentVersion ?? "1.0.0",
      categories: catalog,
    };
  }

  if (!catalog || typeof catalog !== "object") {
    throw new TypeError("Options catalog must be an object or array");
  }

  if (!Array.isArray(catalog.data)) {
    throw new TypeError("Options catalog data must be an array");
  }

  return {
    currentVersion: catalog.currentVersion ?? "1.0.0",
    categories: catalog.data,
  };
}

function visitOptions(options, visitor, ancestry = []) {
  for (const option of options ?? []) {
    visitor(option, ancestry);
    visitOptions(option.childOnOptions, visitor, [...ancestry, option]);
    visitOptions(option.childOffOptions, visitor, [...ancestry, option]);
  }
}

function collectStyledOptions(groups, target, categoryId, isMobile) {
  for (const group of groups ?? []) {
    visitOptions(group.options, (option) => {
      if (!Array.isArray(option.styles) || option.styles.length === 0) return;
      target.push({
        category_id: categoryId,
        styles: option.styles,
        type: option.type,
        settings_id: option.id ?? option.settings_id,
        is_mobile: isMobile,
      });
    });
  }
}

export function parseOptionsCatalog(catalog) {
  const { currentVersion, categories } = normalizeCatalog(catalog);
  const desktopOptions = [];
  const mobileOptions = [];

  for (const category of categories) {
    if (category?.categoryId) {
      collectStyledOptions(
        category.categoryDesktopGroups,
        desktopOptions,
        category.categoryId,
        0,
      );
      collectStyledOptions(
        category.categoryMobileGroups,
        mobileOptions,
        category.categoryId,
        1,
      );
    }

    if (typeof category?.id === "string" && category.id.includes("global")) {
      if (Array.isArray(category.stylesDesktop) && category.stylesDesktop.length) {
        desktopOptions.push({
          category_id: "global",
          styles: category.stylesDesktop,
          type: category.type,
          settings_id: category.id,
          is_mobile: 0,
        });
      }
      if (Array.isArray(category.stylesMobile) && category.stylesMobile.length) {
        mobileOptions.push({
          category_id: "global",
          styles: category.stylesMobile,
          type: category.type,
          settings_id: category.id,
          is_mobile: 1,
        });
      }
    }
  }

  return { currentVersion, categories, desktopOptions, mobileOptions };
}

export function createOptionDefinitionsMap(catalog) {
  const { categories } = normalizeCatalog(catalog);
  const definitions = new Map();

  for (const category of categories) {
    for (const [platform, groups] of [
      ["desktop", category.categoryDesktopGroups],
      ["mobile", category.categoryMobileGroups],
    ]) {
      for (const group of groups ?? []) {
        visitOptions(group.options, (option, ancestry) => {
          const id = option.id ?? option.settings_id;
          if (!id) return;

          const existing = definitions.get(id) ?? {
            id,
            option,
            categoryId: category.categoryId ?? "global",
            groupIds: new Set(),
            platforms: new Set(),
            parentOptionIds: new Set(),
          };
          if (group.groupId) existing.groupIds.add(group.groupId);
          existing.platforms.add(platform);
          for (const parent of ancestry) {
            const parentId = parent.id ?? parent.settings_id;
            if (parentId) existing.parentOptionIds.add(parentId);
          }
          definitions.set(id, existing);
        });
      }
    }

    if (category.id) {
      definitions.set(category.id, {
        id: category.id,
        option: category,
        categoryId: "global",
        groupIds: new Set(),
        platforms: new Set(["desktop", "mobile"]),
        parentOptionIds: new Set(),
      });
    }
  }

  return definitions;
}

export function localizeCatalogValue(value, language = "en") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return value;
  return value[language] ?? value.en ?? value;
}
