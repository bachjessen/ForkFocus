/**
 * SocialFocus
 * Copyright © 2026 Yevhen Tretiakov. All rights reserved.
 *

 */

import { htmlTemplates } from "../../constants/html-templates.js";
import { clearPendingVerification, getPendingVerification, resendPendingCode, verifyPendingCode } from "../../application/authFlow.js";
import { createScreenElement } from "../screenFactory.js";

function setError(root, message = "") {
  const output = root.querySelector("#verificationError");
  if (output) {
    output.textContent = message;
    output.style.display = message ? "block" : "none";
  }
}
function codeFrom(inputs) { return inputs.map((input) => input.value).join(""); }
function clearInputs(inputs) { inputs.forEach((input) => { input.value = ""; }); }

export function createVerificationScreen(context) {
  const root = createScreenElement(htmlTemplates.emailVerification, "emailVerification");
  const verificationScreenController = new AbortController();
  const { signal } = verificationScreenController;

  async function mount() {
    const inputs = [...root.querySelectorAll(".verification-input")];
    const verify = root.querySelector("#verifyEmail");
    const updateButton = () => verify?.toggleAttribute("disabled", !/^\d{6}$/.test(codeFrom(inputs)));
    const pending = await getPendingVerification();
    if (signal.aborted) return;
    const isActive =
      /^[0-9a-f]{32}$/.test(pending.challengeId) &&
      Number.isFinite(pending.expiresAt) &&
      pending.expiresAt > Date.now();
    if (!isActive) {
      await clearPendingVerification();
      if (!signal.aborted) {
        context.navigate(
          pending.type?.endsWith("signUp") ? "proSignUpScreen" : "proLoginScreen",
        );
      }
      return;
    }
    root.setAttribute("typeOfVerification", pending.type);
    const description = root.querySelector(".verification-text");
    if (description) description.textContent = pending.email;
    inputs.forEach((input, index) => {
      input.addEventListener("input", () => {
        input.value = input.value.slice(-1);
        if (input.value) inputs[index + 1]?.focus();
        updateButton();
      }, { signal });
      input.addEventListener("keydown", (event) => {
        if (event.key === "Backspace" && !input.value) inputs[index - 1]?.focus();
      }, { signal });
      input.addEventListener("paste", (event) => {
        const digits = event.clipboardData?.getData("text").replace(/\D/g, "").slice(0, 6) ?? "";
        if (!digits) return;
        event.preventDefault();
        digits.split("").forEach((digit, offset) => {
          if (inputs[index + offset]) inputs[index + offset].value = digit;
        });
        updateButton();
      }, { signal });
    });
    verify?.addEventListener("click", async () => {
      verify.setAttribute("disabled", "");
      try {
        const result = await verifyPendingCode(codeFrom(inputs));
        setError(root);
        clearInputs(inputs);
        context.navigate(result.requiresLogin ? "proLoginScreen" : "moreScreen");
      } catch (error) {
        setError(root, error.message);
      } finally {
        updateButton();
      }
    }, { signal });
    root.querySelector("#resendCode")?.addEventListener("click", async (event) => {
      event.currentTarget.setAttribute("disabled", "");
      try { await resendPendingCode(); setError(root); }
      catch (error) { setError(root, error.message); }
      finally { event.currentTarget.removeAttribute("disabled"); }
    }, { signal });
    const leave = async () => {
      const type = await clearPendingVerification();
      clearInputs(inputs);
      setError(root);
      context.navigate(type.endsWith("signUp") ? "proSignUpScreen" : "proLoginScreen");
    };
    const back = root.querySelector(".backButton");
    back?.setAttribute("route-handler-owned", "");
    back?.addEventListener("click", () => void leave(), { signal });
    root.querySelector("#changeEmail")?.addEventListener("click", () => void leave(), { signal });
    updateButton();
  }

  function unmount() {
    verificationScreenController.abort();
  }

  return {
    element: root,
    mount,
    unmount,
  };
}
