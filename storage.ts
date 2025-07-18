import { users, backupJobs, type User, type InsertUser, type BackupJob, type InsertBackupJob, type UpdateBackupJob } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  createBackupJob(job: InsertBackupJob): Promise<BackupJob>;
  getBackupJob(id: number): Promise<BackupJob | undefined>;
  updateBackupJob(id: number, updates: UpdateBackupJob): Promise<BackupJob | undefined>;
  getAllBackupJobs(): Promise<BackupJob[]>;
  getRecentBackupJobs(limit?: number): Promise<BackupJob[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private backupJobs: Map<number, BackupJob>;
  private currentUserId: number;
  private currentJobId: number;

  constructor() {
    this.users = new Map();
    this.backupJobs = new Map();
    this.currentUserId = 1;
    this.currentJobId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createBackupJob(insertJob: InsertBackupJob): Promise<BackupJob> {
    const id = this.currentJobId++;
    const job: BackupJob = {
      ...insertJob,
      id,
      status: "pending",
      progress: 0,
      currentStep: null,
      siteInfo: null,
      backupFilePath: null,
      backupFileSize: null,
      errorMessage: null,
      createdAt: new Date(),
      completedAt: null,
      credentials: insertJob.credentials || null,
      options: insertJob.options || null,
    };
    this.backupJobs.set(id, job);
    return job;
  }

  async getBackupJob(id: number): Promise<BackupJob | undefined> {
    return this.backupJobs.get(id);
  }

  async updateBackupJob(id: number, updates: UpdateBackupJob): Promise<BackupJob | undefined> {
    const job = this.backupJobs.get(id);
    if (!job) return undefined;

    const updatedJob = { ...job, ...updates };
    this.backupJobs.set(id, updatedJob);
    return updatedJob;
  }

  async getAllBackupJobs(): Promise<BackupJob[]> {
    return Array.from(this.backupJobs.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getRecentBackupJobs(limit: number = 10): Promise<BackupJob[]> {
    const jobs = await this.getAllBackupJobs();
    return jobs.slice(0, limit);
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createBackupJob(insertJob: InsertBackupJob): Promise<BackupJob> {
    const [job] = await db
      .insert(backupJobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getBackupJob(id: number): Promise<BackupJob | undefined> {
    const [job] = await db.select().from(backupJobs).where(eq(backupJobs.id, id));
    return job || undefined;
  }

  async updateBackupJob(id: number, updates: UpdateBackupJob): Promise<BackupJob | undefined> {
    const [job] = await db
      .update(backupJobs)
      .set(updates)
      .where(eq(backupJobs.id, id))
      .returning();
    return job || undefined;
  }

  async getAllBackupJobs(): Promise<BackupJob[]> {
    return await db.select().from(backupJobs).orderBy(desc(backupJobs.createdAt));
  }

  async getRecentBackupJobs(limit: number = 10): Promise<BackupJob[]> {
    return await db.select().from(backupJobs)
      .orderBy(desc(backupJobs.createdAt))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
