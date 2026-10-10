/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { storageKeys, systemBuckets } from "../../shared/constants/storageKeys.js";
import {
  createDailyLimitChoices,
  dailyLimitOptionId,
} from "./dailyLimitPresenter.js";
import { bindSelectRow } from "./selectPresenter.js";
import { setMasterToggleVisibility } from "./masterTogglePresenter.js";
import { messagingService } from "../services/messagingService.js";
import { optionsService } from "../services/optionsService.js";

async function runControlMutation(control, mutation) {
  if (control.dataset.runtimePending === "true") return;
  control.dataset.runtimePending = "true";
  control.disabled = true;
  try {
    await mutation();
  } catch {
    // optionsService already exposes an actionable runtime error in the popup.
  } finally {
    delete control.dataset.runtimePending;
    control.disabled = false;
  }
}

function createControl(option, categoryId, optionsState, dailyState, signal) {
  if (option.type === "groupTitle") return null;
  const wrapper = document.createElement("div"); wrapper.className = "optionWrapper";
  const label = document.createElement("label"); label.className = "label"; label.htmlFor = option.id;
  const title = document.createElement("span"); title.className = "labelSpan"; title.textContent = optionsService.localize(option.name);
  let control;
  if (option.type === "select") {
    const container = document.createElement("div"); container.className = "selectContainer";
    control = document.createElement("select"); control.className = "selectSelect"; control.id = option.id;
    const isDaily = option.id === dailyLimitOptionId;
    const stored = isDaily ? dailyState[`socialFocus_${categoryId}_dailyLimitDuration`] : optionsState[categoryId]?.[option.id];
    const choices = isDaily
      ? createDailyLimitChoices(option.selects)
      : option.selects ?? [];
    for (const choice of choices) { const item = document.createElement("option"); item.value = choice.id; item.textContent = optionsService.localize(choice.name); item.selected = choice.id == (stored ?? option.defaultValue); control.appendChild(item); }
    control.addEventListener("change", () => void runControlMutation(control, () =>
      isDaily
        ? optionsService.setDailyLimit(categoryId, control.value)
        : optionsService.setOption(categoryId, option.id, control.value)
    ), { signal });
    const select = control;
    const icon = document.createElement("i"); icon.className = "fa-solid fa-caret-down"; container.append(control, icon); control = container;
    bindSelectRow(select, { signal, row: wrapper });
  } else if (option.type === "checkbox") {
    const switchLabel = document.createElement("label"); switchLabel.className = "switchLabel switch";
    const input = document.createElement("input"); input.type = "checkbox"; input.className = "formCheckbox"; input.id = option.id;
    input.checked = optionsState[categoryId]?.[option.id] ?? option.defaultValue ?? false;
    input.addEventListener("change", () => {
      if (option.id.includes("master_toggle")) {
        setMasterToggleVisibility(
          input.closest(".collapsibleSection"),
          input.checked,
        );
      }
      void runControlMutation(input, () =>
        optionsService.setOption(categoryId, option.id, input.checked)
      );
    }, { signal });
    const slider = document.createElement("span"); slider.className = "slider round"; switchLabel.append(input, slider); control = switchLabel;
  }
  if (!control) return null; label.append(title, control); wrapper.appendChild(label); return wrapper;
}

function currentCategoryForUrl(url, available) {
  const mapping = [["facebook","facebook"],["instagram","instagram"],["linkedin","linkedin"],["reddit","reddit"],["twitter","twitter"],["x.com","twitter"],["mail.google","gmail"],["news.ycombinator","hacker-news"],["twitch","twitch"],["pinterest","pinterest"],["netflix","netflix"],["tiktok","tikTok"],["bsky.app","blueSky"]];
  return mapping.find(([fragment, id]) => url.includes(fragment) && available.has(id))?.[1] ?? (available.has("youtube") ? "youtube" : [...available][0]);
}

export async function renderOptions(root, { signal } = {}) {
  if (!root) throw new Error("main_screen_missing");
  const [categories, state, tabs] = await Promise.all([optionsService.loadCategories(), optionsService.getState(), messagingService.getCurrentTab()]);
  if (signal?.aborted) return;
  const picker = root.querySelector("#categoryPickerList"); const activeList = root.querySelector("#activeCategoryButtonList"); const container = root.querySelector("#settingsContainerDefault");
  if (!picker || !activeList || !container) throw new Error("main_screen_options_outlet_missing");
  picker.replaceChildren(); activeList.replaceChildren(); container.replaceChildren();
  const optionState = state[storageKeys.optionsState] ?? {}; const daily = state[storageKeys.system]?.[systemBuckets.dailyLimitData] ?? {};
  for (const category of categories) {
    const pickerItem = document.createElement("div"); pickerItem.className = "category"; pickerItem.textContent = optionsService.localize(category.categoryName); pickerItem.setAttribute("categoryId", category.categoryId); picker.appendChild(pickerItem);
    const picked = pickerItem.cloneNode(true); picked.className = "pickedCategory"; activeList.appendChild(picked);
    const section = document.createElement("div"); section.className = "collapsibleSection"; section.setAttribute("categoryId", category.categoryId);
    for (const group of category.categoryGroups) {
      const groupRoot = document.createElement("div"); groupRoot.className = "settingsGroup";
      if (category.categoryGroups.length > 1) { const heading = document.createElement("div"); heading.className = "optionsGroupTitle"; heading.textContent = optionsService.localize(group.groupName); groupRoot.appendChild(heading); }
      const body = document.createElement("div"); body.className = "settingsGroupBody";
      for (const option of group.options ?? []) { const rendered = createControl(option, category.categoryId, optionState, daily, signal); if (rendered) body.appendChild(rendered); }
      groupRoot.appendChild(body); section.appendChild(groupRoot);
    }
    const masterToggle = section.querySelector('input[id*="master_toggle"]');
    setMasterToggleVisibility(section, masterToggle?.checked === true);
    container.appendChild(section);
  }
  const available = new Set(categories.map((category) => category.categoryId));
  const selectCategory = (id) => {
    root.setAttribute("displayingCategoryId", id); root.setAttribute("categoryPickerIsShowing", "false");
    root.querySelectorAll(".collapsibleSection, .pickedCategory, #categoryPickerList .category").forEach((item) => {
      item.toggleAttribute("active", item.getAttribute("categoryId") === id);
    });
    const settings = root.querySelector("#settingsContainer");
    if (settings) settings.scrollTop = 0;
  };
  picker.querySelectorAll(".category").forEach((item) => item.addEventListener("click", () => selectCategory(item.getAttribute("categoryId")), { signal }));
  selectCategory(currentCategoryForUrl(tabs[0]?.url ?? "", available));
}
