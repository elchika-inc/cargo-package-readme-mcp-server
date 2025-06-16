# Cargo Package README MCP Server

An MCP (Model Context Protocol) server for fetching Rust crate README files and usage information from crates.io. This server provides comprehensive information about Rust packages including documentation, usage examples, dependencies, and metadata.

## Features

- **Package README Retrieval**: Fetch complete README content with usage examples
- **Package Information**: Get detailed metadata, dependencies, and statistics
- **Package Search**: Search for crates with filtering and sorting options
- **Smart Caching**: Efficient caching system with TTL and LRU eviction
- **GitHub Fallback**: Automatically fetch README from GitHub if not available on crates.io
- **Error Handling**: Robust error handling with retry mechanisms
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions

## Installation

```bash
npm install cargo-package-readme-mcp-server
```

## Usage

### As an MCP Server

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "cargo-package-readme": {
      "command": "cargo-package-readme-mcp-server",
      "env": {
        "GITHUB_TOKEN": "your-github-token-here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GITHUB_TOKEN` | GitHub API token for README fallback | - | No |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARN, ERROR) | INFO | No |
| `CACHE_TTL` | Cache time-to-live in milliseconds | 3600000 | No |
| `CACHE_MAX_SIZE` | Maximum cache size in bytes | 104857600 | No |
| `REQUEST_TIMEOUT` | Request timeout in milliseconds | 30000 | No |

## Available Tools

### 1. get_package_readme

Retrieves comprehensive README and usage information for a Rust crate.

**Parameters:**
- `package_name` (string, required): Name of the Rust crate
- `version` (string, optional): Specific version (default: "latest")
- `include_examples` (boolean, optional): Include usage examples (default: true)

**Example:**
```json
{
  "package_name": "serde",
  "version": "1.0.0",
  "include_examples": true
}
```

### 2. get_package_info

Gets basic package information, metadata, and dependencies.

**Parameters:**
- `package_name` (string, required): Name of the Rust crate
- `include_dependencies` (boolean, optional): Include dependencies (default: true)
- `include_dev_dependencies` (boolean, optional): Include dev dependencies (default: false)

**Example:**
```json
{
  "package_name": "tokio",
  "include_dependencies": true,
  "include_dev_dependencies": false
}
```

### 3. search_packages

Search for Rust crates with filtering and sorting options.

**Parameters:**
- `query` (string, required): Search query
- `limit` (number, optional): Maximum results (1-100, default: 20)
- `category` (string, optional): Filter by category (e.g., "web-programming")
- `sort` (string, optional): Sort order - "relevance", "downloads", "recent-downloads", "recent-updates" (default: "relevance")

**Example:**
```json
{
  "query": "web framework",
  "limit": 10,
  "category": "web-programming",
  "sort": "downloads"
}
```

## Development

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd cargo-package-readme-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

### Scripts

- `npm run build` - Build the TypeScript project
- `npm run dev` - Run in development mode with auto-reload
- `npm start` - Start the production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Project Structure

```
src/
├── index.ts                 # Main entry point
├── server.ts               # MCP server implementation
├── tools/                  # Tool implementations
│   ├── get-package-readme.ts
│   ├── get-package-info.ts
│   └── search-packages.ts
├── services/               # External API clients
│   ├── crates-io-api.ts   # Crates.io API client
│   ├── github-api.ts      # GitHub API client
│   ├── cache.ts           # Caching service
│   └── readme-parser.ts   # README parsing utilities
├── utils/                  # Utility modules
│   ├── logger.ts          # Logging utilities
│   ├── error-handler.ts   # Error handling
│   └── validators.ts      # Input validation
└── types/                  # TypeScript type definitions
    └── index.ts
```

## API Integration

### Crates.io API

- **Package Info**: `https://crates.io/api/v1/crates/{crate}`
- **Version Info**: `https://crates.io/api/v1/crates/{crate}/{version}`
- **Search**: `https://crates.io/api/v1/crates?q={query}`
- **Downloads**: `https://crates.io/api/v1/crates/{crate}/downloads`

### GitHub API (Fallback)

- **README**: `https://api.github.com/repos/{owner}/{repo}/readme`

## Caching Strategy

- **Memory Cache**: LRU cache with configurable TTL and size limits
- **Package Info**: 1 hour TTL
- **README Content**: 1 hour TTL  
- **Search Results**: 10 minutes TTL
- **Download Stats**: Daily invalidation

## Error Handling

- **Package Not Found**: Returns 404 with appropriate error message
- **Rate Limiting**: Implements exponential backoff retry strategy
- **Network Errors**: Automatic retry with circuit breaker pattern
- **Validation Errors**: Comprehensive input validation with detailed error messages

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions, please use the GitHub issue tracker.