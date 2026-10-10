/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *
 * This source code is proprietary and confidential.
 * Unauthorized copying, modification, distribution, or use is strictly prohibited.
 */

import { htmlTemplates } from "../../constants/html-templates.js";
import { exportSettings, importSettings, resetSettings } from "../../application/importExportFlow.js";
import { createScreenElement } from "../screenFactory.js";
import { messagingService } from "../../services/messagingService.js";

function createOptionsReleaseSection() {
  const section = document.createElement("section");
  section.className = "optionsReleaseSection";
  section.hidden = true;
  section.innerHTML = `
    <div class="optionsReleaseHeading">
      <div>
        <p class="instructionLabel">Options release <span class="testerBadge">Tester</span></p>
        <p class="instructionSubLabel">Apply any production or tester version. Historical versions stay pinned until you return to automatic updates.</p>
      </div>
    </div>
    <select class="textField" id="optionsReleaseSelect"></select>
    <button type="button" class="submitButton" id="applyOptionsReleaseButton">Apply version</button>
    <p class="optionsReleaseStatus" id="optionsReleaseStatus" role="status"></p>
    <div class="optionsUpdateTest">
      <p class="instructionLabel">Background update test</p>
      <p class="instructionSubLabel">Override the existing next update date, then close the popup to verify the normal background update flow.</p>
      <select class="textField" id="optionsUpdateDelaySelect">
        <option value="15000">In 15 seconds</option>
        <option value="60000">In 1 minute</option>
      </select>
      <button type="button" class="submitButton" id="overrideNextOptionsUpdateButton">Set next update</button>
      <p class="optionsReleaseStatus" id="optionsUpdateTestStatus" role="status"></p>
    </div>
  `;
  return section;
}

function releaseOptionLabel(release) {
  const channel = release.channel === "testers" ? "Testers" : "Production";
  const date = release.created_at ? new Date(release.created_at).toLocaleDateString() : "";
  return `v${release.version} · ${channel}${date ? ` · ${date}` : ""}`;
}

async function initializeOptionsReleasePicker(root, signal) {
  const wrapper = root.querySelector(".buttonsWrapper");
  if (!wrapper) return;
  const section = createOptionsReleaseSection();
  wrapper.prepend(section);
  const select = section.querySelector("#optionsReleaseSelect");
  const button = section.querySelector("#applyOptionsReleaseButton");
  const status = section.querySelector("#optionsReleaseStatus");
  const updateDelay = section.querySelector("#optionsUpdateDelaySelect");
  const updateButton = section.querySelector("#overrideNextOptionsUpdateButton");
  const updateStatus = section.querySelector("#optionsUpdateTestStatus");

  const response = await messagingService.listOptionReleases();
  if (signal.aborted) return;
  if (response?.ok !== true) {
    if (response?.error?.code === "tester_access_required") {
      await messagingService.restoreCurrentOptions().catch(() => undefined);
    }
    return;
  }

  section.hidden = false;
  const automatic = document.createElement("option");
  automatic.value = "automatic";
  automatic.textContent = `Latest production (automatic)${response.latest_public_version ? ` · v${response.latest_public_version}` : ""}`;
  select.appendChild(automatic);
  for (const release of response.versions) {
    const option = document.createElement("option");
    option.value = `${release.channel}:${release.version}`;
    option.textContent = releaseOptionLabel(release);
    select.appendChild(option);
  }
  select.value = response.selection
    ? `${response.selection.channel}:${response.selection.version}`
    : "automatic";
  let activeSelection = response.selection;

  function renderSelectionState() {
    status.textContent = activeSelection
      ? `Pinned to v${activeSelection.version} (${activeSelection.channel}). Automatic updates are paused.`
      : "Using the latest production release with automatic updates.";
    updateButton.disabled = Boolean(activeSelection);
    updateStatus.textContent = activeSelection
      ? "Return to Latest production (automatic) before testing the background updater."
      : "This changes the existing next update date; no separate timer is created.";
  }

  renderSelectionState();

  button.addEventListener("click", async () => {
    button.disabled = true;
    status.classList.remove("error", "success");
    status.textContent = "Applying the selected options release…";
    try {
      const value = select.value;
      const separator = value.indexOf(":");
      const result = value === "automatic"
        ? await messagingService.restoreCurrentOptions()
        : await messagingService.applyOptionRelease({
            channel: value.slice(0, separator),
            version: value.slice(separator + 1),
          });
      if (result?.ok !== true) throw new Error(result?.error?.code ?? "options_release_failed");
      activeSelection = result.selection ?? null;
      renderSelectionState();
      status.classList.add("success");
      status.textContent = value === "automatic"
        ? "Latest production release applied. Automatic updates are active."
        : `v${result.version} (${result.channel}) applied to Desktop and Mobile.`;
    } catch (error) {
      status.classList.add("error");
      status.textContent = `Could not apply this release: ${error.message}`;
    } finally {
      button.disabled = false;
    }
  }, { signal });

  updateButton.addEventListener("click", async () => {
    updateButton.disabled = true;
    updateStatus.classList.remove("error", "success");
    updateStatus.textContent = "Updating the existing next update date…";
    try {
      const result = await messagingService.overrideNextOptionsUpdate({
        delayMs: Number(updateDelay.value),
      });
      if (result?.ok !== true) {
        throw new Error(result?.error?.code ?? "next_options_update_failed");
      }
      updateStatus.classList.add("success");
      updateStatus.textContent = `Next update: ${new Date(result.nextCheckAt).toLocaleTimeString()}. You can close the popup now.`;
    } catch (error) {
      updateStatus.classList.add("error");
      updateStatus.textContent = `Could not update the date: ${error.message}`;
    } finally {
      updateButton.disabled = Boolean(activeSelection);
    }
  }, { signal });
}

export function createImportExportScreen() {
  const root = createScreenElement(htmlTemplates.importExportScreen, "importExportScreen");
  const importExportScreenController = new AbortController();
  const { signal } = importExportScreenController;
  let copyFeedbackTimer = null;
    
  async function mount() {
    let serialized = await exportSettings();
    if (signal.aborted) return;
    void initializeOptionsReleasePicker(root, signal).catch((error) => {
      console.error("Options release picker failed", error);
    });
    root.querySelector("#exportSettingsButton")?.addEventListener("click", async (event) => {
      await navigator.clipboard.writeText(serialized);
      const original = event.currentTarget.textContent;
      event.currentTarget.textContent = "Settings Copied to Clipboard!";
      clearTimeout(copyFeedbackTimer);
      copyFeedbackTimer = setTimeout(() => {
        event.currentTarget.textContent = original || "Export";
        copyFeedbackTimer = null;
      }, 4000);
    }, { signal });
    root.querySelector("#importSettingsButton")?.addEventListener("click", async () => {
      const field = root.querySelector("#importSettingsTextField");
      try {
        await importSettings(field?.value ?? "");
        field?.classList.remove("error");
        serialized = await exportSettings();
      } catch (_) {
        field?.classList.add("error");
        if (field) field.value = "";
      }
    }, { signal });
    root.querySelector("#resetSettingsButton")?.addEventListener("click", async () => {
      await resetSettings();
      location.reload();
    }, { signal });
  }

  function unmount() {
    clearTimeout(copyFeedbackTimer);
    copyFeedbackTimer = null;
    importExportScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}
