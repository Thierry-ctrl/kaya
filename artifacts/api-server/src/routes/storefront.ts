import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, productsTable, settingsTable } from "@workspace/db";
import { GetStorefrontResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/storefront", async (_req, res): Promise<void> => {
  const [products, settings] = await Promise.all([
    db.select().from(productsTable).where(eq(productsTable.published, true)).orderBy(asc(productsTable.createdAt)),
    db.select().from(settingsTable).where(eq(settingsTable.key, "site")).limit(1),
  ]);
  if (!settings[0]) {
    res.status(503).json({ error: "Storefront has not been configured" });
    return;
  }
  res.json(GetStorefrontResponse.parse({
    products: products.map(toProduct),
    settings: toSettings(settings[0]),
  }));
});

export function toProduct(row: typeof productsTable.$inferSelect) {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...product } = row;
  return product;
}

export function toSettings(row: typeof settingsTable.$inferSelect) {
  const { key: _key, updatedAt: _updatedAt, ...settings } = row;
  return settings;
}

export default router;