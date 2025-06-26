# Cargo Package README MCP Server

[![license](https://img.shields.io/npm/l/cargo-package-readme-mcp-server)](https://github.com/elchika-inc/cargo-package-readme-mcp-server/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/cargo-package-readme-mcp-server)](https://www.npmjs.com/package/cargo-package-readme-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/cargo-package-readme-mcp-server)](https://www.npmjs.com/package/cargo-package-readme-mcp-server)
[![GitHub stars](https://img.shields.io/github/stars/elchika-inc/cargo-package-readme-mcp-server)](https://github.com/elchika-inc/cargo-package-readme-mcp-server)

A Model Context Protocol (MCP) server for retrieving README files and package information from Rust crates on crates.io with comprehensive documentation extraction.

## Features

- **README Extraction**: Retrieve complete README content and documentation from Rust crates
- **Package Information**: Access detailed package metadata, dependencies, and version information  
- **Crate Search**: Search for Rust crates with filtering and sorting capabilities
- **GitHub Integration**: Automatic fallback to GitHub repositories for additional documentation
- **Smart Caching**: Built-in caching system for improved performance and reduced API calls
- **Error Handling**: Comprehensive error handling with detailed error messages

## MCP Client Configuration

Add this server to your MCP client configuration:

```json
{
  "mcpServers": {
    "cargo-package-readme": {
      "command": "npx",
      "args": ["cargo-package-readme-mcp-server"]
    }
  }
}
```

## Available Tools

### get_package_readme

Retrieves README content and documentation for a Rust crate from crates.io with automatic GitHub fallback.

**Parameters:**
- `package_name` (required): Name of the Rust crate to retrieve README for
- `version` (optional): Specific version of the crate (default: latest)

**Examples:**

Basic README retrieval:
```json
{
  "name": "get_package_readme",
  "arguments": {
    "package_name": "serde"
  }
}
```

Specific version:
```json
{
  "name": "get_package_readme", 
  "arguments": {
    "package_name": "tokio",
    "version": "1.0.0"
  }
}
```

### get_package_info

Retrieves detailed package information including metadata, dependencies, and download statistics.

**Parameters:**
- `package_name` (required): Name of the Rust crate
- `include_dependencies` (optional): Include dependency information (default: true)

**Example:**
```json
{
  "name": "get_package_info",
  "arguments": {
    "package_name": "actix-web",
    "include_dependencies": true
  }
}
```

### search_packages

Search for Rust crates on crates.io with filtering and sorting options.

**Parameters:**
- `query` (required): Search query string
- `limit` (optional): Maximum number of results (1-100, default: 20)
- `sort` (optional): Sort order - "relevance", "downloads", "recent-downloads", "recent-updates" (default: "relevance")

**Example:**
```json
{
  "name": "search_packages",
  "arguments": {
    "query": "web framework",
    "limit": 10,
    "sort": "downloads"
  }
}
```

## Error Handling

Common error scenarios:
- Package not found on crates.io
- Network connection issues
- Invalid package names or versions
- GitHub API rate limits
- Malformed README content

## License

MIT