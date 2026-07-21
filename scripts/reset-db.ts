import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

const { sql, initSchema } = await import('../api/_db');

await initSchema();

await sql`
  TRUNCATE TABLE
    session_members,
    sessions,
    settlements,
    player_balances,
    members
  RESTART IDENTITY CASCADE
`;

console.log('✓ All tables cleared (members, sessions, session_members, settlements, player_balances)');

if ('end' in sql && typeof sql.end === 'function') {
  await sql.end();
}
