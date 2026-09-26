import { boolean, integer, pgTable, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const appSettingsTable = pgTable("app_settings", {
  id: integer("id").primaryKey().default(1),
  aiEnabled: boolean("ai_enabled").notNull().default(true),
  notifications: boolean("notifications").notNull().default(true),
  warAlerts: boolean("war_alerts").notNull().default(true),
  autoRefresh: boolean("auto_refresh").notNull().default(true),
  compactMode: boolean("compact_mode").notNull().default(false),
  soundEffects: boolean("sound_effects").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAppSettingsSchema = createInsertSchema(appSettingsTable).omit({
  updatedAt: true,
});

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettingsTable.$inferSelect;
