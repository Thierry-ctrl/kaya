import { integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export type SocialLinksRecord = { instagram: string; facebook: string };

export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  contactEmail: text("contact_email").notNull(),
  contactPhone: text("contact_phone").notNull(),
  openingHours: text("opening_hours").notNull(),
  deliveryAreas: text("delivery_areas").notNull(),
  deliveryFee: text("delivery_fee").notNull(),
  paymentMethods: text("payment_methods").notNull(),
  socialLinks: jsonb("social_links").$type<SocialLinksRecord>().notNull(),
  heroBadge: text("hero_badge").notNull(),
  heroText: text("hero_text").notNull(),
  storyTitle: text("story_title").notNull(),
  storyParagraph1: text("story_paragraph_1").notNull(),
  storyParagraph2: text("story_paragraph_2").notNull(),
  storyImageUrl: text("story_image_url").notNull(),
  storyImageAlt: text("story_image_alt").notNull(),
  storyImageCaption: text("story_image_caption").notNull(),
  logoUrl: text("logo_url").notNull(),
  illustrationNotice: text("illustration_notice").notNull(),
  version: integer("version").notNull().default(1),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SettingsRecord = typeof settingsTable.$inferSelect;