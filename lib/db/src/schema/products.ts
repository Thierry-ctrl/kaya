import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type ProductSizeRecord = {
  id: string;
  label: string;
  price: number;
};

export const productsTable = pgTable("products", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  shortDescription: text("short_description").notNull(),
  imageUrl: text("image_url").notNull(),
  altText: text("alt_text").notNull(),
  availability: text("availability").notNull(),
  sizes: jsonb("sizes").$type<ProductSizeRecord[]>().notNull(),
  isSample: boolean("is_sample").notNull(),
  published: boolean("published").notNull().default(false),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ProductRecord = typeof productsTable.$inferSelect;