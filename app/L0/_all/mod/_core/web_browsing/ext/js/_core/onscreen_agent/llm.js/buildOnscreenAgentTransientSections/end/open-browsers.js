import { getStore } from "/mod/_core/framework/js/AlpineStore.js";

const OPEN_BROWSERS_TRANSIENT_HEADING = "currently open web browsers";
const OPEN_BROWSERS_TRANSIENT_KEY = "currently-open-web-browsers";

export function normalizeBrowserTransientId(value) {
  const match = String(value || "").trim().match(/^browser-(\d+)$/u);
  if (match) {
    const parsed = Number.parseInt(match[1], 10);
    return Number.isInteger(parsed) && parsed > 0 ? String(parsed) : "";
  }

  return String(value || "").trim();
}

export function normalizeBrowserTransientCell(value) {
  return String(value ?? "")
    .replace(/\|/gu, "/")
    .replace(/\s+/gu, " ")
    .trim();
}

function compareBrowsers(left, right) {
  const leftId = Number.parseInt(left.id, 10);
  const rightId = Number.parseInt(right.id, 10);

  if (Number.isInteger(leftId) && Number.isInteger(rightId)) {
    return leftId - rightId;
  }

  return left.id.localeCompare(right.id);
}

export function getOpenBrowserTransientRows(webBrowsingStore = getStore("webBrowsing")) {
  const windows = Array.isArray(webBrowsingStore?.windows) ? webBrowsingStore.windows : [];

  return windows
    .map((browserWindow) => {
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
    })
    .filter(Boolean)
    .sort(compareBrowsers);
}

export function buildOpenBrowsersTransientSection(webBrowsingStore = getStore("webBrowsing")) {
  const rows = getOpenBrowserTransientRows(webBrowsingStore);

  if (!rows.length) {
    return null;
  }

  return {
    content: [
      "browser id|url|title",
      ...rows.map((row) => `${row.id}|${row.url}|${row.title}`)
    ].join("\n"),
    heading: OPEN_BROWSERS_TRANSIENT_HEADING,
    key: OPEN_BROWSERS_TRANSIENT_KEY,
    order: 20
  };
}

export default async function injectOpenBrowsersTransientSection(hookContext) {
  const promptContext = hookContext?.result;

  if (!promptContext || !Array.isArray(promptContext.sections)) {
    return;
  }

  const openBrowsersTransientSection = buildOpenBrowsersTransientSection();

  promptContext.sections = promptContext.sections.filter(
    (section) => String(section?.key || "").trim() !== OPEN_BROWSERS_TRANSIENT_KEY
  );

  if (!openBrowsersTransientSection) {
    return;
  }

  promptContext.sections = promptContext.sections.concat(openBrowsersTransientSection);
}
