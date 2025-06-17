# Cargo Package README MCP Server

[![npm version](https://img.shields.io/npm/v/cargo-package-readme-mcp-server)](https://www.npmjs.com/package/cargo-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/cargo-package-readme-mcp-server)](https://www.npmjs.com/package/cargo-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/naoto24kawa/cargo-package-readme-mcp-server)](https://github.com/naoto24kawa/cargo-package-readme-mcp-server)
[![GitHub issues](https://img.shields.io/github/issues/naoto24kawa/cargo-package-readme-mcp-server)](https://github.com/naoto24kawa/cargo-package-readme-mcp-server/issues)
[![license](https://img.shields.io/npm/l/cargo-package-readme-mcp-server)](https://github.com/naoto24kawa/cargo-package-readme-mcp-server/blob/main/LICENSE)

An MCP (Model Context Protocol) server for fetching Rust crate README files and usage information from crates.io. This server provides AI assistants with comprehensive access to Rust package documentation, usage examples, dependencies, and metadata through a clean API interface.

## ✨ Key Features

- 📖 **Comprehensive README Retrieval**: Fetch complete README content with formatted usage examples and documentation
- 📊 **Detailed Package Information**: Access metadata, dependencies, download statistics, and version history
- 🔍 **Advanced Package Search**: Search crates with filtering by category, sorting options, and relevance ranking
- ⚡ **Intelligent Caching**: Multi-tier caching system with TTL management and LRU eviction for optimal performance
- 🔄 **GitHub Integration**: Automatic fallback to GitHub repositories when README is not available on crates.io
- 🛡️ **Robust Error Handling**: Comprehensive error handling with retry mechanisms and circuit breaker patterns
- 🔧 **Type-Safe Implementation**: Full TypeScript implementation with comprehensive type definitions and validation
- 🚀 **High Performance**: Optimized for speed with concurrent request handling and smart batching

## 📦 Installation

### Via npm (Recommended)

```bash
npm install -g cargo-package-readme-mcp-server
```

### Via npx (No installation required)

```bash
npx cargo-package-readme-mcp-server
```

## 🚀 Quick Start

### Claude Desktop Integration

Add to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

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

### Other MCP Clients

For other MCP-compatible clients, use the standard MCP server configuration with the command `cargo-package-readme-mcp-server`.

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GITHUB_TOKEN` | GitHub API token for README fallback and rate limiting | - | Recommended |
| `LOG_LEVEL` | Logging level (DEBUG, INFO, WARN, ERROR) | INFO | No |
| `CACHE_TTL` | Cache time-to-live in milliseconds | 3600000 (1 hour) | No |
| `CACHE_MAX_SIZE` | Maximum cache size in bytes | 104857600 (100MB) | No |
| `REQUEST_TIMEOUT` | Request timeout in milliseconds | 30000 (30s) | No |

> **💡 Pro Tip**: Setting a `GITHUB_TOKEN` significantly improves API rate limits and enables README fallback functionality.

## 🛠️ Available Tools

### 1. 📖 get_package_readme

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

### 2. 📊 get_package_info

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

### 3. 🔍 search_packages

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

## 🛠️ Development

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript 5+

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd cargo-package-readme-mcp-server

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode with hot reload
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Build TypeScript to JavaScript |
| `npm run dev` | Development mode with auto-reload |
| `npm start` | Start production server |
| `npm test` | Run test suite |
| `npm run lint` | Run ESLint code analysis |
| `npm run typecheck` | TypeScript type checking |
| `npm run clean` | Clean build artifacts |

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

## 🔌 API Integration

### Crates.io API Endpoints

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `GET /api/v1/crates/{crate}` | Package information | 1000/hour |
| `GET /api/v1/crates/{crate}/{version}` | Version-specific data | 1000/hour |
| `GET /api/v1/crates?q={query}` | Package search | 1000/hour |
| `GET /api/v1/crates/{crate}/downloads` | Download statistics | 1000/hour |

### GitHub API (Fallback)

| Endpoint | Purpose | Rate Limit |
|----------|---------|------------|
| `GET /repos/{owner}/{repo}/readme` | Repository README | 5000/hour (authenticated) |
| `GET /repos/{owner}/{repo}` | Repository metadata | 5000/hour (authenticated) |

## 💾 Caching Strategy

Our intelligent caching system optimizes performance and reduces API calls:

| Data Type | TTL | Cache Strategy |
|-----------|-----|----------------|
| **Package Info** | 1 hour | LRU with size-based eviction |
| **README Content** | 1 hour | LRU with compression |
| **Search Results** | 10 minutes | LRU with query-based keys |
| **Download Stats** | 24 hours | Time-based invalidation |
| **Version Lists** | 6 hours | Incremental updates |

## 🛡️ Error Handling & Resilience

- **🔍 Package Not Found**: Graceful 404 handling with suggested alternatives
- **⏱️ Rate Limiting**: Exponential backoff with jitter for optimal retry timing
- **🌐 Network Errors**: Circuit breaker pattern with automatic failover
- **✅ Input Validation**: Comprehensive validation with detailed error messages
- **🔄 Retry Logic**: Smart retry mechanisms with configurable backoff strategies

## 📋 Example Use Cases

### AI Assistant Integration
- **Documentation Research**: "Find information about the `serde` crate"
- **Dependency Analysis**: "What are the dependencies of `tokio` version 1.0?"
- **Package Discovery**: "Search for web frameworks in Rust"
- **Usage Examples**: "Show me how to use the `reqwest` HTTP client"

### Development Workflow
- **Package Evaluation**: Compare multiple crates for similar functionality
- **Version Planning**: Analyze changelogs and breaking changes
- **Dependency Management**: Understand transitive dependencies
- **Learning Resources**: Access comprehensive documentation and examples

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new functionality
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Feedback

- **🐛 Bug Reports**: [GitHub Issues](https://github.com/your-repo/cargo-package-readme-mcp-server/issues)
- **💡 Feature Requests**: [GitHub Discussions](https://github.com/your-repo/cargo-package-readme-mcp-server/discussions)
- **📚 Documentation**: [Wiki](https://github.com/your-repo/cargo-package-readme-mcp-server/wiki)

---

<div align="center">

**Made with ❤️ for the Rust community**

[⭐ Star us on GitHub](https://github.com/your-repo/cargo-package-readme-mcp-server) | [🐦 Follow updates](https://twitter.com/your-handle)

</div>