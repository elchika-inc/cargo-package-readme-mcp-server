export interface UsageExample {
  title: string;
  description?: string | undefined;
  code: string;
  language: string; // 'rust', 'toml', 'bash', etc.
}

export interface InstallationInfo {
  cargo: string;      // "cargo install package-name" or "cargo add package-name"
  toml?: string;      // "[dependencies] package-name = \"version\""
}

export interface AuthorInfo {
  name: string;
  email?: string;
  url?: string;
}

export interface RepositoryInfo {
  type: string;
  url: string;
  directory?: string | undefined;
}

export interface PackageBasicInfo {
  name: string;
  version: string;
  description: string;
  homepage?: string | undefined;
  documentation?: string | undefined;
  repository?: string | undefined;
  license: string;
  authors: string[];
  keywords: string[];
  categories: string[];
}

export interface DownloadStats {
  last_day: number;
  last_week: number;
  last_month: number;
}

export interface PackageSearchResult {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  author: string;
  publisher: string;
  maintainers: string[];
  score: {
    final: number;
    detail: {
      quality: number;
      popularity: number;
      maintenance: number;
    };
  };
  searchScore: number;
}

// Tool Parameters
export interface GetPackageReadmeParams {
  package_name: string;    // Package name (required)
  version?: string;        // Version specification (optional, default: "latest")
  include_examples?: boolean; // Whether to include examples (optional, default: true)
}

export interface GetPackageInfoParams {
  package_name: string;
  include_dependencies?: boolean; // Whether to include dependencies (default: true)
  include_dev_dependencies?: boolean; // Whether to include dev dependencies (default: false)
}

export interface SearchPackagesParams {
  query: string;          // Search query
  limit?: number;         // Max results limit (default: 20)
  quality?: number;       // Quality score minimum value (0-1)
  popularity?: number;    // Popularity score minimum value (0-1)
}

// Tool Responses
export interface PackageReadmeResponse {
  package_name: string;
  version: string;
  description: string;
  readme_content: string;
  usage_examples: UsageExample[];
  installation: InstallationInfo;
  basic_info: PackageBasicInfo;
  repository?: RepositoryInfo | undefined;
  exists: boolean;
}

export interface PackageInfoResponse {
  package_name: string;
  latest_version: string;
  description: string;
  author: string;
  license: string;
  keywords: string[];
  dependencies?: Record<string, string> | undefined;
  dev_dependencies?: Record<string, string> | undefined;
  download_stats: DownloadStats;
  repository?: RepositoryInfo | undefined;
  exists: boolean;
}

export interface SearchPackagesResponse {
  query: string;
  total: number;
  packages: PackageSearchResult[];
}

// Cache Types
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

// Crates.io API Types
export interface CratesIoCrate {
  id: string;
  name: string;
  updated_at: string;
  versions: CratesIoVersion[];
  keywords: string[];
  categories: string[];
  badges: unknown[];
  created_at: string;
  downloads: number;
  recent_downloads: number;
  max_version: string;
  max_stable_version: string;
  description: string;
  homepage: string | null;
  documentation: string | null;
  repository: string | null;
  links: {
    version_downloads: string;
    versions: string;
    owners: string;
    owner_team: string;
    owner_user: string;
    reverse_dependencies: string;
  };
  exact_match: boolean;
}

export interface CratesIoVersion {
  id: number;
  crate: string;
  num: string;
  dl_path: string;
  readme_path: string;
  updated_at: string;
  created_at: string;
  downloads: number;
  features: Record<string, string[]>;
  yanked: boolean;
  license: string;
  links: {
    dependencies: string;
    version_downloads: string;
    authors: string;
  };
  crate_size: number;
  published_by: {
    id: number;
    login: string;
    name: string;
    avatar: string;
    url: string;
  };
  audit_actions: unknown[];
}

export interface CratesIoVersionWithDependencies extends CratesIoVersion {
  dependencies: CratesIoDependency[];
  authors: CratesIoAuthor[];
}

export interface CratesIoDependency {
  id: number;
  version_id: number;
  crate_id: string;
  req: string;
  optional: boolean;
  default_features: boolean;
  features: string[];
  target: string | null;
  kind: 'normal' | 'build' | 'dev';
  downloads: number;
}

export interface CratesIoAuthor {
  id: number;
  login: string;
  name: string;
  avatar: string;
  url: string;
}

export interface CratesIoSearchResponse {
  crates: CratesIoCrate[];
  meta: {
    total: number;
    next_page?: string;
    prev_page?: string;
  };
}

export interface CratesIoVersionResponse {
  version: CratesIoVersionWithDependencies;
}

export interface CratesIoCrateResponse {
  crate: CratesIoCrate;
  versions: CratesIoVersion[];
  keywords: Array<{ id: string; keyword: string; crates_cnt: number; created_at: string }>;
  categories: Array<{ id: string; category: string; slug: string; description: string; crates_cnt: number; created_at: string }>;
}

export interface CratesIoDownloadStats {
  version_downloads: Array<{
    version: string;
    downloads: number;
    date: string;
  }>;
}

// GitHub API Types
export interface GitHubReadmeResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

// Error Types
export class PackageReadmeMcpError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'PackageReadmeMcpError';
  }
}

export class PackageNotFoundError extends PackageReadmeMcpError {
  constructor(packageName: string) {
    super(`Package '${packageName}' not found`, 'PACKAGE_NOT_FOUND', 404);
  }
}

export class VersionNotFoundError extends PackageReadmeMcpError {
  constructor(packageName: string, version: string) {
    super(`Version '${version}' of package '${packageName}' not found`, 'VERSION_NOT_FOUND', 404);
  }
}

export class RateLimitError extends PackageReadmeMcpError {
  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

export class NetworkError extends PackageReadmeMcpError {
  constructor(message: string, originalError?: Error) {
    super(`Network error: ${message}`, 'NETWORK_ERROR', undefined, originalError);
  }
}