import { PackageReadmeMcpError } from '../types/index.js';

export function validatePackageName(packageName: string): void {
  if (!packageName || typeof packageName !== 'string') {
    throw new PackageReadmeMcpError(
      'Package name is required and must be a string',
      'INVALID_PACKAGE_NAME',
      400
    );
  }

  // Rust crate names can contain letters, numbers, hyphens, and underscores
  // They must start with a letter or underscore
  // They cannot be longer than 64 characters
  const crateNamePattern = /^[a-zA-Z_][a-zA-Z0-9_-]{0,63}$/;
  
  if (!crateNamePattern.test(packageName)) {
    throw new PackageReadmeMcpError(
      'Invalid crate name. Crate names must start with a letter or underscore, contain only letters, numbers, hyphens, and underscores, and be at most 64 characters long.',
      'INVALID_PACKAGE_NAME',
      400,
      { packageName, pattern: crateNamePattern.source }
    );
  }

  // Reserved names that are not allowed
  const reservedNames = [
    'rust',
    'cargo',
    'std',
    'core',
    'alloc',
    'proc_macro',
    'test',
  ];

  if (reservedNames.includes(packageName.toLowerCase())) {
    throw new PackageReadmeMcpError(
      `Package name '${packageName}' is reserved and cannot be used`,
      'INVALID_PACKAGE_NAME',
      400,
      { packageName, reservedNames }
    );
  }
}

export function validateVersion(version: string): void {
  if (!version || typeof version !== 'string') {
    throw new PackageReadmeMcpError(
      'Version must be a string',
      'INVALID_VERSION',
      400
    );
  }

  // Allow 'latest' as a special case
  if (version === 'latest') {
    return;
  }

  // Semantic versioning pattern (simplified)
  // Supports: 1.0.0, 1.0.0-alpha, 1.0.0-alpha.1, 1.0.0+build.1, etc.
  const semverPattern = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  
  if (!semverPattern.test(version)) {
    throw new PackageReadmeMcpError(
      `Invalid version format: ${version}. Expected semantic version (e.g., 1.0.0, 1.0.0-alpha, etc.) or 'latest'`,
      'INVALID_VERSION',
      400,
      { version, pattern: semverPattern.source }
    );
  }
}

export function validateSearchQuery(query: string): void {
  if (!query || typeof query !== 'string') {
    throw new PackageReadmeMcpError(
      'Search query is required and must be a string',
      'INVALID_SEARCH_QUERY',
      400
    );
  }

  if (query.trim().length === 0) {
    throw new PackageReadmeMcpError(
      'Search query cannot be empty',
      'INVALID_SEARCH_QUERY',
      400
    );
  }

  if (query.length > 100) {
    throw new PackageReadmeMcpError(
      'Search query is too long (maximum 100 characters)',
      'INVALID_SEARCH_QUERY',
      400,
      { query, maxLength: 100 }
    );
  }

  // Check for potentially malicious patterns
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new PackageReadmeMcpError(
        'Search query contains potentially unsafe content',
        'INVALID_SEARCH_QUERY',
        400,
        { query: '[REDACTED]' }
      );
    }
  }
}

export function validateLimit(limit: number): void {
  if (typeof limit !== 'number') {
    throw new PackageReadmeMcpError(
      'Limit must be a number',
      'INVALID_LIMIT',
      400
    );
  }

  if (!Number.isInteger(limit) || limit < 1) {
    throw new PackageReadmeMcpError(
      'Limit must be a positive integer',
      'INVALID_LIMIT',
      400,
      { limit }
    );
  }

  if (limit > 100) {
    throw new PackageReadmeMcpError(
      'Limit cannot exceed 100',
      'INVALID_LIMIT',
      400,
      { limit, maxLimit: 100 }
    );
  }
}

export function validateCategory(category: string): void {
  if (typeof category !== 'string') {
    throw new PackageReadmeMcpError(
      'Category must be a string',
      'INVALID_CATEGORY',
      400
    );
  }

  if (category.trim().length === 0) {
    throw new PackageReadmeMcpError(
      'Category cannot be empty',
      'INVALID_CATEGORY',
      400
    );
  }

  // Categories should be URL-safe
  const categoryPattern = /^[a-zA-Z0-9_-]+$/;
  if (!categoryPattern.test(category)) {
    throw new PackageReadmeMcpError(
      'Category must contain only letters, numbers, hyphens, and underscores',
      'INVALID_CATEGORY',
      400,
      { category }
    );
  }
}

export function validateSortOrder(sort: string): void {
  const validSortOrders = ['relevance', 'downloads', 'recent-downloads', 'recent-updates'];
  
  if (!validSortOrders.includes(sort)) {
    throw new PackageReadmeMcpError(
      `Invalid sort order. Must be one of: ${validSortOrders.join(', ')}`,
      'INVALID_SORT_ORDER',
      400,
      { sort, validSortOrders }
    );
  }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  // Remove null bytes and other control characters except tabs, newlines, and carriage returns
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

export function validateEnvironmentVariables(): void {
  // Optional GitHub token validation
  const githubToken = process.env.GITHUB_TOKEN;
  if (githubToken && (typeof githubToken !== 'string' || githubToken.trim().length === 0)) {
    throw new PackageReadmeMcpError(
      'GITHUB_TOKEN environment variable must be a non-empty string if provided',
      'INVALID_ENVIRONMENT',
      500
    );
  }

  // Validate cache settings
  const cacheTtl = process.env.CACHE_TTL;
  if (cacheTtl) {
    const ttlNumber = parseInt(cacheTtl, 10);
    if (isNaN(ttlNumber) || ttlNumber < 0) {
      throw new PackageReadmeMcpError(
        'CACHE_TTL environment variable must be a non-negative integer',
        'INVALID_ENVIRONMENT',
        500,
        { cacheTtl }
      );
    }
  }

  const cacheMaxSize = process.env.CACHE_MAX_SIZE;
  if (cacheMaxSize) {
    const maxSizeNumber = parseInt(cacheMaxSize, 10);
    if (isNaN(maxSizeNumber) || maxSizeNumber < 0) {
      throw new PackageReadmeMcpError(
        'CACHE_MAX_SIZE environment variable must be a non-negative integer',
        'INVALID_ENVIRONMENT',
        500,
        { cacheMaxSize }
      );
    }
  }

  // Validate request timeout
  const requestTimeout = process.env.REQUEST_TIMEOUT;
  if (requestTimeout) {
    const timeoutNumber = parseInt(requestTimeout, 10);
    if (isNaN(timeoutNumber) || timeoutNumber < 1000) {
      throw new PackageReadmeMcpError(
        'REQUEST_TIMEOUT environment variable must be at least 1000 milliseconds',
        'INVALID_ENVIRONMENT',
        500,
        { requestTimeout }
      );
    }
  }
}