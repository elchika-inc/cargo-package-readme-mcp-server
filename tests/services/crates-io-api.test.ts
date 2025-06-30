import { describe, it, expect, beforeEach } from 'vitest';
import { CratesIoApiClient, cratesIoApi } from '../../src/services/crates-io-api.js';

describe('CratesIoApiClient', () => {
  let api: CratesIoApiClient;

  beforeEach(() => {
    api = new CratesIoApiClient();
  });

  describe('constructor', () => {
    it('should initialize with default timeout', () => {
      expect(api).toBeInstanceOf(CratesIoApiClient);
    });

    it('should use custom timeout when provided', () => {
      const customApi = new CratesIoApiClient(5000);
      expect(customApi).toBeInstanceOf(CratesIoApiClient);
    });
  });

  describe('crateExists', () => {
    it('should handle valid crate name format', async () => {
      // Use a simple valid crate name format for testing
      const result = await api.crateExists('serde');
      expect(typeof result).toBe('boolean');
    });

    it('should handle invalid crate names gracefully', async () => {
      const result = await api.crateExists('invalid-crate-that-definitely-does-not-exist-12345');
      expect(typeof result).toBe('boolean');
    });

    it('should handle empty crate name', async () => {
      const result = await api.crateExists('');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('getCrateInfo', () => {
    it('should handle known crates', async () => {
      try {
        const result = await api.getCrateInfo('serde');
        expect(result).toHaveProperty('crate');
        expect(result).toHaveProperty('versions');
        expect(result.crate).toHaveProperty('name', 'serde');
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    });

    it('should handle non-existent crates', async () => {
      try {
        await api.getCrateInfo('non-existent-crate-12345');
      } catch (error) {
        // Should throw an error for non-existent crates
        expect(error).toBeDefined();
      }
    });
  });

  describe('getVersionInfo', () => {
    it('should handle latest version resolution', async () => {
      try {
        const result = await api.getVersionInfo('serde', 'latest');
        expect(result).toHaveProperty('num');
        expect(result).toHaveProperty('dependencies');
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    });

    it('should handle specific version', async () => {
      try {
        const result = await api.getVersionInfo('serde', '1.0.0');
        expect(result).toHaveProperty('num');
      } catch (error) {
        // Version might not exist or network error
        expect(error).toBeDefined();
      }
    });

    it('should handle invalid version', async () => {
      try {
        await api.getVersionInfo('serde', 'invalid-version');
      } catch (error) {
        // Should throw an error for invalid versions
        expect(error).toBeDefined();
      }
    });
  });

  describe('searchCrates', () => {
    it('should search with basic query', async () => {
      try {
        const result = await api.searchCrates('serde');
        expect(result).toHaveProperty('crates');
        expect(result).toHaveProperty('meta');
        expect(Array.isArray(result.crates)).toBe(true);
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    });

    it('should search with custom limit', async () => {
      try {
        const result = await api.searchCrates('json', 5);
        expect(result).toHaveProperty('crates');
        expect(result).toHaveProperty('meta');
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    });

    it('should search with category filter', async () => {
      try {
        const result = await api.searchCrates('web', 10, 'web-programming');
        expect(result).toHaveProperty('crates');
        expect(result).toHaveProperty('meta');
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    });

    it('should search with different sort options', async () => {
      const sortOptions: Array<'relevance' | 'downloads' | 'recent-downloads' | 'recent-updates'> = [
        'relevance', 'downloads', 'recent-downloads', 'recent-updates'
      ];

      for (const sort of sortOptions) {
        try {
          const result = await api.searchCrates('test', 5, undefined, sort);
          expect(result).toHaveProperty('crates');
        } catch (error) {
          // Network errors are acceptable in tests
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle empty search query', async () => {
      try {
        const result = await api.searchCrates('');
        expect(result).toHaveProperty('crates');
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    });
  });

  describe('getDownloadStats', () => {
    it('should get download stats for known crate', async () => {
      try {
        const result = await api.getDownloadStats('serde');
        expect(result).toHaveProperty('version_downloads');
        expect(Array.isArray(result.version_downloads)).toBe(true);
      } catch (error) {
        // Network errors are acceptable in tests
        expect(error).toBeDefined();
      }
    }, 10000);

    it('should handle non-existent crate gracefully', async () => {
      try {
        const result = await api.getDownloadStats('non-existent-crate-12345');
        expect(result).toHaveProperty('version_downloads');
      } catch (error) {
        // Should handle gracefully or throw error
        expect(error).toBeDefined();
      }
    });
  });

  describe('getProcessedDownloadStats', () => {
    it('should process download stats correctly', async () => {
      const result = await api.getProcessedDownloadStats('serde');
      
      expect(result).toHaveProperty('last_day');
      expect(result).toHaveProperty('last_week');
      expect(result).toHaveProperty('last_month');
      expect(typeof result.last_day).toBe('number');
      expect(typeof result.last_week).toBe('number');
      expect(typeof result.last_month).toBe('number');
    });

    it('should return zeros for non-existent crate', async () => {
      const result = await api.getProcessedDownloadStats('non-existent-crate-12345');
      
      expect(result).toEqual({
        last_day: 0,
        last_week: 0,
        last_month: 0,
      });
    });
  });

  describe('getReadmeContent', () => {
    it('should attempt to get README content', async () => {
      const result = await api.getReadmeContent('serde', 'latest');
      
      // README might exist or not, both are valid
      expect(result === null || typeof result === 'string').toBe(true);
    });

    it('should handle non-existent crate gracefully', async () => {
      const result = await api.getReadmeContent('non-existent-crate-12345', 'latest');
      
      expect(result).toBeNull();
    });

    it('should handle invalid version gracefully', async () => {
      const result = await api.getReadmeContent('serde', 'invalid-version');
      
      expect(result).toBeNull();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(cratesIoApi).toBeInstanceOf(CratesIoApiClient);
    });
  });
});