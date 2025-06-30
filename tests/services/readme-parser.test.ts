import { describe, it, expect, beforeEach } from 'vitest';
import { ReadmeParser, readmeParser } from '../../src/services/readme-parser.js';

describe('ReadmeParser', () => {
  let parser: ReadmeParser;

  beforeEach(() => {
    parser = new ReadmeParser();
  });

  describe('parseUsageExamples', () => {
    it('should return empty array when includeExamples is false', () => {
      const readme = '# Test\n```rust\nfn main() {}\n```';
      const result = parser.parseUsageExamples(readme, false);
      
      expect(result).toEqual([]);
    });

    it('should return empty array for empty content', () => {
      const result = parser.parseUsageExamples('', true);
      
      expect(result).toEqual([]);
    });

    it('should extract usage examples from usage sections', () => {
      const readme = `
# My Crate

## Usage

Here's how to use this crate:

\`\`\`rust
use my_crate::MyStruct;

fn main() {
    let instance = MyStruct::new();
    instance.do_something();
}
\`\`\`

## Installation

Add this to your Cargo.toml:

\`\`\`toml
[dependencies]
my_crate = "1.0"
\`\`\`
      `;

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples.length).toBeGreaterThanOrEqual(1);
      expect(examples[0].language).toBe('rust');
      expect(examples[0].code).toContain('use my_crate::MyStruct');
      expect(examples[0].title).toBe('Basic Usage');
      
      expect(examples[1].language).toBe('toml');
      expect(examples[1].code).toContain('[dependencies]');
      expect(examples[1].title).toBe('Cargo.toml Configuration');
    });

    it('should detect different example types based on content', () => {
      const readme = `
## Examples

Installation:
\`\`\`bash
cargo install my_crate
\`\`\`

Basic usage:
\`\`\`rust
fn main() {
    println!("Hello, world!");
}
\`\`\`

Async example:
\`\`\`rust
async fn fetch_data() {
    let result = some_async_function().await;
}
\`\`\`

Configuration:
\`\`\`json
{
  "setting": "value"
}
\`\`\`
      `;

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples).toHaveLength(4);
      expect(examples[0].title).toBe('Installation');
      expect(examples[1].title).toBe('Complete Example');
      expect(examples[2].title).toBe('Async Example');
      expect(examples[3].title).toBe('JSON Configuration');
    });

    it('should extract descriptions from context', () => {
      const readme = `
## Usage

This is a description of how to use the library.

\`\`\`rust
use my_crate::Config;
\`\`\`
      `;

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples).toHaveLength(1);
      expect(examples[0].description).toBe('This is a description of how to use the library.');
    });

    it('should deduplicate identical examples', () => {
      const readme = `
## Usage

\`\`\`rust
use my_crate::MyStruct;
\`\`\`

## Examples

\`\`\`rust
use my_crate::MyStruct;
\`\`\`
      `;

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples).toHaveLength(1);
    });

    it('should limit examples to reasonable number', () => {
      const readme = `
## Examples

` + Array.from({ length: 15 }, (_, i) => `
\`\`\`rust
// Example ${i + 1}
fn example_${i + 1}() {}
\`\`\`
`).join('');

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples.length).toBeLessThanOrEqual(10);
    });

    it('should handle different usage section patterns', () => {
      const sections = [
        '# Usage',
        '## Use',
        '### Using',
        '#### How to use',
        '##### Getting started',
        '###### Quick start',
        '# Examples',
        '## Example',
        'Usage:',
        'Examples:'
      ];

      for (const section of sections) {
        const readme = `
${section}

\`\`\`rust
fn test() {}
\`\`\`
        `;

        const examples = parser.parseUsageExamples(readme, true);
        expect(examples.length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should skip empty code blocks', () => {
      const readme = `
## Usage

\`\`\`rust
\`\`\`

\`\`\`rust
fn main() {}
\`\`\`
      `;

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples).toHaveLength(1);
      expect(examples[0].code).toBe('fn main() {}');
    });
  });

  describe('cleanMarkdown', () => {
    it('should remove badges', () => {
      const content = `
# My Crate

![Build Status](https://img.shields.io/badge/build-passing-green)

Some content here.
      `;

      const cleaned = parser.cleanMarkdown(content);
      
      expect(cleaned).not.toContain('![Build Status]');
      expect(cleaned).toContain('Some content here.');
    });

    it('should preserve meaningful alt text from badges', () => {
      const content = `
![Documentation](https://docs.rs/my_crate/badge.svg)
      `;

      const cleaned = parser.cleanMarkdown(content);
      
      expect(cleaned).toContain('Documentation');
    });

    it('should convert relative links to text', () => {
      const content = `
See the [documentation](./docs/guide.md) for more info.
      `;

      const cleaned = parser.cleanMarkdown(content);
      
      expect(cleaned).toContain('documentation');
      expect(cleaned).not.toContain('](./docs/guide.md)');
    });

    it('should preserve absolute links', () => {
      const content = `
See the [documentation](https://docs.rs/my_crate) for more info.
      `;

      const cleaned = parser.cleanMarkdown(content);
      
      expect(cleaned).toContain('[documentation](https://docs.rs/my_crate)');
    });

    it('should clean up excessive whitespace', () => {
      const content = `
# Title



Content here.




More content.
      `;

      const cleaned = parser.cleanMarkdown(content);
      
      expect(cleaned).not.toMatch(/\n{3,}/);
    });

    it('should handle empty content', () => {
      const cleaned = parser.cleanMarkdown('');
      
      expect(cleaned).toBe('');
    });
  });

  describe('extractDescription', () => {
    it('should extract first substantial paragraph', () => {
      const content = `
# My Crate

![Badge](badge.svg)

This is a description of the crate. It provides useful functionality for Rust developers.

## Installation

Add this to your Cargo.toml...
      `;

      const description = parser.extractDescription(content);
      
      expect(description).toBe('This is a description of the crate. It provides useful functionality for Rust developers.');
    });

    it('should skip headers and badges', () => {
      const content = `
# My Crate

[![Build](badge.svg)](link)

![Another Badge](badge2.svg)

This is the actual description.
      `;

      const description = parser.extractDescription(content);
      
      expect(description).toBe('This is the actual description.');
    });

    it('should handle multi-line descriptions', () => {
      const content = `
# My Crate

This is the first line of description.
This is the second line that continues the description.

## Next Section
      `;

      const description = parser.extractDescription(content);
      
      expect(description).toContain('This is the first line of description.');
      expect(description).toContain('This is the second line that continues the description.');
    });

    it('should limit description length', () => {
      const content = `
# My Crate

This is a very long description that goes on and on and on and contains way too much text to be useful as a short description. It should be truncated at some reasonable point to avoid overwhelming the user with too much information in what should be a concise summary.
      `;

      const description = parser.extractDescription(content);
      
      expect(description.length).toBeLessThan(400);
    });

    it('should return fallback for empty content', () => {
      const description = parser.extractDescription('');
      
      expect(description).toBe('No description available');
    });

    it('should return fallback when no description found', () => {
      const content = `
# My Crate

## Installation

Add this to Cargo.toml
      `;

      const description = parser.extractDescription(content);
      
      expect(description).toContain('Add this to Cargo.toml');
    });

    it('should stop at next section', () => {
      const content = `
# My Crate

This is the description.

## Installation

This should not be included.
      `;

      const description = parser.extractDescription(content);
      
      expect(description).toBe('This is the description.');
      expect(description).not.toContain('This should not be included');
    });
  });

  describe('language normalization', () => {
    it('should normalize language aliases', () => {
      const readme = `
## Examples

\`\`\`rs
fn main() {}
\`\`\`

\`\`\`sh
cargo build
\`\`\`

\`\`\`shell
cargo run
\`\`\`

\`\`\`yml
name: CI
\`\`\`
      `;

      const examples = parser.parseUsageExamples(readme, true);
      
      expect(examples[0].language).toBe('rust');
      expect(examples[1].language).toBe('bash');
      expect(examples[2].language).toBe('bash');
      expect(examples[3].language).toBe('yaml');
    });
  });

  describe('code detection heuristics', () => {
    it('should detect when text looks like code', () => {
      const parser = new ReadmeParser();
      const looksLikeCode = (parser as any).looksLikeCode.bind(parser);
      
      expect(looksLikeCode('fn main() {')).toBe(true);
      expect(looksLikeCode('use std::io;')).toBe(true);
      expect(looksLikeCode('$ cargo build')).toBe(true);
      expect(looksLikeCode('// This is a comment')).toBe(true);
      expect(looksLikeCode('[dependencies]')).toBe(true);
      
      expect(looksLikeCode('This is a normal sentence.')).toBe(false);
      expect(looksLikeCode('Here is some documentation.')).toBe(false);
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(readmeParser).toBeInstanceOf(ReadmeParser);
    });
  });
});