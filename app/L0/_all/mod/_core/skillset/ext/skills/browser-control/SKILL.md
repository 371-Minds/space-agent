---
name: Browser Control
description: Load this skill when you need to navigate the web through space.browser
---

Use this skill when the task needs to navigate the web, inspect a page, or interact with browser elements through `_core/web_browsing`.

scope
- This skill is for the frontend runtime only.
- It describes `space.browser`, which controls floating browser windows through numeric ids like `1`.
- `space.browser` is window-local. It only controls browser windows in the current app tab or desktop window.

runtime notes
- In the packaged native app, bridge-backed requests such as `ping`, raw `dom`, stateful reference-marked `content`, `detail`, and navigation commands work through the injected browser runtime, including after full guest-page navigations.
- In the packaged native app, ref-targeted browser actions such as `click`, `type`, `submit`, `typeSubmit`, and `scroll` also work through that same injected runtime and resolve against the latest `content` capture for that page.
- In ordinary browser sessions, agent-facing `space.browser` functions are guarded and return a warning object instead of attempting native-app-only browser actions.
- After opening a new window or navigating to a new page, that browser becomes the current browser-content source for prompt transient. The prompt builder will try to load fresh simplified page content from it automatically, so manual `content()` calls are often unnecessary.
- After opening a new window or navigating to a new page, call `await browser.sync()` before a bridge request when you need the injected runtime to be ready first.
- `detail` resolves against the latest `content` capture in that same page. If you call `content` again or navigate, the old ref ids are replaced.
- `typeSubmit(...)` types into the field and then presses `Enter` on that same field. Use it for search boxes and similar JS-driven inputs.
- Public `space.browser` ids are numeric. The runtime still accepts legacy `"browser-N"` strings as input, but handles, snapshots, and examples should use numeric ids.

workflow
- If a new browser window is needed, call `space.browser.open(url)` or `space.browser.create(...)`. Opening a browser marks it as the current browser-content source for transient context.
- If an existing browser should change page, call `space.browser.navigate(id, url)` or use history helpers. Navigation also marks that browser as the current browser-content source for transient context.
- Read refs from the browser content already present in transient context when available. If needed, call `space.browser.content(id)` to get a fresh explicit `[ref N]` map.
- When interaction is needed, pick the element ref number from that content.
- Call one interaction helper with the browser id and ref id, for example `space.browser.click(1, 79)`, `space.browser.type(1, 79, "hello")`, or `space.browser.typeSubmit(1, 79, "search terms")`.
- Use `space.browser.detail(id, ref)` when one ref needs deeper DOM inspection before acting.

warning shape
- In unsupported runtime, guarded calls return an object like:
- `{ available: false, code: "browser_native_app_only", requirement: "native_app_only", runtime: "browser", warning: "Browser functionality is currently only implemented in native apps.", message: "Browser functionality is currently only implemented in native apps." }`

namespace
- `space.browser.open(urlOrOptions?)` -> browser handle for the new window
- `space.browser.create(urlOrOptions?)` -> same as `open(...)`
- `space.browser.get(id)` -> browser handle or `null`
- `space.browser.current()` -> handle for the frontmost browser window or `null`
- `space.browser.ids()` -> `number[]`
- `space.browser.list()` -> snapshot objects for all open windows
- `space.browser.count()` -> number of open windows
- `space.browser.has(id)` -> boolean
- `space.browser.state(id)` -> one snapshot object or `null`
- `space.browser.close(id)` -> closes one window
- `space.browser.closeAll()` -> closes all windows and returns the number closed
- `space.browser.focus(id, options?)` -> handle or `null`
- `space.browser.navigate(id, url)` -> navigates one window
- `space.browser.reload(id)` -> reloads one window
- `space.browser.back(id)` -> history back for one window
- `space.browser.forward(id)` -> history forward for one window
- `space.browser.send(id, type, payload?, options?)` -> sends one bridge request by id
- `space.browser.dom(id, payload?, options?)` -> `dom` bridge wrapper
- `space.browser.content(id, payload?, options?)` -> `content` bridge wrapper
- `space.browser.detail(id, referenceId, options?)` -> `detail` bridge wrapper
- `space.browser.sync(id, options?)` -> refreshes bridge state and returns whether a live bridge response succeeded
- `space.browser.click(id, referenceId)` -> clicks one stored page ref
- `space.browser.type(id, referenceId, value)` -> types into one stored page ref
- `space.browser.submit(id, referenceId)` -> submits one stored page ref
- `space.browser.typeSubmit(id, referenceId, value)` -> types into one stored page ref and presses Enter in that field
- `space.browser.scroll(id, referenceId)` -> scrolls one stored page ref into view

handle
- `handle.id`
- `handle.state` -> current snapshot
- `handle.window` -> live store-backed window object
- `handle.bridge` -> resolved bridge object or `null`
- `handle.focus(options?)`
- `handle.navigate(url)`
- `handle.reload()`
- `handle.back()`
- `handle.forward()`
- `handle.close()`
- `handle.sync(options?)`
- `handle.send(type, payload?, options?)`
- `handle.dom(payload?, options?)`
- `handle.content(payload?, options?)`
- `handle.detail(referenceId, options?)`
- `handle.click(referenceId)`
- `handle.type(referenceId, value)`
- `handle.submit(referenceId)`
- `handle.typeSubmit(referenceId, value)`
- `handle.scroll(referenceId)`

