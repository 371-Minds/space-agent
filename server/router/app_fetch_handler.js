import path from "node:path";

import { createAppAccessController } from "../lib/customware/file_access.js";
import { normalizeAppProjectPath } from "../lib/customware/layout.js";
import { sendFile, sendJson, sendNotFound } from "./responses.js";

function getGroupIndex(watchdog) {
  if (!watchdog || typeof watchdog.getIndex !== "function") {
    return null;
  }
  return watchdog.getIndex("group_index");
}

function resolveAppFetchProjectPath(requestPath, username) {
  const normalizedPath = path.posix.normalize(requestPath || "/");
  let appRelativePath;

  if (normalizedPath.startsWith("/~/")) {
    if (!username) return null;
    appRelativePath = `L2/${username}/${normalizedPath.slice(3)}`;
  } else if (/^\/(L0|L1|L2)\//.test(normalizedPath)) {
    appRelativePath = normalizedPath.slice(1);
  } else {
    return null;
  }

  const projectPath = normalizeAppProjectPath(appRelativePath);
  return projectPath && projectPath.startsWith("/app/") ? projectPath : null;
}

function handleAppFetchRequest(res, requestPath, options = {}) {
  const { projectRoot, username, watchdog } = options;
  const projectPath = resolveAppFetchProjectPath(requestPath, username);

  if (!projectPath) {
    sendNotFound(res);
    return;
  }

  const accessController = createAppAccessController({
    groupIndex: getGroupIndex(watchdog),
    username
  });

  if (!accessController.canReadProjectPath(projectPath)) {
    sendJson(res, 403, { error: "Access denied" });
    return;
  }

  const absolutePath = path.join(projectRoot, projectPath.slice(1));
  sendFile(res, absolutePath);
}

export { handleAppFetchRequest };
