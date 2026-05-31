import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { sql } from "drizzle-orm";

async function seed() {
  const password = "Demo1234!";
  const hash = await bcrypt.hash(password, 12);

  await db
    .insert(usersTable)
    .values({ email: "demo@phishguard.io", name: "Demo User", passwordHash: hash, role: "user" })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { passwordHash: hash, name: "Demo User", role: "user" },
    });
  console.log("✓ demo@phishguard.io seeded");

  const adminHash = await bcrypt.hash(password, 12);
  await db
    .insert(usersTable)
    .values({ email: "admin@phishguard.io", name: "Admin User", passwordHash: adminHash, role: "admin" })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: { passwordHash: adminHash, name: "Admin User", role: "admin" },
    });
  console.log("✓ admin@phishguard.io seeded");

  const rows = await db.execute(sql`SELECT id, email, role FROM users ORDER BY id`);
  console.log("Users in DB:", rows.rows);

  process.exit(0);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
