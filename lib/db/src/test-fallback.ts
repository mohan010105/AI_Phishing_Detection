import { db, usersTable } from './index.js';

async function test() {
  console.log('Attempting to query users from the database client...');
  try {
    const users = await db.select().from(usersTable);
    console.log('✓ Successfully retrieved users!');
    console.log('Users list:', users);
  } catch (err: any) {
    console.error('✗ Query failed:', err);
  }
}

// Give a tiny delay to let the connection check finish
setTimeout(test, 500);
