import fs from 'fs';
import path from 'path';
import { getPool, closePool } from '../config/database';

async function migrate(): Promise<void> {
  const schemaPath = path.resolve(__dirname, '..', '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');

  const pool = getPool();
  console.log('[migrate] Applying schema.sql ...');
  await pool.query(schema);
  console.log('[migrate] Schema applied successfully.');
}

migrate()
  .then(() => closePool())
  .then(() => process.exit(0))
  .catch(async (error: unknown) => {
    console.error('[migrate] Failed to apply schema:', error);
    await closePool().catch(() => undefined);
    process.exit(1);
  });
