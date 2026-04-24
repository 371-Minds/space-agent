import assert from "node:assert/strict";
import test from "node:test";

import { post as postExtensionsLoad } from "../server/api/extensions_load.js";
import { post as postFilePaths } from "../server/api/file_paths.js";

test("file_paths rejects malformed glob patterns with a client error", () => {
  assert.throws(
    () =>
      postFilePaths({
        body: {
          patterns: ["mod/[z-a].js"]
        },
        params: {},
        projectRoot: "/tmp/space-agent-test",
        runtimeParams: null,
        user: { username: "alice" },
        watchdog: null
      }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Invalid file pattern/u);
      return true;
    }
  );
});

test("extensions_load rejects malformed glob patterns with a client error", () => {
  assert.throws(
    () =>
      postExtensionsLoad({
        body: {
          patterns: ["html/[z-a].html"]
        },
        headers: {},
        requestUrl: new URL("http://example.test/api/extensions_load"),
        runtimeParams: null,
        stateSystem: {},
        user: { username: "alice" }
      }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /Invalid extension pattern/u);
      return true;
    }
  );
});
