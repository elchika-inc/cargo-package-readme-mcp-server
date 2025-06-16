import { logger } from '../utils/logger.js';
import { validatePackageName, validateVersion } from '../utils/validators.js';
import { cache, createCacheKey } from '../services/cache.js';
import { cratesIoApi } from '../services/crates-io-api.js';
import { githubApi } from '../services/github-api.js';
import { readmeParser } from '../services/readme-parser.js';
import { searchPackages } from './search-packages.js';
import type {
  GetPackageReadmeParams,
  PackageReadmeResponse,
  InstallationInfo,
  PackageBasicInfo,
  RepositoryInfo,
} from '../types/index.js';

export async function getPackageReadme(params: GetPackageReadmeParams): Promise<PackageReadmeResponse> {
  const { package_name, version = 'latest', include_examples = true } = params;

  logger.info(`Fetching crate README: ${package_name}@${version}`);

  // Validate inputs
  validatePackageName(package_name);
  if (version !== 'latest') {
    validateVersion(version);
  }

  // Check cache first
  const cacheKey = createCacheKey.packageReadme(package_name, version);
  const cached = cache.get<PackageReadmeResponse>(cacheKey);
  if (cached) {
    logger.debug(`Cache hit for crate README: ${package_name}@${version}`);
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
        version: version,
        description: 'Package not found',
        readme_content: '',
        usage_examples: [],
        installation: { cargo: `install ${package_name}` },
        basic_info: {
          name: package_name,
          version: version,
          description: 'Package not found',
          license: 'Unknown',
          authors: [],
          keywords: [],
          categories: [],
        },
        exists: false,
      };
    }
    
    logger.debug(`Crate exists: ${package_name}`);

    // Get crate info from crates.io
    const crateInfo = await cratesIoApi.getCrateInfo(package_name);
    const versionInfo = await cratesIoApi.getVersionInfo(package_name, version);

    // Get actual version string (in case we requested 'latest')
    const actualVersion = versionInfo.num;

    // Try to get README content
    let readmeContent = '';
    let readmeSource = 'none';

    // First, try to get README from crates.io
    const cratesIoReadme = await cratesIoApi.getReadmeContent(package_name, version);
    if (cratesIoReadme) {
      readmeContent = cratesIoReadme;
      readmeSource = 'crates.io';
      logger.debug(`Got README from crates.io: ${package_name}`);
    }
    // If no README from crates.io, try GitHub as fallback
    else if (crateInfo.crate.repository) {
      const githubReadme = await githubApi.getReadmeFromRepository(crateInfo.crate.repository);
      if (githubReadme) {
        readmeContent = githubReadme;
        readmeSource = 'github';
        logger.debug(`Got README from GitHub: ${package_name}`);
      }
    }

    // Clean and process README content
    const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
    
    // Extract usage examples
    const usageExamples = readmeParser.parseUsageExamples(readmeContent, include_examples);

    // Create installation info
    const installation: InstallationInfo = {
      cargo: `install ${package_name}`,
      toml: `[dependencies]\n${package_name} = "${actualVersion}"`,
    };

    // Create basic info
    const basicInfo: PackageBasicInfo = {
      name: crateInfo.crate.name,
      version: actualVersion,
      description: crateInfo.crate.description || 'No description available',
      homepage: crateInfo.crate.homepage || undefined,
      documentation: crateInfo.crate.documentation || undefined,
      repository: crateInfo.crate.repository || undefined,
      license: versionInfo.license || 'Unknown',
      authors: versionInfo.authors?.map(author => author.name) || [],
      keywords: crateInfo.keywords.map(kw => kw.keyword),
      categories: crateInfo.categories.map(cat => cat.category),
    };

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
    const response: PackageReadmeResponse = {
      package_name,
      version: actualVersion,
      description: basicInfo.description,
      readme_content: cleanedReadme,
      usage_examples: usageExamples,
      installation,
      basic_info: basicInfo,
      repository: repository || undefined,
      exists: true,
    };

    // Cache the response
    cache.set(cacheKey, response);

    logger.info(`Successfully fetched crate README: ${package_name}@${actualVersion} (README source: ${readmeSource})`);
    return response;

  } catch (error) {
    logger.error(`Failed to fetch crate README: ${package_name}@${version}`, { error });
    throw error;
  }
}