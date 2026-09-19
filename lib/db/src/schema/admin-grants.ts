import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const adminGrantsTable = pgTable("admin_grants", {
  clerkUserId: text("clerk_user_id").primaryKey(),
  grantedAt: timestamp("granted_at", { withTimezone: true }).notNull().defaultNow(),
  grantedBy: text("granted_by").notNull(),
});