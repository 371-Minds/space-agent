import assert from "node:assert/strict";
import test from "node:test";

import { globToRegExp, hasGlob, normalizePathSegment } from "../server/lib/utils/app_files.js";

test("normalizePathSegment trims and normalizes app-relative paths", () => {
  assert.equal(normalizePathSegment("  foo\\bar//baz  "), "foo/bar/baz");
  assert.equal(normalizePathSegment("/alpha/beta/"), "alpha/beta/");
  assert.equal(normalizePathSegment("."), "");
});

test("normalizePathSegment rejects traversal segments before normalization", () => {
  for (const value of ["../secret", "safe/../secret", "..\\secret", "safe\\..\\secret"]) {
    assert.throws(
      () => normalizePathSegment(value),
      /Path escapes app directory/u
    );
  }
});

test("hasGlob detects glob metacharacters", () => {
  assert.equal(hasGlob("mod/_core/framework/js/initFw.js"), false);
  assert.equal(hasGlob("mod/*/*/ext/**/*.js"), true);
  assert.equal(hasGlob("file[0-9].txt"), true);
});

test("globToRegExp supports common wildcard, brace, and character-class patterns", () => {
  const markdownMatcher = globToRegExp("docs/**/*.md");
  assert.equal(markdownMatcher.test("docs/readme.md"), true);
  assert.equal(markdownMatcher.test("docs/server/api/files.md"), true);
  assert.equal(markdownMatcher.test("docs/server/api/files.txt"), false);

  const moduleMatcher = globToRegExp("mod/*/{SKILL,README}.md");
  assert.equal(moduleMatcher.test("mod/demo/SKILL.md"), true);
  assert.equal(moduleMatcher.test("mod/demo/README.md"), true);
  assert.equal(moduleMatcher.test("mod/demo/NOTES.md"), false);

  const assetMatcher = globToRegExp("asset/file?.[!j][st]");
  assert.equal(assetMatcher.test("asset/file1.ts"), true);
  assert.equal(assetMatcher.test("asset/file2.js"), false);
});
