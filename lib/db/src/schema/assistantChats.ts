import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const assistantChatsTable = pgTable("assistant_chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAssistantChatSchema = createInsertSchema(assistantChatsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAssistantChat = z.infer<typeof insertAssistantChatSchema>;
export type AssistantChat = typeof assistantChatsTable.$inferSelect;
