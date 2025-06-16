import { logger } from '../utils/logger.js';
import { handleApiError, handleHttpError, withRetry } from '../utils/error-handler.js';
import type { 
  CratesIoCrateResponse,
  CratesIoVersionResponse,
  CratesIoVersionWithDependencies,
  CratesIoSearchResponse,
  CratesIoDownloadStats,
} from '../types/index.js';
import {
  VersionNotFoundError,
} from '../types/index.js';

export class CratesIoApiClient {
  private readonly baseUrl = 'https://crates.io/api/v1';
  private readonly timeout: number;

  constructor(timeout?: number) {
    this.timeout = timeout || 30000;
  }

  async getCrateInfo(crateName: string): Promise<CratesIoCrateResponse> {
    const url = `${this.baseUrl}/crates/${encodeURIComponent(crateName)}`;
    
    return withRetry(async () => {
      logger.debug(`Fetching crate info: ${crateName}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          },
        });

        if (!response.ok) {
          handleHttpError(response.status, response, `crates.io for crate ${crateName}`);
        }

        const data = await response.json() as CratesIoCrateResponse;
        logger.debug(`Successfully fetched crate info: ${crateName}`);
        return data;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `crates.io for crate ${crateName}`);
        }
        handleApiError(error, `crates.io for crate ${crateName}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, 3, 1000, `crates.io getCrateInfo(${crateName})`);
  }

  async getVersionInfo(crateName: string, version: string): Promise<CratesIoVersionWithDependencies> {
    // First get crate info to resolve version
    const crateInfo = await this.getCrateInfo(crateName);
    
    // Resolve version alias
    let actualVersion = version;
    if (version === 'latest') {
      actualVersion = crateInfo.crate.max_stable_version || crateInfo.crate.max_version;
    }

    // Find the version in the versions array
    const versionInfo = crateInfo.versions.find(v => v.num === actualVersion);
    if (!versionInfo) {
      throw new VersionNotFoundError(crateName, version);
    }

    // Get detailed version info with dependencies
    const url = `${this.baseUrl}/crates/${encodeURIComponent(crateName)}/${encodeURIComponent(actualVersion)}`;
    
    return withRetry(async () => {
      logger.debug(`Fetching version info: ${crateName}@${actualVersion}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          },
        });

        if (!response.ok) {
          handleHttpError(response.status, response, `crates.io for crate ${crateName}@${actualVersion}`);
        }

        const data = await response.json() as CratesIoVersionResponse;
        logger.debug(`Successfully fetched version info: ${crateName}@${actualVersion}`);
        return data.version;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `crates.io for crate ${crateName}@${actualVersion}`);
        }
        handleApiError(error, `crates.io for crate ${crateName}@${actualVersion}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, 3, 1000, `crates.io getVersionInfo(${crateName}@${actualVersion})`);
  }

  async searchCrates(
    query: string,
    limit: number = 20,
    category?: string,
    sort: 'relevance' | 'downloads' | 'recent-downloads' | 'recent-updates' = 'relevance'
  ): Promise<CratesIoSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      per_page: limit.toString(),
      sort: sort,
    });

    if (category) {
      params.append('category', category);
    }

    const url = `${this.baseUrl}/crates?${params.toString()}`;

    return withRetry(async () => {
      logger.debug(`Searching crates: ${query} (limit: ${limit})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          },
        });

        if (!response.ok) {
          handleHttpError(response.status, response, `crates.io search for query ${query}`);
        }

        const data = await response.json() as CratesIoSearchResponse;
        logger.debug(`Successfully searched crates: ${query}, found ${data.meta.total} results`);
        return data;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `crates.io search for query ${query}`);
        }
        handleApiError(error, `crates.io search for query ${query}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, 3, 1000, `crates.io searchCrates(${query})`);
  }

  async getDownloadStats(crateName: string): Promise<CratesIoDownloadStats> {
    const url = `${this.baseUrl}/crates/${encodeURIComponent(crateName)}/downloads`;
    
    return withRetry(async () => {
      logger.debug(`Fetching download stats: ${crateName}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            // Crate might not have download stats, return empty
            return {
              version_downloads: [],
            };
          }
          handleHttpError(response.status, response, `crates.io downloads for crate ${crateName}`);
        }

        const data = await response.json() as CratesIoDownloadStats;
        logger.debug(`Successfully fetched download stats: ${crateName}`);
        return data;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          handleApiError(new Error('Request timeout'), `crates.io downloads for crate ${crateName}`);
        }
        handleApiError(error, `crates.io downloads for crate ${crateName}`);
      } finally {
        clearTimeout(timeoutId);
      }
    }, 3, 1000, `crates.io getDownloadStats(${crateName})`);
  }

  async getProcessedDownloadStats(crateName: string): Promise<{
    last_day: number;
    last_week: number;
    last_month: number;
  }> {
    try {
      const stats = await this.getDownloadStats(crateName);
      
      // Process download stats to get last day, week, month
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      let lastDay = 0;
      let lastWeek = 0;
      let lastMonth = 0;

      for (const download of stats.version_downloads) {
        const downloadDate = new Date(download.date);
        
        if (downloadDate >= oneDayAgo) {
          lastDay += download.downloads;
        }
        if (downloadDate >= oneWeekAgo) {
          lastWeek += download.downloads;
        }
        if (downloadDate >= oneMonthAgo) {
          lastMonth += download.downloads;
        }
      }

      return {
        last_day: lastDay,
        last_week: lastWeek,
        last_month: lastMonth,
      };
    } catch (error) {
      logger.warn(`Failed to fetch download stats for ${crateName}, using zeros`, { error });
      return {
        last_day: 0,
        last_week: 0,
        last_month: 0,
      };
    }
  }

  async getReadmeContent(crateName: string, version: string): Promise<string | null> {
    try {
      const versionInfo = await this.getVersionInfo(crateName, version);
      
      if (!versionInfo.readme_path) {
        return null;
      }

      // Construct README URL
      const readmeUrl = `https://crates.io${versionInfo.readme_path}`;
      
      logger.debug(`Fetching README from crates.io: ${crateName}@${version}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      try {
        const response = await fetch(readmeUrl, {
          signal: controller.signal,
          headers: {
            'Accept': 'text/plain',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          },
        });

        if (!response.ok) {
          logger.warn(`Failed to fetch README from crates.io: ${crateName}@${version}`);
          return null;
        }

        const content = await response.text();
        logger.debug(`Successfully fetched README from crates.io: ${crateName}@${version}`);
        return content;
      } catch (error) {
        logger.warn(`Error fetching README from crates.io: ${crateName}@${version}`, { error });
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      logger.warn(`Failed to get README content for ${crateName}@${version}`, { error });
      return null;
    }
  }
}

export const cratesIoApi = new CratesIoApiClient();