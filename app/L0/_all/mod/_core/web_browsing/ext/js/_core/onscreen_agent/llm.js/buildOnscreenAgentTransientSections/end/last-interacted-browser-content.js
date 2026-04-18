import { getStore } from "/mod/_core/framework/js/AlpineStore.js";
import {
  normalizeBrowserTransientCell,
  normalizeBrowserTransientId
} from "./open-browsers.js";

const LAST_INTERACTED_BROWSER_CONTENT_HEADING = "last interacted web browser";
const LAST_INTERACTED_BROWSER_CONTENT_KEY = "last-interacted-web-browser-content";
const LAST_INTERACTED_BROWSER_CONTENT_TIMEOUT_MS = 1800;

function buildBrowserStatusRow(browserWindow) {
  const id = normalizeBrowserTransientId(browserWindow?.id);
  const url = normalizeBrowserTransientCell(
    browserWindow?.currentUrl
    || browserWindow?.frameSrc
    || browserWindow?.addressValue
    || ""
  );
  const title = normalizeBrowserTransientCell(browserWindow?.title || "");

  if (!id) {
    return null;
  }

  return {
    id,
    title,
    url
  };
}

async function buildLastInteractedBrowserContentTransientSection(webBrowsingStore = getStore("webBrowsing")) {
  const browserId = String(webBrowsingStore?.lastInteractedBrowserId || "").trim();
  const browserInstanceKey = webBrowsingStore?.lastInteractedBrowserInstanceKey ?? null;
  if (!browserId) {
    return null;
  }

  const browserWindow = typeof webBrowsingStore?.getWindow === "function"
    ? webBrowsingStore.getWindow(browserId)
    : null;
  if (!browserWindow) {
    return null;
  }

  if (browserInstanceKey != null && browserWindow.instanceKey !== browserInstanceKey) {
    return null;
  }

  if (typeof webBrowsingStore?.syncNavigationState === "function") {
    await webBrowsingStore.syncNavigationState(browserId, {
      attempts: 1
    });
  }

  const contentPayload = typeof webBrowsingStore?.requestBridgePayload === "function"
    ? await webBrowsingStore.requestBridgePayload(browserId, "content", null, {
        timeoutMs: LAST_INTERACTED_BROWSER_CONTENT_TIMEOUT_MS
      })
    : null;
  const documentContent = typeof contentPayload?.document === "string"
    ? contentPayload.document.trim()
    : "";
  if (!documentContent) {
    return null;
  }

  const row = buildBrowserStatusRow(
    typeof webBrowsingStore?.getWindow === "function"
      ? webBrowsingStore.getWindow(browserId)
      : browserWindow
  );
  if (!row) {
    return null;
  }

  return {
    content: [
      "browser id|url|title",
      `${row.id}|${row.url}|${row.title}`,
      "",
      "page content↓",
      documentContent
    ].join("\n"),
    heading: LAST_INTERACTED_BROWSER_CONTENT_HEADING,
    key: LAST_INTERACTED_BROWSER_CONTENT_KEY,
    order: 30
  };
}

export default async function injectLastInteractedBrowserContentTransientSection(hookContext) {
  const promptContext = hookContext?.result;

  if (!promptContext || !Array.isArray(promptContext.sections)) {
    return;
  }

  const contentTransientSection = await buildLastInteractedBrowserContentTransientSection();

  promptContext.sections = promptContext.sections.filter(
    (section) => String(section?.key || "").trim() !== LAST_INTERACTED_BROWSER_CONTENT_KEY
  );

  if (!contentTransientSection) {
    return;
  }

  promptContext.sections = promptContext.sections.concat(contentTransientSection);
}