bridge request types
- `ping` with any payload -> returns the exact string `received:<payload>`
- `dom` with no payload -> returns `{ document: "<serialized html>" }`
- `dom` with `{ selectors: ["title", "main", "a[href]"] }` -> returns an object keyed by the original selectors with concatenated `outerHTML` matches
- `content` with no payload -> returns `{ document: "<readable markdown with [ref N] markers>" }`
- `content` with `{ selectors: ["title", "main", "a[href]"] }` -> returns an object keyed by the original selectors with readable markdown converted from the live page and annotated with stable `[ref N]` markers for that capture
- `detail` with `79` or `{ referenceId: 79 }` -> returns the saved full DOM snapshot plus small metadata for reference `79` from the latest `content` capture
- `click` with `79` or `{ referenceId: 79 }` -> activates the stored reference from the latest `content` capture
- `type` with `{ referenceId: 79, value: "hello" }` -> types into the stored reference from the latest `content` capture
- `submit` with `79` or `{ referenceId: 79 }` -> submits the stored reference from the latest `content` capture
- `type_submit` with `{ referenceId: 79, value: "hello" }` -> types into the stored reference and presses Enter in that field
- `scroll` with `79` or `{ referenceId: 79 }` -> scrolls the stored reference into view
- `navigation_state_get` -> returns `{ canGoBack, canGoForward, title, url }`
- `location_navigate` with `{ url }`
- `history_back`
- `history_forward`
- `location_reload`

guidance
- Prefer `const browser = space.browser.get(1)` or `space.browser.current()` when you already know the target window.
- Prefer `const browser = space.browser.open("https://example.com")` when the task needs a fresh browser window; `open(...)` returns the handle directly, so use `browser.id` if you need the generated id.
- Prefer relying on the prompt transient browser-content block after `open(...)`, `create(...)`, `navigate(...)`, and browser interaction helpers before manually calling `content(...)` again.
- Use `browser.state` or `space.browser.list()` for inspection instead of reaching into Alpine stores directly.
- Use `browser.dom(...)`, `browser.content(...)`, and `browser.detail(...)` when you want the common inspection flows without spelling the raw bridge message names.
- Use `browser.send(...)` for lower-level injected page actions such as `ping` or any bridge type that does not have a dedicated wrapper.
- Use `content` first when you need to act on page elements. The returned `[ref N]` markers are the ids for later `detail`, `click`, `type`, `submit`, `typeSubmit`, or `scroll` calls.
- Use `browser.navigate(...)`, `browser.reload()`, `browser.back()`, and `browser.forward()` for host-side control instead of manually editing iframe or webview elements.

examples
Opening a new browser window and checking its state
_____javascript
const browser = space.browser.open("https://example.com");
await browser.sync();
return browser.state;

Using the current frontmost browser window
_____javascript
const browser = space.browser.current();
if (!browser) {
  throw new Error("No browser window is open.");
}
await browser.sync();
return await browser.send("navigation_state_get");

Fetching selected DOM from a browser window
_____javascript
const browser = space.browser.get(1);
if (!browser) {
  throw new Error("Browser 1 is not open.");
}
await browser.sync();
return await browser.send("dom", {
  selectors: ["title", "main", "a[href]"]
});

Fetching semantic content from the main article region
_____javascript
const browser = space.browser.get(1);
if (!browser) {
  throw new Error("Browser 1 is not open.");
}
await browser.sync();
return await browser.send("content", {
  selectors: ["main", "article"]
});

Inspecting one referenced element from the latest content capture
_____javascript
const browser = space.browser.get(1);
if (!browser) {
  throw new Error("Browser 1 is not open.");
}
await browser.sync();
const content = await browser.send("content");
console.log(content.document);
return await browser.send("detail", 79);

Using the convenience wrappers instead of raw send
_____javascript
const browser = space.browser.get(1);
if (!browser) {
  throw new Error("Browser 1 is not open.");
}
await browser.sync();
const content = await browser.content({
  selectors: ["main"]
});
console.log(content.main);
return await browser.detail(79);

Clicking a referenced element after a content capture
_____javascript
const browser = space.browser.get(1);
if (!browser) {
  throw new Error("Browser 1 is not open.");
}
await browser.sync();
const content = await browser.send("content");
console.log(content.document);
return await browser.click(79);

Typing into a referenced input and submitting it
_____javascript
await space.browser.sync(1);
const content = await space.browser.send(1, "content");
console.log(content.document);
return await space.browser.typeSubmit(1, 79, "Space Agent");

Opening a local placeholder browser and smoke-testing the bridge
_____javascript
const browser = space.browser.open();
await browser.sync();
return await browser.send("ping", "hello");

Closing every open browser window
_____javascript
return {
  closed: space.browser.closeAll()
};
