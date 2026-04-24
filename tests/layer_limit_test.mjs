import assert from "node:assert/strict";
import test from "node:test";

import {
  isProjectPathWithinMaxLayer,
  parseOptionalMaxLayer,
  resolveRequestMaxLayer
} from "../server/lib/customware/layer_limit.js";

test("parseOptionalMaxLayer clamps valid integers and ignores invalid values", () => {
  assert.equal(parseOptionalMaxLayer(-1), 0);
  assert.equal(parseOptionalMaxLayer("1"), 1);
  assert.equal(parseOptionalMaxLayer(99), 2);
  assert.equal(parseOptionalMaxLayer("1.5"), null);
  assert.equal(parseOptionalMaxLayer("abc"), null);
  assert.equal(parseOptionalMaxLayer(""), null);
});

test("resolveRequestMaxLayer prefers body, then query, then header", () => {
  assert.equal(
    resolveRequestMaxLayer({
      body: { maxLayer: 1 },
      headers: { "x-space-max-layer": "0" },
      requestUrl: new URL("http://example.test/api/file_list?maxLayer=2")
    }),
    1
  );

  assert.equal(
    resolveRequestMaxLayer({
      body: Buffer.from("ignored"),
      headers: { "x-space-max-layer": "0" },
      requestUrl: new URL("http://example.test/api/file_list?maxLayer=2")
    }),
    2
  );

  assert.equal(
    resolveRequestMaxLayer({
      headers: {
        get(name) {
          return name === "x-space-max-layer" ? "1" : null;
        }
      },
      requestUrl: new URL("http://example.test/api/file_list")
    }),
    1
  );
});

test("resolveRequestMaxLayer falls back to referer semantics and explicit fallback", () => {
  assert.equal(
    resolveRequestMaxLayer({
      fallback: 2,
      headers: {
        referer: "http://example.test/admin"
      }
    }),
    0
  );

  assert.equal(
    resolveRequestMaxLayer({
      fallback: 2,
      headers: {
        referer: "http://example.test/path?maxLayer=1"
      }
    }),
    1
  );

  assert.equal(
    resolveRequestMaxLayer({
      fallback: 1,
      headers: {
        referer: "::not-a-url::"
      }
    }),
    1
  );
});

test("isProjectPathWithinMaxLayer enforces layer visibility ceilings", () => {
  assert.equal(isProjectPathWithinMaxLayer("/app/L0/_all/mod/demo/file.js", 0), true);
  assert.equal(isProjectPathWithinMaxLayer("/app/L1/_all/mod/demo/file.js", 0), false);
  assert.equal(isProjectPathWithinMaxLayer("/app/L1/_all/mod/demo/file.js", 1), true);
  assert.equal(isProjectPathWithinMaxLayer("/app/L2/alice/mod/demo/file.js", 1), false);
  assert.equal(isProjectPathWithinMaxLayer("/app/L2/alice/mod/demo/file.js", 2), true);
});
