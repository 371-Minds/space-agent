(() => {
  const GLOBAL_KEY = "__spaceBrowserPageContent__";
  const VERSION = "1";
  const BLOCK_TAGS = new Set([
    "ADDRESS",
    "ARTICLE",
    "ASIDE",
    "BLOCKQUOTE",
    "BODY",
    "DETAILS",
    "DIV",
    "DL",
    "FIELDSET",
    "FIGCAPTION",
    "FIGURE",
    "FOOTER",
    "FORM",
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "HEADER",
    "HR",
    "HTML",
    "LI",
    "MAIN",
    "NAV",
    "OL",
    "P",
    "PRE",
    "SECTION",
    "TABLE",
    "TBODY",
    "TD",
    "TFOOT",
    "TH",
    "THEAD",
    "TR",
    "UL"
  ]);
  const SKIP_TAGS = new Set([
    "HEAD",
    "LINK",
    "META",
    "NOSCRIPT",
    "SCRIPT",
    "STYLE",
    "TEMPLATE"
  ]);
  const INTERACTIVE_ROLES = new Set([
    "button",
    "checkbox",
    "combobox",
    "link",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "option",
    "radio",
    "searchbox",
    "slider",
    "spinbutton",
    "switch",
    "tab",
    "textbox"
  ]);

  if (globalThis[GLOBAL_KEY]?.version === VERSION) {
    return;
  }

  const state = {
    captureId: 0,
    capturedAt: 0,
    entries: new Map()
  };

  function isElementNode(value) {
    return Boolean(value && value.nodeType === 1);
  }

  function isTextNode(value) {
    return Boolean(value && value.nodeType === 3);
  }

  function normalizeText(value) {
    return String(value ?? "")
      .replace(/\s+/gu, " ")
      .trim();
  }

  function normalizeAttributeText(value) {
    return normalizeText(value).slice(0, 160);
  }

  function escapeMarkdownText(value) {
    return String(value ?? "").replace(/([\\`*_{}\[\]()#+\-!|>])/gu, "\\$1");
  }

  function quoteText(value) {
    return JSON.stringify(String(value ?? ""));
  }

  function truncateText(value, maxLength = 120) {
    const normalizedValue = normalizeText(value);
    if (normalizedValue.length <= maxLength) {
      return normalizedValue;
    }

    return `${normalizedValue.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
  }

  function joinBlocks(blocks) {
    return blocks
      .map((block) => String(block || "").trim())
      .filter(Boolean)
      .join("\n\n")
      .trim();
  }

  function joinInlineParts(parts) {
    return String(parts
      .map((part) => String(part || "").trim())
      .filter(Boolean)
      .join(" "))
      .replace(/\s+([,.;!?])/gu, "$1")
      .replace(/([([{\u201c])\s+/gu, "$1")
      .replace(/\s+([\])}\u201d])/gu, "$1")
      .replace(/\s*\n\s*/gu, "\n")
      .replace(/[ \t]+\n/gu, "\n")
      .replace(/\n{3,}/gu, "\n\n")
      .trim();
  }

  function indentBlock(text, level = 1) {
    const prefix = "  ".repeat(Math.max(0, level));
    return String(text || "")
      .split("\n")
      .map((line) => `${prefix}${line}`)
      .join("\n");
  }

  function createNamedError(name, message, details = {}) {
    const error = new Error(message);
    error.name = name;
    Object.assign(error, details);
    return error;
  }

  function normalizeSelectorList(payload) {
    const rawSelectors = Array.isArray(payload?.selectors)
      ? payload.selectors
      : Array.isArray(payload)
        ? payload
        : [];

    return rawSelectors
      .map((selector) => String(selector || "").trim())
      .filter(Boolean);
  }

  function normalizeReferenceId(value) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(Math.trunc(value));
    }

    if (typeof value === "string") {
      return value.trim();
    }

    if (value && typeof value === "object") {
      return normalizeReferenceId(value.referenceId ?? value.ref ?? value.id);
    }

    return "";
  }

  function getTagName(element) {
    return String(element?.tagName || "").toUpperCase();
  }

  function isHiddenElement(element) {
    if (!isElementNode(element)) {
      return true;
    }

    const tagName = getTagName(element);
    if (SKIP_TAGS.has(tagName)) {
      return true;
    }

    if (element.hidden || element.getAttribute?.("aria-hidden") === "true") {
      return true;
    }

    if (tagName === "INPUT" && String(element.getAttribute?.("type") || "").toLowerCase() === "hidden") {
      return true;
    }

    try {
      const computedStyle = globalThis.getComputedStyle?.(element);
      if (!computedStyle) {
        return false;
      }

      return computedStyle.display === "none" || computedStyle.visibility === "hidden";
    } catch {
      return false;
    }
  }

  function isBlockElement(element) {
    return BLOCK_TAGS.has(getTagName(element));
  }

  function isInteractiveElement(element) {
    if (!isElementNode(element) || isHiddenElement(element)) {
      return false;
    }

    const tagName = getTagName(element);
    if (tagName === "A" && element.hasAttribute?.("href")) {
      return true;
    }

    if (tagName === "BUTTON" || tagName === "INPUT" || tagName === "SELECT" || tagName === "TEXTAREA" || tagName === "SUMMARY") {
      return true;
    }

    if (String(element.getAttribute?.("contenteditable") || "").toLowerCase() === "true") {
      return true;
    }

    const role = String(element.getAttribute?.("role") || "").trim().toLowerCase();
    return INTERACTIVE_ROLES.has(role);
  }

  function collectMetaLines(doc = globalThis.document) {
    const lines = [];
    const title = normalizeAttributeText(doc?.title || "");
    const description = normalizeAttributeText(
      doc?.querySelector?.('meta[name="description"]')?.getAttribute?.("content") || ""
    );
    const url = String(globalThis.location?.href || "");

    if (!title && !description && !url) {
      return "";
    }

    lines.push("---");
    if (title) {
      lines.push(`title: ${quoteText(title)}`);
    }
    if (description) {
      lines.push(`description: ${quoteText(description)}`);
    }
    if (url) {
      lines.push(`url: ${quoteText(url)}`);
    }
    lines.push("---");
    return lines.join("\n");
  }

  function summarizeUrl(value) {
    const normalizedValue = String(value || "").trim();
    if (!normalizedValue) {
      return "";
    }

    try {
      const url = new URL(normalizedValue, globalThis.location?.href || "http://localhost/");
      if (url.origin === globalThis.location?.origin) {
        const relative = `${url.pathname || "/"}${url.search || ""}${url.hash || ""}`;
        return truncateText(relative || "/", 96);
      }

      return truncateText(`${url.hostname}${url.pathname || "/"}`, 96);
    } catch {
      return truncateText(normalizedValue, 96);
    }
  }

  function getElementText(element) {
    return normalizeText(element?.textContent || "");
  }

  function getLabelText(element) {
    const collectedLabels = [];

    try {
      if (Array.isArray(element?.labels) || typeof element?.labels?.forEach === "function") {
        element.labels.forEach((labelElement) => {
          const text = getElementText(labelElement);
          if (text) {
            collectedLabels.push(text);
          }
        });
      }
    } catch {
      // Ignore labels lookup failures from non-form elements.
    }

    [
      element?.getAttribute?.("aria-label"),
      element?.getAttribute?.("title"),
      element?.getAttribute?.("alt"),
      element?.getAttribute?.("placeholder")
    ].forEach((candidate) => {
      const text = normalizeAttributeText(candidate);
      if (text) {
        collectedLabels.push(text);
      }
    });

    const textContent = getElementText(element);
    if (textContent) {
      collectedLabels.push(textContent);
    }

    return [...new Set(collectedLabels.filter(Boolean))][0] || "";
  }

  function serializeElementSnapshot(element) {
    if (!isElementNode(element)) {
      return "";
    }

    try {
      if (typeof element.outerHTML === "string" && element.outerHTML) {
        return element.outerHTML;
      }
    } catch {
      // Fall through to XMLSerializer.
    }

    try {
      if (typeof globalThis.XMLSerializer === "function") {
        return new globalThis.XMLSerializer().serializeToString(element);
      }
    } catch {
      // Ignore serialization errors.
    }

    return "";
  }

  function collectReferenceSummaryParts(element) {
    const tagName = getTagName(element);
    const role = String(element.getAttribute?.("role") || "").trim().toLowerCase();
    const id = normalizeAttributeText(element.getAttribute?.("id"));
    const name = normalizeAttributeText(element.getAttribute?.("name"));
    const label = truncateText(getLabelText(element), 120);
    const parts = [];

    if (tagName === "A" || role === "link") {
      parts.push("Link");
      if (label) {
        parts.push(quoteText(label));
      }

      const hrefSummary = summarizeUrl(element.getAttribute?.("href") || element.href || "");
      if (hrefSummary) {
        parts.push(`-> ${hrefSummary}`);
      }
    } else if (tagName === "BUTTON" || ["button", "menuitem", "tab"].includes(role)) {
      parts.push("Button");
      if (label) {
        parts.push(quoteText(label));
      }
    } else if (tagName === "TEXTAREA" || role === "textbox" || role === "searchbox") {
      parts.push(tagName === "TEXTAREA" ? "Textarea" : "Input");
      if (label) {
        parts.push(quoteText(label));
      }
    } else if (tagName === "SELECT" || role === "combobox") {
      parts.push("Select");
      if (label) {
        parts.push(quoteText(label));
      }

      const selectedOptions = [...(element.selectedOptions || [])]
        .map((option) => truncateText(option.textContent || "", 48))
        .filter(Boolean);
      if (selectedOptions.length) {
        parts.push(`selected=${quoteText(selectedOptions.join(" | "))}`);
      }
    } else if (tagName === "SUMMARY") {
      parts.push("Summary");
      if (label) {
        parts.push(quoteText(label));
      }
    } else if (tagName === "INPUT") {
      const inputType = String(element.getAttribute?.("type") || element.type || "text").toLowerCase();
      if (["button", "submit", "reset"].includes(inputType)) {
        parts.push("Button");
        if (label || element.value) {
          parts.push(quoteText(truncateText(label || element.value || "", 120)));
        }
      } else if (["checkbox", "radio"].includes(inputType)) {
        parts.push(inputType === "checkbox" ? "Checkbox" : "Radio");
        if (label) {
          parts.push(quoteText(label));
        }
        if (element.checked) {
          parts.push("checked");
        }
      } else if (inputType === "file") {
        parts.push("File input");
        if (label) {
          parts.push(quoteText(label));
        }
      } else {
        parts.push(`Input ${inputType || "text"}`);
        if (label) {
          parts.push(quoteText(label));
        }
      }

      const placeholder = normalizeAttributeText(element.getAttribute?.("placeholder"));
      const value = inputType === "password"
        ? ""
        : truncateText(element.value || element.getAttribute?.("value") || "", 96);

      if (placeholder) {
        parts.push(`placeholder=${quoteText(placeholder)}`);
      }
      if (value) {
        parts.push(`value=${quoteText(value)}`);
      }
    } else if (String(element.getAttribute?.("contenteditable") || "").toLowerCase() === "true") {
      parts.push("Editable region");
      if (label) {
        parts.push(quoteText(label));
      }
    } else if (role) {
      parts.push(`role=${role}`);
      if (label) {
        parts.push(quoteText(label));
      }
    } else {
      parts.push(tagName.toLowerCase());
      if (label) {
        parts.push(quoteText(label));
      }
    }

    if (id) {
      parts.push(`#${id}`);
    }
    if (name) {
      parts.push(`name=${quoteText(name)}`);
    }

    return parts.filter(Boolean);
  }

  function createReferenceEntry(element, referenceId) {
    return {
      connected: element.isConnected !== false,
      dom: serializeElementSnapshot(element),
      element,
      id: normalizeAttributeText(element.getAttribute?.("id")),
      name: normalizeAttributeText(element.getAttribute?.("name")),
      referenceId,
      summary: collectReferenceSummaryParts(element).join(" "),
      tagName: getTagName(element)
    };
  }

  function ensureReference(element, context) {
    if (context.referenceIdsByElement.has(element)) {
      return context.referenceIdsByElement.get(element);
    }

    const referenceId = String(context.nextReferenceId++);
    const entry = createReferenceEntry(element, referenceId);
    context.referenceIdsByElement.set(element, referenceId);
    context.entries.set(referenceId, entry);
    return referenceId;
  }

  function renderReference(element, context) {
    const referenceId = ensureReference(element, context);
    const summary = context.entries.get(referenceId)?.summary || getTagName(element).toLowerCase();
    return `[ref ${referenceId}] ${summary}`;
  }

  function renderInlineNode(node, context) {
    if (isTextNode(node)) {
      return escapeMarkdownText(normalizeText(node.textContent || ""));
    }

    if (!isElementNode(node) || isHiddenElement(node)) {
      return "";
    }

    if (isInteractiveElement(node)) {
      return renderReference(node, context);
    }

    const tagName = getTagName(node);

    if (tagName === "LABEL" && (node.getAttribute?.("for") || node.querySelector?.("input, textarea, select, button"))) {
      return "";
    }

    if (tagName === "BR") {
      return "\n";
    }

    if (tagName === "STRONG" || tagName === "B") {
      const content = renderInlineChildren(node, context);
      return content ? `**${content}**` : "";
    }

    if (tagName === "EM" || tagName === "I") {
      const content = renderInlineChildren(node, context);
      return content ? `*${content}*` : "";
    }

    if (tagName === "S" || tagName === "STRIKE" || tagName === "DEL") {
      const content = renderInlineChildren(node, context);
      return content ? `~~${content}~~` : "";
    }

    if (tagName === "CODE") {
      const content = normalizeText(node.textContent || "");
      return content ? `\`${content.replace(/`/gu, "\\`")}\`` : "";
    }

    if (tagName === "IMG") {
      const alt = truncateText(node.getAttribute?.("alt") || "", 96);
      return alt ? `Image ${quoteText(alt)}` : "Image";
    }

    return renderInlineChildren(node, context);
  }

  function renderInlineChildren(element, context) {
    const parts = [];

    element.childNodes.forEach((childNode) => {
      const renderedChild = renderInlineNode(childNode, context);
      if (renderedChild) {
        parts.push(renderedChild);
      }
    });

    return joinInlineParts(parts);
  }

  function renderParagraph(element, context) {
    return renderInlineChildren(element, context);
  }

  function renderHeading(element, context) {
    const level = Math.min(6, Math.max(1, Number.parseInt(getTagName(element).slice(1), 10) || 1));
    const content = renderInlineChildren(element, context);
    return content ? `${"#".repeat(level)} ${content}` : "";
  }

  function renderCodeBlock(element) {
    const content = String(element.textContent || "").trimEnd();
    if (!content) {
      return "";
    }

    return `\`\`\`\n${content.replace(/```/gu, "\\`\\`\\`")}\n\`\`\``;
  }

  function renderBlockquote(element, context) {
    const content = renderBlockChildren(element, context);
    if (!content) {
      return "";
    }

    return content
      .split("\n")
      .map((line) => `> ${line}`)
      .join("\n");
  }

  function renderListItem(element, context, depth, index, ordered) {
    const marker = ordered ? `${index + 1}.` : "-";
    const inlineParts = [];
    const nestedBlocks = [];

    element.childNodes.forEach((childNode) => {
      if (isElementNode(childNode) && (getTagName(childNode) === "UL" || getTagName(childNode) === "OL")) {
        const nestedList = renderList(childNode, context, depth + 1);
        if (nestedList) {
          nestedBlocks.push(nestedList);
        }
        return;
      }

      const renderedChild = renderInlineNode(childNode, context);
      if (renderedChild) {
        inlineParts.push(renderedChild);
      }
    });

    const head = joinInlineParts(inlineParts);
    const lines = [`${"  ".repeat(Math.max(0, depth))}${marker} ${head || "(empty)"}`];
    nestedBlocks.forEach((nestedBlock) => {
      lines.push(indentBlock(nestedBlock, 1));
    });
    return lines.join("\n");
  }

  function renderList(element, context, depth = 0) {
    const ordered = getTagName(element) === "OL";
    return [...element.children]
      .filter((child) => getTagName(child) === "LI" && !isHiddenElement(child))
      .map((item, index) => renderListItem(item, context, depth, index, ordered))
      .filter(Boolean)
      .join("\n");
  }

  function renderTableCell(element, context) {
    return renderInlineChildren(element, context);
  }

  function renderTable(element, context) {
    const rows = [...element.querySelectorAll?.(":scope > thead > tr, :scope > tbody > tr, :scope > tr, :scope > tfoot > tr") || []]
      .filter((row) => getTagName(row) === "TR");

    if (!rows.length) {
      return "";
    }

    const renderedRows = rows.map((row) => {
      return [...row.children]
        .filter((cell) => ["TD", "TH"].includes(getTagName(cell)) && !isHiddenElement(cell))
        .map((cell) => renderTableCell(cell, context));
    }).filter((cells) => cells.length);

    if (!renderedRows.length) {
      return "";
    }

    const columnCount = Math.max(...renderedRows.map((cells) => cells.length));
    const normalizedRows = renderedRows.map((cells) => {
      const nextCells = cells.slice();
      while (nextCells.length < columnCount) {
        nextCells.push("");
      }
      return nextCells;
    });

    const headerRow = normalizedRows[0];
    const separatorRow = headerRow.map(() => "---");
    const tableLines = [
      `| ${headerRow.join(" | ")} |`,
      `| ${separatorRow.join(" | ")} |`
    ];

    normalizedRows.slice(1).forEach((row) => {
      tableLines.push(`| ${row.join(" | ")} |`);
    });

    return tableLines.join("\n");
  }

  function renderGenericContainer(element, context) {
    return renderBlockChildren(element, context);
  }

  function renderElementAsBlock(element, context) {
    if (!isElementNode(element) || isHiddenElement(element)) {
      return "";
    }

    if (isInteractiveElement(element)) {
      return renderReference(element, context);
    }

    const tagName = getTagName(element);

    if (tagName === "LABEL" && (element.getAttribute?.("for") || element.querySelector?.("input, textarea, select, button"))) {
      return "";
    }

    if (/^H[1-6]$/u.test(tagName)) {
      return renderHeading(element, context);
    }

    if (tagName === "P") {
      return renderParagraph(element, context);
    }

    if (tagName === "PRE") {
      return renderCodeBlock(element);
    }

    if (tagName === "BLOCKQUOTE") {
      return renderBlockquote(element, context);
    }

    if (tagName === "UL" || tagName === "OL") {
      return renderList(element, context);
    }

    if (tagName === "TABLE") {
      return renderTable(element, context);
    }

    if (tagName === "HR") {
      return "---";
    }

    if (tagName === "IMG") {
      const alt = truncateText(element.getAttribute?.("alt") || "", 96);
      return alt ? `Image ${quoteText(alt)}` : "Image";
    }

    return renderGenericContainer(element, context);
  }

  function renderBlockChildren(element, context) {
    const blocks = [];
    const inlineParts = [];

    const flushInlineParts = () => {
      const inlineText = joinInlineParts(inlineParts.splice(0, inlineParts.length));
      if (inlineText) {
        blocks.push(inlineText);
      }
    };

    element.childNodes.forEach((childNode) => {
      if (isTextNode(childNode)) {
        const textContent = escapeMarkdownText(normalizeText(childNode.textContent || ""));
        if (textContent) {
          inlineParts.push(textContent);
        }
        return;
      }

      if (!isElementNode(childNode) || isHiddenElement(childNode)) {
        return;
      }

      const renderedChild = renderElementAsBlock(childNode, context);
      if (!renderedChild) {
        return;
      }

      if (isBlockElement(childNode) || isInteractiveElement(childNode)) {
        flushInlineParts();
        blocks.push(renderedChild);
        return;
      }

      inlineParts.push(renderedChild);
    });

    flushInlineParts();
    return joinBlocks(blocks);
  }

  function createCaptureContext() {
    return {
      entries: new Map(),
      nextReferenceId: 1,
      referenceIdsByElement: new WeakMap()
    };
  }

  function resolveSelectorTargets(payload) {
    const selectors = normalizeSelectorList(payload);
    if (!selectors.length) {
      return {
        includeMetaData: true,
        items: [
          {
            key: "document",
            targets: [globalThis.document?.body || globalThis.document?.documentElement].filter(Boolean)
          }
        ]
      };
    }

    return {
      includeMetaData: false,
      items: selectors.map((selector) => {
        let targets = [];
        try {
          targets = [...(globalThis.document?.querySelectorAll?.(selector) || [])];
        } catch (error) {
          throw createNamedError(
            "BrowserPageContentSelectorError",
            `Browser page content could not resolve selector "${selector}".`,
            {
              code: "browser_page_content_selector_error",
              details: {
                selector
              },
              cause: error
            }
          );
        }

        return {
          key: selector,
          targets
        };
      })
    };
  }

  function capture(payload = null) {
    const captureContext = createCaptureContext();
    const resolvedTargets = resolveSelectorTargets(payload);
    const snapshot = {};

    resolvedTargets.items.forEach((item) => {
      const blocks = [];
      if (resolvedTargets.includeMetaData && item.key === "document") {
        const meta = collectMetaLines(globalThis.document);
        if (meta) {
          blocks.push(meta);
        }
      }

      item.targets.forEach((target) => {
        const renderedTarget = renderElementAsBlock(target, captureContext);
        if (renderedTarget) {
          blocks.push(renderedTarget);
        }
      });

      snapshot[item.key] = joinBlocks(blocks);
    });

    state.captureId += 1;
    state.capturedAt = Date.now();
    state.entries = captureContext.entries;
    return snapshot;
  }

  function detail(referenceId) {
    const entry = requireReferenceEntry(referenceId, {
      actionLabel: "detail",
      requireConnected: false
    });

    return {
      captureId: state.captureId,
      capturedAt: state.capturedAt,
      connected: entry.connected,
      dom: entry.connected ? serializeElementSnapshot(entry.element) || entry.dom : entry.dom,
      referenceId: entry.referenceId,
      summary: entry.summary,
      tagName: entry.tagName
    };
  }

  function requireReferenceEntry(referenceId, options = {}) {
    const normalizedReferenceId = normalizeReferenceId(referenceId);
    if (!normalizedReferenceId) {
      throw createNamedError(
        "BrowserPageContentReferenceError",
        "Browser page content requests require a reference id.",
        {
          code: "browser_page_content_reference_required",
          details: {
            action: String(options.actionLabel || "resolve")
          }
        }
      );
    }

    if (!state.entries.size) {
      throw createNamedError(
        "BrowserPageContentReferenceError",
        `Browser page content has no reference capture for "${normalizedReferenceId}".`,
        {
          code: "browser_page_content_reference_missing_capture",
          details: {
            action: String(options.actionLabel || "resolve"),
            referenceId: normalizedReferenceId
          }
        }
      );
    }

    const entry = state.entries.get(normalizedReferenceId);
    if (!entry) {
      throw createNamedError(
        "BrowserPageContentReferenceError",
        `Browser page content could not find reference "${normalizedReferenceId}".`,
        {
          code: "browser_page_content_reference_not_found",
          details: {
            action: String(options.actionLabel || "resolve"),
            referenceId: normalizedReferenceId
          }
        }
      );
    }

    refreshReferenceEntry(entry);

    if (options.requireConnected !== false && !entry.connected) {
      throw createNamedError(
        "BrowserPageContentReferenceError",
        `Browser page content reference "${normalizedReferenceId}" is no longer connected.`,
        {
          code: "browser_page_content_reference_disconnected",
          details: {
            action: String(options.actionLabel || "resolve"),
            referenceId: normalizedReferenceId
          }
        }
      );
    }

    return entry;
  }

  function refreshReferenceEntry(entry) {
    if (!entry || !entry.element) {
      return entry;
    }

    entry.connected = entry.element.isConnected !== false;
    if (entry.connected) {
      entry.dom = serializeElementSnapshot(entry.element) || entry.dom;
      entry.id = normalizeAttributeText(entry.element.getAttribute?.("id"));
      entry.name = normalizeAttributeText(entry.element.getAttribute?.("name"));
      entry.summary = collectReferenceSummaryParts(entry.element).join(" ");
      entry.tagName = getTagName(entry.element);
    }

    return entry;
  }

  function scrollElementIntoView(element) {
    try {
      element.scrollIntoView?.({
        behavior: "auto",
        block: "center",
        inline: "center"
      });
      return true;
    } catch {
      return false;
    }
  }

  function focusElement(element) {
    try {
      element.focus?.({
        preventScroll: true
      });
      return true;
    } catch {
      try {
        element.focus?.();
        return true;
      } catch {
        return false;
      }
    }
  }

  function dispatchDomEvent(target, eventName, EventType = "Event", options = {}) {
    const EventConstructor = typeof globalThis[EventType] === "function"
      ? globalThis[EventType]
      : globalThis.Event;
    const event = new EventConstructor(eventName, {
      bubbles: true,
      cancelable: true,
      composed: true,
      ...options
    });
    target.dispatchEvent(event);
    return event;
  }

  function dispatchKeyboardEvent(target, eventName, options = {}) {
    const KeyboardEventConstructor = typeof globalThis.KeyboardEvent === "function"
      ? globalThis.KeyboardEvent
      : globalThis.Event;
    const event = new KeyboardEventConstructor(eventName, {
      bubbles: true,
      cancelable: true,
      composed: true,
      code: "Enter",
      key: "Enter",
      ...options
    });

    [
      ["charCode", Number(options.charCode ?? 0)],
      ["keyCode", Number(options.keyCode ?? 13)],
      ["which", Number(options.which ?? 13)]
    ].forEach(([propertyName, propertyValue]) => {
      try {
        if (typeof event[propertyName] !== "number") {
          Object.defineProperty(event, propertyName, {
            configurable: true,
            enumerable: true,
            value: propertyValue
          });
        }
      } catch {
        // Ignore read-only KeyboardEvent properties.
      }
    });

    target.dispatchEvent(event);
    return event;
  }

  function setNativeValue(element, nextValue) {
    const tagName = getTagName(element);
    const normalizedValue = String(nextValue ?? "");

    if (tagName === "INPUT") {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis.HTMLInputElement?.prototype || {}, "value");
      if (typeof descriptor?.set === "function") {
        descriptor.set.call(element, normalizedValue);
      } else {
        element.value = normalizedValue;
      }
      return normalizedValue;
    }

    if (tagName === "TEXTAREA") {
      const descriptor = Object.getOwnPropertyDescriptor(globalThis.HTMLTextAreaElement?.prototype || {}, "value");
      if (typeof descriptor?.set === "function") {
        descriptor.set.call(element, normalizedValue);
      } else {
        element.value = normalizedValue;
      }
      return normalizedValue;
    }

    if (tagName === "SELECT") {
      const matchedOption = [...(element.options || [])].find((option) => {
        return option.value === normalizedValue
          || normalizeText(option.textContent || "") === normalizeText(normalizedValue)
          || normalizeText(option.label || "") === normalizeText(normalizedValue);
      });

      const resolvedValue = matchedOption ? matchedOption.value : normalizedValue;
      const descriptor = Object.getOwnPropertyDescriptor(globalThis.HTMLSelectElement?.prototype || {}, "value");
      if (typeof descriptor?.set === "function") {
        descriptor.set.call(element, resolvedValue);
      } else {
        element.value = resolvedValue;
      }
      return resolvedValue;
    }

    if (String(element.getAttribute?.("contenteditable") || "").toLowerCase() === "true") {
      element.textContent = normalizedValue;
      return normalizedValue;
    }

    throw createNamedError(
      "BrowserPageContentActionError",
      `Browser page content cannot type into <${getTagName(element).toLowerCase()}>.`,
      {
        code: "browser_page_content_type_unsupported"
      }
    );
  }

  function updateElementValue(referenceId, value) {
    const entry = requireReferenceEntry(referenceId, {
      actionLabel: "type"
    });
    const element = entry.element;

    scrollElementIntoView(element);
    focusElement(element);
    const appliedValue = setNativeValue(element, value);

    if (typeof element.setSelectionRange === "function") {
      try {
        element.setSelectionRange(String(appliedValue).length, String(appliedValue).length);
      } catch {
        // Ignore selection errors for unsupported input types.
      }
    }

    dispatchDomEvent(element, "beforeinput", "InputEvent", {
      data: String(value ?? ""),
      inputType: "insertText"
    });
    dispatchDomEvent(element, "input", "InputEvent", {
      data: String(value ?? ""),
      inputType: "insertText"
    });
    dispatchDomEvent(element, "change");

    refreshReferenceEntry(entry);
    return {
      captureId: state.captureId,
      referenceId: entry.referenceId,
      summary: entry.summary,
      tagName: entry.tagName,
      value: appliedValue
    };
  }

  function activateElement(referenceId) {
    const entry = requireReferenceEntry(referenceId, {
      actionLabel: "click"
    });
    const element = entry.element;

    scrollElementIntoView(element);
    focusElement(element);

    if (element.disabled) {
      throw createNamedError(
        "BrowserPageContentActionError",
        `Browser page content reference "${entry.referenceId}" is disabled.`,
        {
          code: "browser_page_content_click_disabled"
        }
      );
    }

    if (typeof element.click === "function") {
      element.click();
    } else {
      dispatchDomEvent(element, "click", "MouseEvent", {
        button: 0
      });
    }

    refreshReferenceEntry(entry);
    return {
      captureId: state.captureId,
      referenceId: entry.referenceId,
      summary: entry.summary,
      tagName: entry.tagName
    };
  }

  function submitElement(referenceId) {
    const entry = requireReferenceEntry(referenceId, {
      actionLabel: "submit"
    });
    const element = entry.element;
    const tagName = getTagName(element);

    scrollElementIntoView(element);
    focusElement(element);

    if (tagName === "FORM") {
      if (typeof element.requestSubmit === "function") {
        element.requestSubmit();
      } else {
        const submitEvent = dispatchDomEvent(element, "submit");
        if (!submitEvent.defaultPrevented) {
          element.submit?.();
        }
      }
    } else if (typeof element.form?.requestSubmit === "function") {
      if (tagName === "BUTTON" || tagName === "INPUT") {
        element.form.requestSubmit(element);
      } else {
        element.form.requestSubmit();
      }
    } else if (element.form) {
      const submitEvent = dispatchDomEvent(element.form, "submit");
      if (!submitEvent.defaultPrevented) {
        element.form.submit?.();
      }
    } else if (typeof element.click === "function") {
      element.click();
    } else {
      throw createNamedError(
        "BrowserPageContentActionError",
        `Browser page content cannot submit reference "${entry.referenceId}".`,
        {
          code: "browser_page_content_submit_unsupported"
        }
      );
    }

    refreshReferenceEntry(entry);
    return {
      captureId: state.captureId,
      referenceId: entry.referenceId,
      summary: entry.summary,
      tagName: entry.tagName
    };
  }

  function shouldEnterSubmitForm(element) {
    const tagName = getTagName(element);
    if (tagName !== "INPUT") {
      return false;
    }

    const inputType = String(element.getAttribute?.("type") || element.type || "text").toLowerCase();
    return ![
      "button",
      "checkbox",
      "color",
      "file",
      "hidden",
      "image",
      "radio",
      "range",
      "reset",
      "submit"
    ].includes(inputType);
  }

  function pressEnterElement(referenceId, actionLabel = "type_submit") {
    const entry = requireReferenceEntry(referenceId, {
      actionLabel
    });
    const element = entry.element;

    scrollElementIntoView(element);
    focusElement(element);

    const keydownEvent = dispatchKeyboardEvent(element, "keydown", {
      charCode: 0,
      keyCode: 13,
      which: 13
    });
    const keypressEvent = dispatchKeyboardEvent(element, "keypress", {
      charCode: 13,
      keyCode: 13,
      which: 13
    });
    const keyupEvent = dispatchKeyboardEvent(element, "keyup", {
      charCode: 0,
      keyCode: 13,
      which: 13
    });

    if (
      !keydownEvent.defaultPrevented
      && !keypressEvent.defaultPrevented
      && !keyupEvent.defaultPrevented
      && shouldEnterSubmitForm(element)
    ) {
      if (typeof element.form?.requestSubmit === "function") {
        element.form.requestSubmit();
      } else if (element.form) {
        const submitEvent = dispatchDomEvent(element.form, "submit");
        if (!submitEvent.defaultPrevented) {
          element.form.submit?.();
        }
      }
    }

    refreshReferenceEntry(entry);
    return {
      captureId: state.captureId,
      referenceId: entry.referenceId,
      summary: entry.summary,
      tagName: entry.tagName
    };
  }

  function typeAndSubmit(referenceId, value) {
    const typed = updateElementValue(referenceId, value);
    const submitted = pressEnterElement(referenceId);

    return {
      ...submitted,
      value: typed.value
    };
  }

  function scrollToReference(referenceId) {
    const entry = requireReferenceEntry(referenceId, {
      actionLabel: "scroll"
    });

    scrollElementIntoView(entry.element);
    focusElement(entry.element);
    refreshReferenceEntry(entry);
    return {
      captureId: state.captureId,
      referenceId: entry.referenceId,
      summary: entry.summary,
      tagName: entry.tagName
    };
  }

  globalThis[GLOBAL_KEY] = {
    click(referenceId) {
      return activateElement(referenceId);
    },
    capture,
    clear() {
      state.captureId = 0;
      state.capturedAt = 0;
      state.entries = new Map();
    },
    detail,
    getState() {
      return {
        captureId: state.captureId,
        capturedAt: state.capturedAt,
        referenceCount: state.entries.size
      };
    },
    scroll(referenceId) {
      return scrollToReference(referenceId);
    },
    submit(referenceId) {
      return submitElement(referenceId);
    },
    type(referenceId, value) {
      return updateElementValue(referenceId, value);
    },
    typeSubmit(referenceId, value) {
      return typeAndSubmit(referenceId, value);
    },
    version: VERSION
  };
})();
