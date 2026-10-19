import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  expiresAt: integer("expires_at").notNull(),
}, table => [index("messages_expiry_idx").on(table.expiresAt)]);
