import { storage } from '../storage';
import { wordpressService } from './wordpress';
import { BackupJob, UpdateBackupJob } from '@shared/schema';
import JSZip from 'jszip';
import axios from 'axios';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export class BackupService {
  private backupDir = path.join(process.cwd(), 'backups');

  constructor() {
    this.ensureBackupDirectory();
  }

  private async ensureBackupDirectory() {
    try {
      await mkdir(this.backupDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create backup directory:', error);
    }
  }

  async startBackup(jobId: number): Promise<void> {
    const job = await storage.getBackupJob(jobId);
    if (!job) {
      throw new Error('Backup job not found');
    }

    try {
      await this.updateJobStatus(jobId, {
        status: 'processing',
        progress: 0,
        currentStep: 'تشخیص نوع وب‌سایت...'
      });

      // Step 1: Detect WordPress site
      const siteInfo = await wordpressService.detectWordPressSite(job.websiteUrl);
      
      if (!siteInfo.isWordPress) {
        throw new Error('فقط وب‌سایت‌های وردپرس پشتیبانی می‌شوند');
      }

      await this.updateJobStatus(jobId, {
        progress: 20,
        siteInfo: siteInfo as any,
        currentStep: 'استخراج محتوا...'
      });

      // Step 2: Extract content
      const content = await this.extractContent(job, siteInfo);
      
      await this.updateJobStatus(jobId, {
        progress: 60,
        currentStep: 'دانلود فایل‌های رسانه...'
      });

      // Step 3: Download media files (if full backup)
      let mediaFiles: Array<{ name: string; data: Buffer }> = [];
      if (job.backupType === 'full' && job.options && (job.options as any).includeMedia) {
        mediaFiles = await this.downloadMediaFiles(content.media);
      }

      await this.updateJobStatus(jobId, {
        progress: 80,
        currentStep: 'ایجاد فایل پشتیبان...'
      });

      // Step 4: Create backup file
      const backupPath = await this.createBackupFile(job, content, mediaFiles);
      const fileStats = await fs.promises.stat(backupPath);

      await this.updateJobStatus(jobId, {
        status: 'completed',
        progress: 100,
        currentStep: 'تکمیل شد',
        backupFilePath: backupPath,
        backupFileSize: fileStats.size,
        completedAt: new Date()
      });

    } catch (error) {
      await this.updateJobStatus(jobId, {
        status: 'failed',
        errorMessage: error.message
      });
      throw error;
    }
  }

  private async updateJobStatus(jobId: number, updates: UpdateBackupJob): Promise<void> {
    await storage.updateBackupJob(jobId, updates);
  }

  private async extractContent(job: BackupJob, siteInfo: any) {
    const credentials = job.credentials as any;
    
    if (siteInfo.hasRestApi) {
      return await wordpressService.getWordPressContent(
        siteInfo.restApiUrl,
        credentials
      );
    } else {
      // Fallback to web scraping if REST API is not available
      return await this.scrapeWebsite(job.websiteUrl);
    }
  }

  private async scrapeWebsite(url: string) {
    // Basic web scraping implementation
    const response = await axios.get(url);
    
    return {
      posts: [],
      pages: [
        {
          title: { rendered: 'Home Page' },
          content: { rendered: response.data },
          date: new Date().toISOString()
        }
      ],
      media: []
    };
  }

  private async downloadMediaFiles(mediaItems: any[]): Promise<Array<{ name: string; data: Buffer }>> {
    const files: Array<{ name: string; data: Buffer }> = [];
    
    for (const item of mediaItems.slice(0, 10)) { // Limit to first 10 items for demo
      try {
        const response = await axios.get(item.source_url, {
          responseType: 'arraybuffer',
          timeout: 30000
        });
        
        const fileName = path.basename(item.source_url);
        files.push({
          name: fileName,
          data: Buffer.from(response.data)
        });
      } catch (error) {
        console.error(`Failed to download media file ${item.source_url}:`, error);
      }
    }
    
    return files;
  }

  private async createBackupFile(
    job: BackupJob,
    content: any,
    mediaFiles: Array<{ name: string; data: Buffer }>
  ): Promise<string> {
    const zip = new JSZip();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const siteName = new URL(job.websiteUrl).hostname;
    const fileName = `${siteName}-backup-${timestamp}.zip`;
    const filePath = path.join(this.backupDir, fileName);

    // Add content as JSON
    zip.file('content.json', JSON.stringify(content, null, 2));
    
    // Add site info
    zip.file('site-info.json', JSON.stringify(job.siteInfo, null, 2));
    
    // Add WordPress export XML (simplified)
    const wpExport = this.generateWordPressExport(content);
    zip.file('wordpress-export.xml', wpExport);
    
    // Add media files
    if (mediaFiles.length > 0) {
      const mediaFolder = zip.folder('media');
      mediaFiles.forEach(file => {
        mediaFolder?.file(file.name, file.data);
      });
    }

    // Add restore instructions
    const instructions = this.generateRestoreInstructions(job);
    zip.file('restore-instructions.txt', instructions);

    // Generate and save zip file
    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    await writeFile(filePath, zipContent);

    return filePath;
  }

  private generateWordPressExport(content: any): string {
    // Generate a simplified WordPress WXR export file
    const posts = [...(content.posts || []), ...(content.pages || [])];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:excerpt="http://wordpress.org/export/1.2/excerpt/"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:wfw="http://wellformedweb.org/CommentAPI/"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:wp="http://wordpress.org/export/1.2/">
<channel>
  <title>WordPress Backup Export</title>
  <description>Generated by WordPress Backup Tool</description>
  <pubDate>${new Date().toUTCString()}</pubDate>
  <language>en-US</language>
  <wp:wxr_version>1.2</wp:wxr_version>
  <wp:base_site_url><![CDATA[${content.baseUrl || ''}]]></wp:base_site_url>
  <wp:base_blog_url><![CDATA[${content.baseUrl || ''}]]></wp:base_blog_url>
`;

    posts.forEach((post: any, index: number) => {
      xml += `
  <item>
    <title><![CDATA[${post.title?.rendered || `Post ${index + 1}`}]]></title>
    <pubDate>${new Date(post.date || Date.now()).toUTCString()}</pubDate>
    <dc:creator><![CDATA[admin]]></dc:creator>
    <content:encoded><![CDATA[${post.content?.rendered || ''}]]></content:encoded>
    <excerpt:encoded><![CDATA[${post.excerpt?.rendered || ''}]]></excerpt:encoded>
    <wp:post_id>${post.id || index + 1}</wp:post_id>
    <wp:post_date><![CDATA[${post.date || new Date().toISOString()}]]></wp:post_date>
    <wp:post_date_gmt><![CDATA[${post.date || new Date().toISOString()}]]></wp:post_date_gmt>
    <wp:comment_status><![CDATA[open]]></wp:comment_status>
    <wp:ping_status><![CDATA[open]]></wp:ping_status>
    <wp:post_name><![CDATA[${post.slug || `post-${index + 1}`}]]></wp:post_name>
    <wp:status><![CDATA[${post.status || 'publish'}]]></wp:status>
    <wp:post_parent>0</wp:post_parent>
    <wp:menu_order>0</wp:menu_order>
    <wp:post_type><![CDATA[${post.type || 'post'}]]></wp:post_type>
    <wp:post_password><![CDATA[]]></wp:post_password>
    <wp:is_sticky>0</wp:is_sticky>
  </item>`;
    });

    xml += `
</channel>
</rss>`;

    return xml;
  }

  private generateRestoreInstructions(job: BackupJob): string {
    return `WordPress Backup Restore Instructions
==========================================

This backup was created on: ${new Date().toLocaleDateString('fa-IR')}
Source website: ${job.websiteUrl}
Backup type: ${job.backupType === 'full' ? 'کامل' : 'دیتابیس'}

Files included:
- content.json: Raw content data from WordPress API
- wordpress-export.xml: WordPress WXR export file
- site-info.json: Site information and configuration
- media/: Media files (if full backup)

To restore:
1. Install WordPress on your new server
2. Go to WordPress Admin → Tools → Import
3. Install WordPress Importer plugin
4. Upload the wordpress-export.xml file
5. Follow the import wizard
6. Upload media files to wp-content/uploads/

For manual restoration:
1. Extract content.json to see all posts and pages
2. Manually recreate content in new WordPress installation
3. Upload media files to appropriate directories

Support: This backup was created using WordPress Backup Tool
`;
  }

  async getBackupFile(jobId: number): Promise<string | null> {
    const job = await storage.getBackupJob(jobId);
    if (!job || !job.backupFilePath) {
      return null;
    }

    if (fs.existsSync(job.backupFilePath)) {
      return job.backupFilePath;
    }

    return null;
  }
}

export const backupService = new BackupService();
