import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const { sql, initSchema } = await import('../api/_db');

await initSchema();
console.log('✓ Database schema initialized');

if ('end' in sql && typeof sql.end === 'function') {
  await sql.end();
}
