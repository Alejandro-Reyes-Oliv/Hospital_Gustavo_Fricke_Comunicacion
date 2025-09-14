import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(__dirname, '../../inbound.jsonl');

/**
 * Placeholder para la BD:
 * Escribir evento como JSON.
 * Reemplazar por BD o API
 */
export function logInbound(event) {
  const line = JSON.stringify({ ts: new Date().toISOString(), ...event });
  fs.appendFileSync(LOG_PATH, line + '\n', 'utf8');
}
