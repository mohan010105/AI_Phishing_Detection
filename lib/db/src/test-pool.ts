import { pool } from './index.js';

async function test() {
  console.log('Querying pool directly...');
  try {
    const res = await pool.query('SELECT * FROM "users"');
    console.log('✓ Pool query success!');
    console.log('Raw result structure:', res);
    console.log('Raw rows:', res.rows);
  } catch (err: any) {
    console.error('✗ Pool query failed:', err);
  }
}

setTimeout(test, 500);
