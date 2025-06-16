import { logger } from '../utils/logger.js';
import { validatePackageName } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { cratesIoApi } from '../services/crates-io-api.js';
import type {
  GetPackageInfoParams,
  PackageInfoResponse,
  RepositoryInfo,
} from '../types/index.js';

export async function getPackageInfo(params: GetPackageInfoParams): Promise<PackageInfoResponse> {
  const { 
    package_name, 
    include_dependencies = true, 
    include_dev_dependencies = false 
  } = params;

  logger.info(`Fetching crate info: ${package_name}`);

  // Validate inputs
  validatePackageName(package_name);

  // Check cache first
  const cacheKey = createCacheKey.packageInfo(package_name, 'latest');
  const cached = cache.get<PackageInfoResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for crate info: ${package_name}`);
    return cached;
  }

  try {
    // First, check if crate exists using direct API call
    logger.debug(`Checking crate existence: ${package_name}`);
    const crateExists = await cratesIoApi.crateExists(package_name);
    
    if (!crateExists) {
      logger.warn(`Crate not found: ${package_name}`);
      return {
        package_name,
        latest_version: 'unknown',
        description: 'Package not found',
        author: 'Unknown',
        license: 'Unknown',
        keywords: [],
        download_stats: { last_day: 0, last_week: 0, last_month: 0 },
        exists: false,
      };
    }
    
    logger.debug(`Crate exists: ${package_name}`);
    
    // Get crate info from crates.io
    const crateInfo = await cratesIoApi.getCrateInfo(package_name);
    
    // Get latest version details
    const latestVersion = crateInfo.crate.max_stable_version || crateInfo.crate.max_version;
    const versionInfo = await cratesIoApi.getVersionInfo(package_name, latestVersion);

    // Get download stats
    const downloadStats = await cratesIoApi.getProcessedDownloadStats(package_name);

    // Process dependencies
    let dependencies: Record<string, string> | undefined;
    let devDependencies: Record<string, string> | undefined;

    if (include_dependencies || include_dev_dependencies) {
      const deps: Record<string, string> = {};
      const devDeps: Record<string, string> = {};

      for (const dep of versionInfo.dependencies) {
        const depEntry = `${dep.req}`;
        
        if (dep.kind === 'normal' && include_dependencies) {
          deps[dep.crate_id] = depEntry;
        } else if (dep.kind === 'dev' && include_dev_dependencies) {
          devDeps[dep.crate_id] = depEntry;
        }
      }

      if (include_dependencies && Object.keys(deps).length > 0) {
        dependencies = deps;
      }
      
      if (include_dev_dependencies && Object.keys(devDeps).length > 0) {
        devDependencies = devDeps;
      }
    }

    // Create repository info
    let repository: RepositoryInfo | undefined;
    if (crateInfo.crate.repository) {
      repository = {
        type: 'git', // Most crates use git
        url: crateInfo.crate.repository,
        directory: undefined,
      };
    }

    // Create response
    const response: PackageInfoResponse = {
      package_name,
      latest_version: latestVersion,
      description: crateInfo.crate.description || 'No description available',
      author: versionInfo.authors?.[0]?.name || 'Unknown',
      license: versionInfo.license || 'Unknown',
      keywords: crateInfo.keywords.map(kw => kw.keyword),
      dependencies,
      dev_dependencies: devDependencies,
      download_stats: downloadStats,
      repository,
      exists: true,
    };

    // Cache the response
    cache.set(cacheKey, response);

    logger.info(`Successfully fetched crate info: ${package_name}@${latestVersion}`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch crate info: ${package_name}`, { error });
    throw error;
  }
}