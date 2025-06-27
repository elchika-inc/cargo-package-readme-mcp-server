import { 
  BasePackageServer, 
  ToolDefinition, 
  PackageReadmeMcpError, 
} from '@elchika-inc/package-readme-shared';
import { getPackageReadme } from './tools/get-package-readme.js';
import { getPackageInfo } from './tools/get-package-info.js';
import { searchPackages } from './tools/search-packages.js';
import { validatePackageName, validateVersion, validateSearchQuery, validateLimit } from './utils/validators.js';
import type {
  GetPackageReadmeParams,
  GetPackageInfoParams,
  SearchPackagesParams,
} from './types/index.js';

const TOOL_DEFINITIONS: Record<string, ToolDefinition> = {
  get_readme_from_cargo: {
    name: 'get_readme_from_cargo',
    description: 'Get Rust crate README and usage examples from crates.io',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the Rust crate',
        },
        version: {
          type: 'string',
          description: 'The version of the crate (default: "latest")',
          default: 'latest',
        },
        include_examples: {
          type: 'boolean',
          description: 'Whether to include usage examples (default: true)',
          default: true,
        },
      },
      required: ['package_name'],
    },
  },
  get_package_info_from_cargo: {
    name: 'get_package_info_from_cargo',
    description: 'Get Rust crate basic information and dependencies from crates.io',
    inputSchema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The name of the Rust crate',
        },
        include_dependencies: {
          type: 'boolean',
          description: 'Whether to include dependencies (default: true)',
          default: true,
        },
        include_dev_dependencies: {
          type: 'boolean',
          description: 'Whether to include development dependencies (default: false)',
          default: false,
        },
      },
      required: ['package_name'],
    },
  },
  search_packages_from_cargo: {
    name: 'search_packages_from_cargo',
    description: 'Search for Rust crates in crates.io registry',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results to return (default: 20)',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        quality: {
          type: 'number',
          description: 'Minimum quality score (0-1)',
          minimum: 0,
          maximum: 1,
        },
        popularity: {
          type: 'number',
          description: 'Minimum popularity score (0-1)',
          minimum: 0,
          maximum: 1,
        },
      },
      required: ['query'],
    },
  }
} as const;

export class CargoPackageReadmeMcpServer extends BasePackageServer {
  constructor() {
    super({
      name: 'cargo-package-readme-mcp',
      version: '1.0.0',
    });
  }

  protected getToolDefinitions(): Record<string, ToolDefinition> {
    return TOOL_DEFINITIONS;
  }

  protected async handleToolCall(name: string, args: unknown): Promise<unknown> {
    // Validate that args is an object
    if (!args || typeof args !== 'object') {
      throw new PackageReadmeMcpError(
        'Tool arguments must be an object',
        'VALIDATION_ERROR'
      );
    }

    switch (name) {
      case 'get_readme_from_cargo':
        return await this.handleGetPackageReadme(this.validateGetPackageReadmeParams(args));
      
      case 'get_package_info_from_cargo':
        return await this.handleGetPackageInfo(this.validateGetPackageInfoParams(args));
      
      case 'search_packages_from_cargo':
        return await this.handleSearchPackages(this.validateSearchPackagesParams(args));
      
      default:
        throw new PackageReadmeMcpError(
          `Unknown tool: ${name}`,
          'VALIDATION_ERROR'
        );
    }
  }

  private async handleGetPackageReadme(params: GetPackageReadmeParams) {
    return await getPackageReadme(params);
  }

  private async handleGetPackageInfo(params: GetPackageInfoParams) {
    return await getPackageInfo(params);
  }

  private async handleSearchPackages(params: SearchPackagesParams) {
    return await searchPackages(params);
  }

  private validateGetPackageReadmeParams(args: unknown): GetPackageReadmeParams {
    const params = args as Record<string, unknown>;
    
    validatePackageName(String(params.package_name));
    
    const result: GetPackageReadmeParams = {
      package_name: String(params.package_name),
    };
    
    if (params.version !== undefined) {
      validateVersion(String(params.version));
      result.version = String(params.version);
    }
    
    if (params.include_examples !== undefined) {
      result.include_examples = Boolean(params.include_examples);
    }
    
    return result;
  }

  private validateGetPackageInfoParams(args: unknown): GetPackageInfoParams {
    const params = args as Record<string, unknown>;
    
    validatePackageName(String(params.package_name));
    
    const result: GetPackageInfoParams = {
      package_name: String(params.package_name),
    };
    
    if (params.include_dependencies !== undefined) {
      result.include_dependencies = Boolean(params.include_dependencies);
    }
    
    if (params.include_dev_dependencies !== undefined) {
      result.include_dev_dependencies = Boolean(params.include_dev_dependencies);
    }
    
    return result;
  }

  private validateSearchPackagesParams(args: unknown): SearchPackagesParams {
    const params = args as Record<string, unknown>;
    
    validateSearchQuery(String(params.query));
    
    const result: SearchPackagesParams = {
      query: String(params.query),
    };
    
    if (params.limit !== undefined) {
      const limit = Number(params.limit);
      validateLimit(limit);
      result.limit = limit;
    }
    
    if (params.quality !== undefined) {
      result.quality = Number(params.quality);
    }
    
    if (params.popularity !== undefined) {
      result.popularity = Number(params.popularity);
    }
    
    return result;
  }

}

export default CargoPackageReadmeMcpServer;