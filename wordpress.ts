import axios from 'axios';
import * as cheerio from 'cheerio';

export interface WordPressSiteInfo {
  isWordPress: boolean;
  version?: string;
  theme?: string;
  plugins?: number;
  restApiUrl?: string;
  hasRestApi?: boolean;
  requiresAuth?: boolean;
}

export class WordPressService {
  async detectWordPressSite(url: string): Promise<WordPressSiteInfo> {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Check for WordPress indicators
      const isWordPress = this.checkWordPressIndicators($, response.data);
      
      if (!isWordPress) {
        return { isWordPress: false };
      }

      // Extract WordPress version
      const version = this.extractWordPressVersion($, response.data);
      
      // Extract theme info
      const theme = this.extractThemeInfo($);
      
      // Check for REST API
      const restApiUrl = this.extractRestApiUrl($, url);
      const hasRestApi = await this.checkRestApiAvailability(restApiUrl);
      
      return {
        isWordPress: true,
        version,
        theme,
        plugins: 0, // Would need admin access to count plugins
        restApiUrl,
        hasRestApi,
        requiresAuth: false
      };
    } catch (error) {
      throw new Error(`Failed to analyze website: ${error.message}`);
    }
  }

  private checkWordPressIndicators($: cheerio.CheerioAPI, html: string): boolean {
    // Check for WordPress generator meta tag
    if ($('meta[name="generator"]').attr('content')?.includes('WordPress')) {
      return true;
    }

    // Check for wp-content in URLs
    if (html.includes('wp-content') || html.includes('wp-includes')) {
      return true;
    }

    // Check for WordPress-specific scripts and styles
    const wpScripts = $('script[src*="wp-content"], script[src*="wp-includes"]');
    const wpStyles = $('link[href*="wp-content"], link[href*="wp-includes"]');
    
    if (wpScripts.length > 0 || wpStyles.length > 0) {
      return true;
    }

    // Check for WordPress body classes
    const bodyClass = $('body').attr('class');
    if (bodyClass && (bodyClass.includes('wp-') || bodyClass.includes('wordpress'))) {
      return true;
    }

    return false;
  }

  private extractWordPressVersion($: cheerio.CheerioAPI, html: string): string | undefined {
    // Try to get version from generator meta tag
    const generator = $('meta[name="generator"]').attr('content');
    if (generator?.includes('WordPress')) {
      const versionMatch = generator.match(/WordPress\s+(\d+\.\d+(?:\.\d+)?)/);
      if (versionMatch) {
        return versionMatch[1];
      }
    }

    // Try to extract from script/style version parameters
    const versionRegex = /ver=(\d+\.\d+(?:\.\d+)?)/g;
    const matches = html.match(versionRegex);
    if (matches && matches.length > 0) {
      const versions = matches.map(match => match.replace('ver=', ''));
      // Return the most common version
      return this.getMostCommonVersion(versions);
    }

    return undefined;
  }

  private extractThemeInfo($: cheerio.CheerioAPI): string | undefined {
    // Try to extract theme from stylesheet URL
    const themeStylesheet = $('link[rel="stylesheet"]').filter((_, el) => {
      const href = $(el).attr('href');
      return href && href.includes('wp-content/themes/');
    });

    if (themeStylesheet.length > 0) {
      const href = themeStylesheet.first().attr('href');
      if (href) {
        const themeMatch = href.match(/wp-content\/themes\/([^\/]+)/);
        if (themeMatch) {
          return themeMatch[1];
        }
      }
    }

    return undefined;
  }

  private extractRestApiUrl($: cheerio.CheerioAPI, baseUrl: string): string {
    // Look for REST API URL in page source
    const restApiLink = $('link[rel="https://api.w.org/"]').attr('href');
    if (restApiLink) {
      return restApiLink;
    }

    // Fallback to standard WordPress REST API URL
    const url = new URL(baseUrl);
    return `${url.protocol}//${url.host}/wp-json/wp/v2`;
  }

  private async checkRestApiAvailability(apiUrl: string): Promise<boolean> {
    try {
      const response = await axios.get(apiUrl, {
        timeout: 5000,
        headers: {
          'User-Agent': 'WordPress Backup Tool'
        }
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  private getMostCommonVersion(versions: string[]): string {
    const versionCounts: { [key: string]: number } = {};
    
    versions.forEach(version => {
      versionCounts[version] = (versionCounts[version] || 0) + 1;
    });

    return Object.keys(versionCounts).reduce((a, b) => 
      versionCounts[a] > versionCounts[b] ? a : b
    );
  }

  async getWordPressContent(apiUrl: string, credentials?: { username: string; password: string }) {
    try {
      const headers: any = {
        'User-Agent': 'WordPress Backup Tool',
        'Content-Type': 'application/json'
      };

      if (credentials) {
        const auth = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      }

      // Get posts
      const postsResponse = await axios.get(`${apiUrl}/posts`, {
        headers,
        params: { per_page: 100 }
      });

      // Get pages
      const pagesResponse = await axios.get(`${apiUrl}/pages`, {
        headers,
        params: { per_page: 100 }
      });

      // Get media
      const mediaResponse = await axios.get(`${apiUrl}/media`, {
        headers,
        params: { per_page: 100 }
      });

      return {
        posts: postsResponse.data,
        pages: pagesResponse.data,
        media: mediaResponse.data
      };
    } catch (error) {
      throw new Error(`Failed to fetch WordPress content: ${error.message}`);
    }
  }
}

export const wordpressService = new WordPressService();
