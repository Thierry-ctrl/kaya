import { getAuth } from "@clerk/express";
import { eq } from "drizzle-orm";
import type { RequestHandler } from "express";
import { adminGrantsTable, db } from "@workspace/db";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const auth = getAuth(req);
  const userId = auth.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [grant] = await db
    .select({ clerkUserId: adminGrantsTable.clerkUserId })
    .from(adminGrantsTable)
    .where(eq(adminGrantsTable.clerkUserId, userId))
    .limit(1);
  if (!grant) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  res.locals.adminUserId = userId;
  res.locals.userId = userId;
  next();
};