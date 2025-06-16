import { logger } from '../utils/logger.js';
import { handleApiError, handleHttpError, withRetry } from '../utils/error-handler.js';
import type { GitHubReadmeResponse, RepositoryInfo } from '../types/index.js';

export class GitHubApiClient {
  private readonly baseUrl = 'https://api.github.com';
  private readonly timeout: number;
  private readonly authToken?: string | undefined;

  constructor(timeout?: number, authToken?: string) {
    this.timeout = timeout || 30000;
    this.authToken = authToken || process.env.GITHUB_TOKEN || undefined;
  }

  async getReadmeFromRepository(repository: RepositoryInfo | string): Promise<string | null> {
    try {
      const repoInfo = this.parseRepositoryUrl(repository);
      if (!repoInfo) {
        logger.warn('Invalid repository URL format');
        return null;
      }

      const { owner, repo } = repoInfo;
      const url = `${this.baseUrl}/repos/${owner}/${repo}/readme`;

      return withRetry(async () => {
        logger.debug(`Fetching README from GitHub: ${owner}/${repo}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
          const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3.raw',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          };

          if (this.authToken) {
            headers['Authorization'] = `token ${this.authToken}`;
          }

          const response = await fetch(url, {
            signal: controller.signal,
            headers,
          });

          if (!response.ok) {
            if (response.status === 404) {
              logger.debug(`README not found on GitHub: ${owner}/${repo}`);
              return null;
            }
            handleHttpError(response.status, response, `GitHub API for ${owner}/${repo}`);
          }

          const content = await response.text();
          logger.debug(`Successfully fetched README from GitHub: ${owner}/${repo}`);
          return content;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            handleApiError(new Error('Request timeout'), `GitHub API for ${owner}/${repo}`);
          }
          handleApiError(error, `GitHub API for ${owner}/${repo}`);
        } finally {
          clearTimeout(timeoutId);
        }
      }, 3, 1000, `GitHub API getReadme(${owner}/${repo})`);
    } catch (error) {
      logger.warn('Failed to fetch README from GitHub', { error, repository });
      return null;
    }
  }

  async getReadmeInfo(repository: RepositoryInfo | string): Promise<GitHubReadmeResponse | null> {
    try {
      const repoInfo = this.parseRepositoryUrl(repository);
      if (!repoInfo) {
        logger.warn('Invalid repository URL format');
        return null;
      }

      const { owner, repo } = repoInfo;
      const url = `${this.baseUrl}/repos/${owner}/${repo}/readme`;

      return withRetry(async () => {
        logger.debug(`Fetching README info from GitHub: ${owner}/${repo}`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        
        try {
          const headers: Record<string, string> = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'cargo-package-readme-mcp/1.0.0',
          };

          if (this.authToken) {
            headers['Authorization'] = `token ${this.authToken}`;
          }

          const response = await fetch(url, {
            signal: controller.signal,
            headers,
          });

          if (!response.ok) {
            if (response.status === 404) {
              logger.debug(`README not found on GitHub: ${owner}/${repo}`);
              return null;
            }
            handleHttpError(response.status, response, `GitHub API for ${owner}/${repo}`);
          }

          const data = await response.json() as GitHubReadmeResponse;
          logger.debug(`Successfully fetched README info from GitHub: ${owner}/${repo}`);
          return data;
        } catch (error) {
          if ((error as Error).name === 'AbortError') {
            handleApiError(new Error('Request timeout'), `GitHub API for ${owner}/${repo}`);
          }
          handleApiError(error, `GitHub API for ${owner}/${repo}`);
        } finally {
          clearTimeout(timeoutId);
        }
      }, 3, 1000, `GitHub API getReadmeInfo(${owner}/${repo})`);
    } catch (error) {
      logger.warn('Failed to fetch README info from GitHub', { error, repository });
      return null;
    }
  }

  private parseRepositoryUrl(repository: RepositoryInfo | string): { owner: string; repo: string } | null {
    try {
      let url: string;
      
      if (typeof repository === 'string') {
        url = repository;
      } else {
        url = repository.url;
      }

      // Handle different URL formats
      // https://github.com/owner/repo
      // https://github.com/owner/repo.git
      // git://github.com/owner/repo.git
      // git+https://github.com/owner/repo.git
      // ssh://git@github.com/owner/repo.git
      // git@github.com:owner/repo.git

      // Clean up URL
      url = url.replace(/^git\+/, ''); // Remove git+ prefix
      url = url.replace(/\.git$/, ''); // Remove .git suffix
      url = url.replace(/^git@github\.com:/, 'https://github.com/'); // Convert SSH to HTTPS
      url = url.replace(/^git:\/\//, 'https://'); // Convert git:// to https://
      url = url.replace(/^ssh:\/\/git@/, 'https://'); // Convert ssh://git@ to https://

      // Extract owner and repo from URL
      const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (match) {
        const [, owner, repo] = match;
        return { owner: owner || '', repo: repo || '' };
      }

      return null;
    } catch (error) {
      logger.warn('Failed to parse repository URL', { error, repository });
      return null;
    }
  }

  async checkRateLimit(): Promise<{ remaining: number; reset: number } | null> {
    try {
      const url = `${this.baseUrl}/rate_limit`;
      
      const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'cargo-package-readme-mcp/1.0.0',
      };

      if (this.authToken) {
        headers['Authorization'] = `token ${this.authToken}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json() as any;
      return {
        remaining: data.rate.remaining,
        reset: data.rate.reset,
      };
    } catch (error) {
      logger.warn('Failed to check GitHub rate limit', { error });
      return null;
    }
  }
}

export const githubApi = new GitHubApiClient();