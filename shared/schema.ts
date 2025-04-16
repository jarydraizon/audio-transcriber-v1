import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Transcription related types and schemas
export const transcriptionSchema = z.object({
  text: z.string(),
  duration: z.number().optional(),
  filename: z.string().optional(),
  wasCompressed: z.boolean().optional(),
});

export type Transcription = z.infer<typeof transcriptionSchema>;

export const audioFileSchema = z.object({
  filename: z.string(),
  size: z.number(),
  mimeType: z.string().regex(/^audio\/(mpeg|wav|mp4|x-m4a)$/),
});

export type AudioFile = z.infer<typeof audioFileSchema>;
