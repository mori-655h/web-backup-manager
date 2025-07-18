import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { backupService } from "./services/backup";
import { wordpressService } from "./services/wordpress";
import { insertBackupJobSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate website URL and detect WordPress
  app.post("/api/validate-site", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ message: "URL is required" });
      }

      const siteInfo = await wordpressService.detectWordPressSite(url);
      res.json(siteInfo);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Create backup job
  app.post("/api/backup", async (req, res) => {
    try {
      const validatedData = insertBackupJobSchema.parse(req.body);
      const job = await storage.createBackupJob(validatedData);
      
      // Start backup process asynchronously
      backupService.startBackup(job.id).catch(error => {
        console.error(`Backup job ${job.id} failed:`, error);
      });

      res.json(job);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get backup job status
  app.get("/api/backup/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const job = await storage.getBackupJob(id);
      
      if (!job) {
        return res.status(404).json({ message: "Backup job not found" });
      }

      res.json(job);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Download backup file
  app.get("/api/backup/:id/download", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const filePath = await backupService.getBackupFile(id);
      
      if (!filePath) {
        return res.status(404).json({ message: "Backup file not found" });
      }

      const job = await storage.getBackupJob(id);
      const fileName = `backup-${new URL(job!.websiteUrl).hostname}-${Date.now()}.zip`;
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/zip');
      res.download(filePath, fileName);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get all backup jobs
  app.get("/api/backups", async (req, res) => {
    try {
      const jobs = await storage.getAllBackupJobs();
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Get recent backup jobs
  app.get("/api/backups/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const jobs = await storage.getRecentBackupJobs(limit);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}