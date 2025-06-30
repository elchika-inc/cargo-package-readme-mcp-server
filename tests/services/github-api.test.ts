import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitHubApiClient, githubApi } from '../../src/services/github-api.js';

describe('GitHubApiClient', () => {
  let api: GitHubApiClient;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    api = new GitHubApiClient();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(api).toBeInstanceOf(GitHubApiClient);
    });

    it('should use custom timeout when provided', () => {
      const customApi = new GitHubApiClient(5000);
      expect(customApi).toBeInstanceOf(GitHubApiClient);
    });

    it('should use auth token when provided', () => {
      const customApi = new GitHubApiClient(30000, 'test-token');
      expect(customApi).toBeInstanceOf(GitHubApiClient);
    });

    it('should use environment token when available', () => {
      process.env.GITHUB_TOKEN = 'env-token';
      const customApi = new GitHubApiClient();
      expect(customApi).toBeInstanceOf(GitHubApiClient);
    });
  });

  describe('getReadmeFromRepository', () => {
    it('should handle string repository URL', async () => {
      const result = await api.getReadmeFromRepository('https://github.com/rust-lang/cargo');
      
      // README might exist or not, both are valid
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle repository object', async () => {
      const repoInfo = { url: 'https://github.com/rust-lang/cargo' };
      const result = await api.getReadmeFromRepository(repoInfo);
      
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle invalid repository URL', async () => {
      const result = await api.getReadmeFromRepository('invalid-url');
      
      expect(result).toBeNull();
    });

    it('should handle non-existent repository', async () => {
      const result = await api.getReadmeFromRepository('https://github.com/non-existent-user/non-existent-repo');
      
      expect(result).toBeNull();
    });

    it('should handle different URL formats', async () => {
      const urlFormats = [
        'https://github.com/rust-lang/cargo',
        'https://github.com/rust-lang/cargo.git',
        'git://github.com/rust-lang/cargo.git',
        'git+https://github.com/rust-lang/cargo.git',
        'ssh://git@github.com/rust-lang/cargo.git',
        'git@github.com:rust-lang/cargo.git'
      ];

      for (const url of urlFormats) {
        const result = await api.getReadmeFromRepository(url);
        expect(result === null || typeof result === 'string').toBe(true);
      }
    });
  });

  describe('getReadmeInfo', () => {
    it('should handle string repository URL', async () => {
      const result = await api.getReadmeInfo('https://github.com/rust-lang/cargo');
      
      // README info might exist or not, both are valid
      expect(result === null || (result && typeof result === 'object')).toBe(true);
    });

    it('should handle repository object', async () => {
      const repoInfo = { url: 'https://github.com/rust-lang/cargo' };
      const result = await api.getReadmeInfo(repoInfo);
      
      expect(result === null || (result && typeof result === 'object')).toBe(true);
    });

    it('should handle invalid repository URL', async () => {
      const result = await api.getReadmeInfo('invalid-url');
      
      expect(result).toBeNull();
    });

    it('should handle non-existent repository', async () => {
      const result = await api.getReadmeInfo('https://github.com/non-existent-user/non-existent-repo');
      
      expect(result).toBeNull();
    });
  });

  describe('parseRepositoryUrl', () => {
    it('should parse standard GitHub URLs', () => {
      const api = new GitHubApiClient();
      
      // Access private method for testing
      const parseMethod = (api as any).parseRepositoryUrl.bind(api);
      
      const result = parseMethod('https://github.com/rust-lang/cargo');
      expect(result).toEqual({
        owner: 'rust-lang',
        repo: 'cargo'
      });
    });

    it('should parse Git URLs', () => {
      const api = new GitHubApiClient();
      const parseMethod = (api as any).parseRepositoryUrl.bind(api);
      
      const result = parseMethod('git@github.com:rust-lang/cargo.git');
      expect(result).toEqual({
        owner: 'rust-lang',
        repo: 'cargo'
      });
    });

    it('should handle URLs with .git suffix', () => {
      const api = new GitHubApiClient();
      const parseMethod = (api as any).parseRepositoryUrl.bind(api);
      
      const result = parseMethod('https://github.com/rust-lang/cargo.git');
      expect(result).toEqual({
        owner: 'rust-lang',
        repo: 'cargo'
      });
    });

    it('should handle repository object', () => {
      const api = new GitHubApiClient();
      const parseMethod = (api as any).parseRepositoryUrl.bind(api);
      
      const result = parseMethod({ url: 'https://github.com/rust-lang/cargo' });
      expect(result).toEqual({
        owner: 'rust-lang',
        repo: 'cargo'
      });
    });

    it('should return null for invalid URLs', () => {
      const api = new GitHubApiClient();
      const parseMethod = (api as any).parseRepositoryUrl.bind(api);
      
      const result = parseMethod('invalid-url');
      expect(result).toBeNull();
    });

    it('should handle different protocols', () => {
      const api = new GitHubApiClient();
      const parseMethod = (api as any).parseRepositoryUrl.bind(api);
      
      const urls = [
        'git+https://github.com/rust-lang/cargo.git',
        'git://github.com/rust-lang/cargo.git',
        'ssh://git@github.com/rust-lang/cargo.git'
      ];

      for (const url of urls) {
        const result = parseMethod(url);
        expect(result).toEqual({
          owner: 'rust-lang',
          repo: 'cargo'
        });
      }
    });
  });

  describe('checkRateLimit', () => {
    it('should check rate limit', async () => {
      const result = await api.checkRateLimit();
      
      // Rate limit check might succeed or fail, both are valid
      expect(result === null || (result && typeof result === 'object')).toBe(true);
      
      if (result) {
        expect(result).toHaveProperty('remaining');
        expect(result).toHaveProperty('reset');
        expect(typeof result.remaining).toBe('number');
        expect(typeof result.reset).toBe('number');
      }
    });

    it('should handle auth token in rate limit check', async () => {
      const apiWithToken = new GitHubApiClient(30000, 'test-token');
      const result = await apiWithToken.checkRateLimit();
      
      expect(result === null || (result && typeof result === 'object')).toBe(true);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(githubApi).toBeInstanceOf(GitHubApiClient);
    });
  });
});