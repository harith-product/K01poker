import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const { sql, initSchema } = await import('../api/_db');
const { parseStandardCSV, parseTransposedCSV } = await import('../api/_csvParse');
const { importSessionsToDb } = await import('../api/_gameData');

const args = process.argv.slice(2);
function getArg(flag: string): string | undefined {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
}

const type = getArg('--type') as 'online' | 'offline' | 'tournament' | 'offline_tournament' | undefined;
const file = getArg('--file');
const format = getArg('--format') || 'standard';

if (!type || !file) {
  console.log(`Usage: npm run import:csv -- --type <online|offline|tournament|offline_tournament> --file <path> [--format standard|transposed]

Examples:
  npm run import:csv -- --type offline --file ./data/offline.csv
  npm run import:csv -- --type online --file ./data/online.csv
  npm run import:csv -- --type tournament --file ./data/tournament.csv --format transposed
`);
  process.exit(1);
}

const text = readFileSync(resolve(file), 'utf-8');
const parsed = format === 'transposed'
  ? parseTransposedCSV(text)
  : parseStandardCSV(text);

await initSchema();
const result = await importSessionsToDb(type, parsed);
console.log(`✓ Imported ${result.imported} sessions (${type})`);

if ('end' in sql && typeof sql.end === 'function') {
  await sql.end();
}
