import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { cratesIoApi } from '../services/crates-io-api.js';
import type {
  SearchPackagesParams,
  SearchPackagesResponse,
  PackageSearchResult,
} from '../types/index.js';

export async function searchPackages(params: SearchPackagesParams): Promise<SearchPackagesResponse> {
  const { 
    query, 
    limit = 20,
    quality,
    popularity
  } = params;

  logger.info(`Searching crates: ${query} (limit: ${limit})`);

  // Validate inputs
  validateSearchQuery(query);
  validateLimit(limit);
  
  if (quality !== undefined && (quality < 0 || quality > 1)) {
    throw new Error('Quality score must be between 0 and 1');
  }
  
  if (popularity !== undefined && (popularity < 0 || popularity > 1)) {
    throw new Error('Popularity score must be between 0 and 1');
  }

  // Check cache first
  const cacheKey = createCacheKey.searchResults(query, limit, JSON.stringify({ quality, popularity }), 'relevance');
  const cached = cache.get<SearchPackagesResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for crate search: ${query}`);
    return cached;
  }

  try {
    // Search crates using crates.io API
    const searchResponse = await cratesIoApi.searchCrates(query, limit, undefined, 'relevance');

    // Transform search results to our format
    const packages: PackageSearchResult[] = searchResponse.crates
      .map(crate => {
        // Calculate quality and popularity scores (simplified)
        const qualityScore = Math.min(1, (crate.recent_downloads || 0) / 10000); // Normalize to 0-1
        const popularityScore = Math.min(1, (crate.downloads || 0) / 100000); // Normalize to 0-1
        const maintenanceScore = 0.8; // Default maintenance score
        const finalScore = (qualityScore + popularityScore + maintenanceScore) / 3;
        
        return {
          name: crate.name,
          version: crate.max_stable_version || crate.max_version,
          description: crate.description || 'No description available',
          keywords: crate.keywords,
          author: 'Unknown', // Authors not available in search results
          publisher: 'crates.io',
          maintainers: [], // Not available in search results
          score: {
            final: finalScore,
            detail: {
              quality: qualityScore,
              popularity: popularityScore,
              maintenance: maintenanceScore,
            },
          },
          searchScore: crate.exact_match ? 1.0 : 0.8,
        };
      })
      .filter(pkg => {
        // Filter by quality and popularity if specified
        if (quality !== undefined && pkg.score.detail.quality < quality) {
          return false;
        }
        if (popularity !== undefined && pkg.score.detail.popularity < popularity) {
          return false;
        }
        return true;
      });

    const response: SearchPackagesResponse = {
      query,
      total: packages.length, // Use filtered count
      packages,
    };

    // Cache the response (shorter TTL for search results)
    cache.set(cacheKey, response, 10 * 60 * 1000); // 10 minutes

    logger.info(`Successfully searched crates: ${query}, found ${response.total} results`);
    return response;

  } catch (error) {
    logger.error(`Failed to search crates: ${query}`, { error });
    throw error;
  }
}