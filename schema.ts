import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const backupJobs = pgTable("backup_jobs", {
  id: serial("id").primaryKey(),
  websiteUrl: text("website_url").notNull(),
  backupType: text("backup_type").notNull(), // 'full' | 'database'
  status: text("status").notNull().default("pending"), // 'pending' | 'processing' | 'completed' | 'failed'
  progress: integer("progress").default(0),
  currentStep: text("current_step"),
  siteInfo: jsonb("site_info"), // WordPress version, theme, plugins, etc.
  options: jsonb("options"), // includes media, plugins, themes, compression flags
  credentials: jsonb("credentials"), // username/password if needed
  backupFilePath: text("backup_file_path"),
  backupFileSize: integer("backup_file_size"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertBackupJobSchema = createInsertSchema(backupJobs).pick({
  websiteUrl: true,
  backupType: true,
  options: true,
  credentials: true,
});

export const updateBackupJobSchema = createInsertSchema(backupJobs).pick({
  status: true,
  progress: true,
  currentStep: true,
  siteInfo: true,
  backupFilePath: true,
  backupFileSize: true,
  errorMessage: true,
  completedAt: true,
}).partial();

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type BackupJob = typeof backupJobs.$inferSelect;
export type InsertBackupJob = z.infer<typeof insertBackupJobSchema>;
export type UpdateBackupJob = z.infer<typeof updateBackupJobSchema>;
