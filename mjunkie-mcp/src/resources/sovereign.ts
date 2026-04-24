/**
 * Sovereign Engine MCP Resource.
 *
 * Exposes the full db.json schema and current snapshot as a passively
 * available MCP Resource so agents always have context on the content pipeline.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const SOVEREIGN_RESOURCE_URI = 'sovereign://db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DB_PATH = join(__dirname, '../../db.json');

export function getSovereignResource() {
  let dbText: string;
  try {
    dbText = readFileSync(DB_PATH, 'utf-8');
  } catch {
    dbText = JSON.stringify({ error: 'db.json not found' });
  }

  return {
    uri: SOVEREIGN_RESOURCE_URI,
    name: 'Sovereign Engine Database',
    description:
      'Live snapshot of the Multimedia Junkie Sovereign Engine database. ' +
      'Contains characters, cases, beats, and assets for autonomous pipeline management.',
    mimeType: 'application/json',
    text: dbText,
  };
}
