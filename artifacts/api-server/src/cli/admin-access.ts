import { createClerkClient } from "@clerk/express";
import { pool } from "@workspace/db";

const [action, userId, ...rest] = process.argv.slice(2);
if ((action !== "grant" && action !== "revoke") || !userId || !/^user_[A-Za-z0-9]+$/.test(userId)) {
  throw new Error("Usage: pnpm admin:grant user_ID [--by operator] or pnpm admin:revoke user_ID");
}
if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required");

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const user = await clerk.users.getUser(userId);
if (user.id !== userId) throw new Error("Clerk user verification failed");

if (action === "grant") {
  const byIndex = rest.indexOf("--by");
  const grantedBy = byIndex >= 0 ? rest[byIndex + 1] : process.env.USER;
  if (!grantedBy) throw new Error("Provide --by operator");
  await pool.query(
    `INSERT INTO admin_grants (clerk_user_id, granted_by) VALUES ($1, $2)
     ON CONFLICT (clerk_user_id) DO UPDATE SET granted_by = EXCLUDED.granted_by, granted_at = now()`,
    [userId, grantedBy],
  );
  process.stdout.write(`Granted administrator access to verified Clerk user ${userId}.\n`);
} else {
  await pool.query("DELETE FROM admin_grants WHERE clerk_user_id = $1", [userId]);
  process.stdout.write(`Revoked administrator access from verified Clerk user ${userId}.\n`);
}
await pool.end();