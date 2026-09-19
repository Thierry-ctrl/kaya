import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, asc, eq } from "drizzle-orm";
import {
  CreateAdminProductBody,
  CreateAdminProductResponse,
  DeleteAdminProductParams,
  DeleteAdminProductQueryParams,
  GetAdminMeResponse,
  GetAdminProductsResponse,
  GetAdminSettingsResponse,
  UpdateAdminProductBody,
  UpdateAdminProductParams,
  UpdateAdminProductResponse,
  UpdateAdminSettingsBody,
  UpdateAdminSettingsResponse,
} from "@workspace/api-zod";
import { db, productsTable, settingsTable } from "@workspace/db";
import { requireAdmin } from "../middlewares/require-admin";
import { validateProductRules } from "../lib/product-validation";
import { isSafeImageUrl, isSafeSocialUrl } from "../lib/url-validation";
import { toProduct, toSettings } from "./storefront";

const router: IRouter = Router();
router.use("/admin", requireAdmin);

router.get("/admin/me", (_req, res) => {
  res.json(GetAdminMeResponse.parse({ userId: res.locals.adminUserId }));
});

router.get("/admin/products", async (_req, res): Promise<void> => {
  const rows = await db.select().from(productsTable).orderBy(asc(productsTable.createdAt));
  res.json(GetAdminProductsResponse.parse(rows.map(toProduct)));
});

router.post("/admin/products", async (req, res): Promise<void> => {
  const parsed = CreateAdminProductBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid product" });
    return;
  }
  const error = validateProductRules(parsed.data);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  if (!isSafeImageUrl(parsed.data.imageUrl)) {
    res.status(400).json({ error: "Invalid product image URL" });
    return;
  }
  const [row] = await db.insert(productsTable).values({ id: randomUUID(), ...parsed.data }).returning();
  res.status(201).json(CreateAdminProductResponse.parse(toProduct(row)));
});

router.put("/admin/products/:id", async (req, res): Promise<void> => {
  const params = UpdateAdminProductParams.safeParse(req.params);
  const body = UpdateAdminProductBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid product update" });
    return;
  }
  const error = validateProductRules(body.data);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  if (!isSafeImageUrl(body.data.imageUrl)) {
    res.status(400).json({ error: "Invalid product image URL" });
    return;
  }
  const { version, ...changes } = body.data;
  const [row] = await db.update(productsTable)
    .set({ ...changes, version: version + 1, updatedAt: new Date() })
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.version, version)))
    .returning();
  if (!row) {
    const [existing] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, params.data.id)).limit(1);
    res.status(existing ? 409 : 404).json({ error: existing ? "Product was modified by another administrator" : "Product not found" });
    return;
  }
  res.json(UpdateAdminProductResponse.parse(toProduct(row)));
});

router.delete("/admin/products/:id", async (req, res): Promise<void> => {
  const params = DeleteAdminProductParams.safeParse(req.params);
  const query = DeleteAdminProductQueryParams.safeParse(req.query);
  if (!params.success || !query.success) {
    res.status(400).json({ error: "A valid product ID and version are required" });
    return;
  }
  const [row] = await db.delete(productsTable)
    .where(and(eq(productsTable.id, params.data.id), eq(productsTable.version, query.data.version)))
    .returning({ id: productsTable.id });
  if (!row) {
    const [existing] = await db.select({ id: productsTable.id }).from(productsTable).where(eq(productsTable.id, params.data.id)).limit(1);
    res.status(existing ? 409 : 404).json({ error: existing ? "Product was modified by another administrator" : "Product not found" });
    return;
  }
  res.status(204).end();
});

router.get("/admin/settings", async (_req, res): Promise<void> => {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, "site")).limit(1);
  if (!row) {
    res.status(404).json({ error: "Settings not found; run the seed command" });
    return;
  }
  res.json(GetAdminSettingsResponse.parse(toSettings(row)));
});

router.put("/admin/settings", async (req, res): Promise<void> => {
  const parsed = UpdateAdminSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid settings" });
    return;
  }
  if (
    !isSafeImageUrl(parsed.data.storyImageUrl) ||
    !isSafeImageUrl(parsed.data.logoUrl) ||
    !isSafeSocialUrl(parsed.data.socialLinks.instagram, "instagram") ||
    !isSafeSocialUrl(parsed.data.socialLinks.facebook, "facebook")
  ) {
    res.status(400).json({ error: "Invalid settings URL" });
    return;
  }
  const { version, ...changes } = parsed.data;
  const [row] = await db.update(settingsTable)
    .set({ ...changes, version: version + 1, updatedAt: new Date() })
    .where(and(eq(settingsTable.key, "site"), eq(settingsTable.version, version)))
    .returning();
  if (!row) {
    const [existing] = await db.select({ key: settingsTable.key }).from(settingsTable).where(eq(settingsTable.key, "site")).limit(1);
    res.status(existing ? 409 : 404).json({ error: existing ? "Settings were modified by another administrator" : "Settings not found" });
    return;
  }
  res.json(UpdateAdminSettingsResponse.parse(toSettings(row)));
});

export default router;