/**
 * SocialFocus
* SocialFocus
 * Copyright © 2026 
 */

const timerModalRuntimeScope = SocialFocusContentRuntime.createLifecycleScope({ featureId: "dailyLimitModal" });
const timerModalStorageEvent = {
  addListener: (listener) => storageService.subscribe(listener),
  removeListener: (listener) => storageService.unsubscribe(listener),
};

function createTimerModalHeader({
  modalPositionDependOnDevice,
  displayName,
  isDesktop,
  remainingTime,
}) {
  const svgNS = "http://www.w3.org/2000/svg";

  const header = document.createElement("div");
  header.id = "timeModalHeader";
  header.style.cssText =
    "position: fixed; z-index: 2147483647; color: white; background-color: gray; border: 1px solid rgb(0, 0, 0); text-align: center; border-radius: 5px; cursor: move; opacity: 0.9; " +
    modalPositionDependOnDevice;

  const closeButton = document.createElementNS(svgNS, "svg");
  closeButton.setAttribute("viewport", "0 0 12 12");
  closeButton.setAttribute("version", "1.1");
  closeButton.id = "closeButton";
  closeButton.style.cssText =
    "position: absolute; top: 8px; right: 8px; cursor: pointer; width: 12px; height: 12px;";

  const line1 = document.createElementNS(svgNS, "line");
  line1.setAttribute("x1", "1");
  line1.setAttribute("y1", "11");
  line1.setAttribute("x2", "11");
  line1.setAttribute("y2", "1");
  line1.setAttribute("stroke", "white");
  line1.setAttribute("stroke-width", "2");

  const line2 = document.createElementNS(svgNS, "line");
  line2.setAttribute("x1", "1");
  line2.setAttribute("y1", "1");
  line2.setAttribute("x2", "11");
  line2.setAttribute("y2", "11");
  line2.setAttribute("stroke", "white");
  line2.setAttribute("stroke-width", "2");

  closeButton.append(line1, line2);

  const contentWrapper = document.createElement("div");
  contentWrapper.style.cssText =
    "width: 100%; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; padding: 10px 20px;";

  const title = document.createElement("h2");
  title.id = "timeModalTitle";
  title.style.cssText = "font-weight: bold; font-size: 16px; color: white;";
  title.textContent = "Time left on";

  const websiteName = document.createElement("p");
  websiteName.id = "websiteName";
  websiteName.style.cssText = "font-size: 14px; color: white; margin: 0;";
  websiteName.textContent = displayName;

  const timeLeft = document.createElement("p");
  timeLeft.id = "timeLeft";
  timeLeft.style.cssText = `font-weight: bold; font-size: ${
    isDesktop ? "20px" : "14px"
  }; padding-top: ${
    isDesktop ? "5px" : "0px"
  }; flex-grow: 1; color: white; margin: 4px;`;
  timeLeft.textContent = formatForRemainingTime(remainingTime);

  contentWrapper.append(title, websiteName, timeLeft);
  header.append(closeButton, contentWrapper);

  return header;
}

function createTimerModal({ isDesktop }) {
  storageService.get(
    getConst.system,
  ).then(function (obj) {
      const systemState = obj[getConst.system] ?? {};
      const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

      const currentDailyLimitDuration =
        dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]];
      const currentDailyLimitLastedTime =
        dailyLimitState[getConst.dailyLimitLastedTime[websiteObject.name]];
      const currentTopCoordinate =
        dailyLimitState[
          getConst.dailyLimitModalCoordinate[websiteObject.name].top
        ] ?? "20px";
      const currentLeftCoordinate =
        dailyLimitState[
          getConst.dailyLimitModalCoordinate[websiteObject.name].left
        ] ?? "20px";

      const hasModal = document.querySelector("#timeModal");

      if (
        currentDailyLimitDuration !== "noLimit" &&
        currentDailyLimitDuration !== undefined &&
        currentDailyLimitLastedTime !== undefined &&
        !hasModal
      ) {
        const modalPositionDependOnDevice = isDesktop
          ? `top: ${currentTopCoordinate}; left: ${currentLeftCoordinate};`
          : "bottom: 10px; right: 10px";

        const remainingTime =
          +currentDailyLimitDuration * 60 - currentDailyLimitLastedTime;

        const modal = document.createElement("div");
        modal.id = "timeModal";

        const shadowRoot = modal.attachShadow({ mode: "open" });

        const header = createTimerModalHeader({
          modalPositionDependOnDevice,
          displayName: websiteObject.displayName,
          isDesktop,
          remainingTime,
        });
        shadowRoot.appendChild(header);

        const closeButton = shadowRoot.querySelector("#closeButton");
        timerModalRuntimeScope.listen("close", closeButton, "click", removeTimerModal);

        const setModalInDOM = () => {
          document.body.appendChild(modal);

          if (isDesktop) {
            dragElement(modal);
          }

          timerModalListenerStart();
        };

        const observer = new MutationObserver(() => {
          if (document.body) {
            setModalInDOM();
            timerModalRuntimeScope.cancel("observer", "wait-for-body");
          }
        });

        if (!document.body) {
          timerModalRuntimeScope.observe("wait-for-body", observer, document, { childList: true, subtree: true });
        } else {
          setModalInDOM();
        }
      }
    });
}

