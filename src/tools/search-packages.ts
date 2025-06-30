import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { cratesIoApi } from '../services/crates-io-api.js';
import { ScoreCalculator } from '../utils/score-calculator.js';
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
        const score = ScoreCalculator.calculateScore(
          crate.recent_downloads || 0,
          crate.downloads || 0
        );
        
        return {
          name: crate.name,
          version: crate.max_stable_version || crate.max_version,
          description: crate.description || 'No description available',
          keywords: crate.keywords,
          author: 'Unknown', // Authors not available in search results
          publisher: 'crates.io',
          maintainers: [], // Not available in search results
          score,
          searchScore: ScoreCalculator.calculateSearchScore(crate.exact_match || false),
        };
      })
      .filter(pkg => ScoreCalculator.matchesFilters(pkg.score.detail, quality, popularity));

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