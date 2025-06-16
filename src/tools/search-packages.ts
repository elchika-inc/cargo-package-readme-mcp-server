import { logger } from '../utils/logger.js';
import { validateSearchQuery, validateLimit, validateCategory, validateSortOrder } from '../utils/validators.js';
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
    category,
    sort = 'relevance'
  } = params;

  logger.info(`Searching crates: ${query} (limit: ${limit})`);

  // Validate inputs
  validateSearchQuery(query);
  validateLimit(limit);
  
  if (category) {
    validateCategory(category);
  }
  
  validateSortOrder(sort);

  // Check cache first
  const cacheKey = createCacheKey.searchResults(query, limit, category, sort);
  const cached = cache.get<SearchPackagesResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for crate search: ${query}`);
    return cached;
  }

  try {
    // Search crates using crates.io API
    const searchResponse = await cratesIoApi.searchCrates(query, limit, category, sort);

    // Transform search results to our format
    const packages: PackageSearchResult[] = searchResponse.crates.map(crate => ({
      name: crate.name,
      version: crate.max_stable_version || crate.max_version,
      description: crate.description || 'No description available',
      keywords: crate.keywords,
      categories: crate.categories,
      authors: [], // Authors not available in search results
      downloads: crate.downloads,
      recent_downloads: crate.recent_downloads,
      exact_match: crate.exact_match,
    }));

    const response: SearchPackagesResponse = {
      query,
      total: searchResponse.meta.total,
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