function removeTimerModal() {
  const modals = document.querySelectorAll("#timeModal");

  timerModalListenerRemove();
  timerModalRuntimeScope.cancel("observer", "wait-for-body");
  timerModalRuntimeScope.cancel("listener", "close");
  timerModalRuntimeScope.cancel("listener", "drag-start");
  timerModalRuntimeScope.cancel("listener", "drag-move");
  timerModalRuntimeScope.cancel("listener", "drag-stop");
  modals.forEach((modal) => {
    if (modal) {
      modal.remove();
    }
  });
}

function timerModalListenerStart() {
  const modal = document.getElementById("timeModal");

  if (modal) {
    const timerModalListener = (changes, area) => {
      const timeLeftElement = modal.shadowRoot.querySelector("#timeLeft");
      timerObserver(changes, area, timeLeftElement);
    };

    timerModalRuntimeScope.cancel("subscription", "storage");
    timerModalRuntimeScope.subscribe("storage", timerModalStorageEvent, timerModalListener);
  }
}

function timerModalListenerRemove() {
  timerModalRuntimeScope.cancel("subscription", "storage");
}

function timerObserver(changes, area, timeLeftElement) {
  if (area !== "local") return;

  const values = storageSelectors.getChangedValue(
    changes,
    getConst.system,
    getConst.dailyLimitData,
    getConst.dailyLimitLastedTime[websiteObject.name],
  );

  if (!values) return;

  const { newValue, oldValue } = values;
  if (newValue === oldValue || newValue === undefined) return;

  storageService.get(getConst.system).then(function (obj) {
    const systemState = obj[getConst.system] ?? {};
    const dailyLimitState = systemState[getConst.dailyLimitData] ?? {};

    const currentDailyLimitDuration =
      dailyLimitState[getConst.dailyLimitDuration[websiteObject.name]];

    if (
      currentDailyLimitDuration !== "noLimit" &&
      currentDailyLimitDuration !== undefined
    ) {
      const remainingTime = +currentDailyLimitDuration * 60 - newValue;

      timeLeftElement.textContent = formatForRemainingTime(remainingTime);
    } else {
      removeTimerModal();
    }
  });
}

function formatForRemainingTime(remainingSeconds) {
  const minutes = Math.floor(remainingSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours > 0) {
    return `${hours} h ${remainingMinutes} min`;
  } else {
    return `${minutes < 0 ? 0 : minutes} min`;
  }
}

function dragElement(modal) {
  const header = modal.shadowRoot.querySelector("#timeModalHeader");

  let offsetX = 0;
  let offsetY = 0;

  timerModalRuntimeScope.listen("drag-start", header, "mousedown", startDragging);

  function startDragging(e) {
    e.preventDefault();

    const rect = header.getBoundingClientRect();

    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    timerModalRuntimeScope.listen("drag-move", document, "mousemove", drag);
    timerModalRuntimeScope.listen("drag-stop", document, "mouseup", stopDragging);
  }

  function drag(e) {
    e.preventDefault();

    header.style.left = e.clientX - offsetX + "px";
    header.style.top = e.clientY - offsetY + "px";
  }

  function stopDragging() {
    void storageMutations.patchDailyLimit({
      [getConst.dailyLimitModalCoordinate[websiteObject.name].top]:
        header.style.top,
      [getConst.dailyLimitModalCoordinate[websiteObject.name].left]:
        header.style.left,
    })
      .catch(() =>
        SocialFocusContentDiagnostics?.count("dailyLimitModal", "errors"),
      )
      .finally(() => {
        timerModalRuntimeScope.cancel("listener", "drag-move");
        timerModalRuntimeScope.cancel("listener", "drag-stop");
      });
  }
}

timerModalRuntimeScope.listen("pagehide", window, "pagehide", () => timerModalRuntimeScope.dispose(), { once: true });
