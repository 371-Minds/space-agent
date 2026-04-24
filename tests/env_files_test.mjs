import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  loadProjectEnvFiles,
  parseDotEnvText,
  writeDotEnvValue
} from "../server/lib/utils/env_files.js";

test("parseDotEnvText keeps the first value for duplicate keys and parses quoted values", () => {
  assert.deepEqual(
    parseDotEnvText(`
# comment
SPACE_NAME = "Space Agent"
EMPTY=
SINGLE='literal value'
SPACE_NAME=ignored
TRIMMED = value
`),
    {
      EMPTY: "",
      SINGLE: "literal value",
      SPACE_NAME: "Space Agent",
      TRIMMED: "value"
    }
  );
});

test("loadProjectEnvFiles preserves existing env values and fills missing keys from project files", async (testContext) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "space-env-files-"));

  testContext.after(async () => {
    await rm(projectRoot, { force: true, recursive: true });
  });

  await writeFile(path.join(projectRoot, ".env"), "FROM_ENV=base\nSHARED=base\n", "utf8");
  await writeFile(path.join(projectRoot, ".env.local"), "FROM_LOCAL=local\nSHARED=local\n", "utf8");

  const env = {
    SHARED: "existing"
  };

  loadProjectEnvFiles(projectRoot, env);

  assert.deepEqual(env, {
    FROM_ENV: "base",
    FROM_LOCAL: "local",
    SHARED: "existing"
  });
});

test("writeDotEnvValue updates existing keys, appends new keys, and validates names", async (testContext) => {
  const projectRoot = await mkdtemp(path.join(os.tmpdir(), "space-env-files-"));
  const envPath = path.join(projectRoot, ".env");

  testContext.after(async () => {
    await rm(projectRoot, { force: true, recursive: true });
  });

  await writeFile(envPath, "FIRST=one\nSECOND=two\n", "utf8");

  writeDotEnvValue(envPath, "SECOND", "updated value");
  writeDotEnvValue(envPath, "THIRD", "three");

  assert.equal(
    await readFile(envPath, "utf8"),
    'FIRST=one\nSECOND="updated value"\nTHIRD=three\n'
  );

  assert.throws(
    () => writeDotEnvValue(envPath, "NOT-VALID", "value"),
    /Invalid \.env key/u
  );
});
