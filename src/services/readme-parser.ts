import { logger } from '../utils/logger.js';
import { SectionExtractor } from './section-extractor.js';
import { CodeAnalyzer } from './code-analyzer.js';
import type { UsageExample } from '../types/index.js';

export class ReadmeParser {
  private readonly sectionExtractor = new SectionExtractor();
  private readonly codeAnalyzer = new CodeAnalyzer();
  private static readonly CODE_BLOCK_PATTERN = /```(\w+)?\n([\s\S]*?)```/g;

  parseUsageExamples(readmeContent: string, includeExamples: boolean = true): UsageExample[] {
    if (!includeExamples || !readmeContent) {
      return [];
    }

    try {
      const examples: UsageExample[] = [];
      const sections = this.sectionExtractor.extractUsageSections(readmeContent);

      for (const section of sections) {
        const sectionExamples = this.extractCodeBlocksFromSection(section);
        examples.push(...sectionExamples);
      }

      const uniqueExamples = this.deduplicateExamples(examples);
      const limitedExamples = uniqueExamples.slice(0, 10);

      logger.debug(`Extracted ${limitedExamples.length} usage examples from README`);
      return limitedExamples;
    } catch (error) {
      logger.warn('Failed to parse usage examples from README', { error });
      return [];
    }
  }


  private extractCodeBlocksFromSection(section: string): UsageExample[] {
    const examples: UsageExample[] = [];
    const codeBlockRegex = new RegExp(ReadmeParser.CODE_BLOCK_PATTERN.source, 'g');
    let match;

    while ((match = codeBlockRegex.exec(section)) !== null) {
      const [, language = 'text', code] = match;
      const cleanCode = (code || '').trim();
      
      if (cleanCode.length === 0) {
        continue;
      }

      const title = this.codeAnalyzer.generateExampleTitle(cleanCode, language);
      const description = this.extractExampleDescription(section, match.index);

      examples.push({
        title,
        description: description || undefined,
        code: cleanCode,
        language: this.codeAnalyzer.normalizeLanguage(language),
      });
    }

    return examples;
  }

  private generateExampleTitle(code: string, language: string): string {
    // Try to infer title from code content
    const firstLine = (code.split('\n')[0] || '').trim();
    
    if (language === 'bash' || language === 'shell' || language === 'sh') {
      if (firstLine.includes('cargo install') || firstLine.includes('cargo add')) {
        return 'Installation';
      }
      if (firstLine.includes('cargo run') || firstLine.includes('cargo build')) {
        return 'Build and Run';
      }
      return 'Command Line Usage';
    }

    if (language === 'rust' || language === 'rs') {
      if (firstLine.includes('use ') || code.includes('extern crate')) {
        return 'Basic Usage';
      }
      if (code.includes('fn main()')) {
        return 'Complete Example';
      }
      if (code.includes('struct') || code.includes('enum')) {
        return 'Type Definitions';
      }
      if (code.includes('impl')) {
        return 'Implementation Example';
      }
      if (code.includes('async') || code.includes('await')) {
        return 'Async Example';
      }
      return 'Rust Example';
    }

    if (language === 'toml') {
      if (code.includes('[dependencies]') || code.includes('Cargo.toml')) {
        return 'Cargo.toml Configuration';
      }
      return 'Configuration';
    }

    if (language === 'yaml' || language === 'yml') {
      if (code.includes('github.com') || code.includes('actions')) {
        return 'GitHub Actions';
      }
      return 'Configuration';
    }

    if (language === 'json') {
      return 'JSON Configuration';
    }

    if (language === 'dockerfile') {
      return 'Docker Configuration';
    }

    return 'Code Example';
  }

  private extractExampleDescription(section: string, codeBlockIndex: number): string | undefined {
    // Look for text before the code block that might be a description
    const beforeCodeBlock = section.substring(0, codeBlockIndex);
    const lines = beforeCodeBlock.split('\n').reverse();
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0 || trimmed.startsWith('#')) {
        continue;
      }
      
      // If it's a reasonable length and doesn't look like code, use it as description
      if (trimmed.length > 10 && trimmed.length < 200 && !this.looksLikeCode(trimmed)) {
        return trimmed.replace(/^[*-]\s*/, ''); // Remove bullet points
      }
      
      break; // Stop at first non-empty line
    }

    return undefined;
  }

  private looksLikeCode(text: string): boolean {
    // Simple heuristics to detect if text looks like code
    const codeIndicators = [
      /^\s*[{}[\]();,]/, // Starts with common code characters
      /[{}[\]();,]\s*$/, // Ends with common code characters
      /^\s*(use|fn|struct|enum|impl|mod|let|const|pub|extern)\s+/, // Rust keywords
      /^\s*\$/, // Shell prompt
      /^\s*\/\//, // Comments
      /^\s*#/, // Comments or shell
      /^\s*\[/, // TOML sections
    ];

    return codeIndicators.some(pattern => pattern.test(text));
  }

  private normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();
    
    const languageMap: Record<string, string> = {
      'rs': 'rust',
      'sh': 'bash',
      'shell': 'bash',
      'yml': 'yaml',
      'md': 'markdown',
      'dockerfile': 'docker',
    };

    return languageMap[normalized] || normalized;
  }

  private deduplicateExamples(examples: UsageExample[]): UsageExample[] {
    const seen = new Set<string>();
    const unique: UsageExample[] = [];

    for (const example of examples) {
      // Create a hash of the code content (normalize whitespace)
      const codeHash = example.code.replace(/\s+/g, ' ').trim();
      
      if (!seen.has(codeHash)) {
        seen.add(codeHash);
        unique.push(example);
      }
    }

    return unique;
  }

  cleanMarkdown(content: string): string {
    try {
      // Remove or replace common markdown elements that don't translate well
      let cleaned = content;

      // Remove badges (but keep the alt text if meaningful)
      cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_match, altText) => {
        return altText && altText.length > 3 ? altText : '';
      });

      // Convert relative links to absolute GitHub links (if we can detect the repo)
      // This is a simplified version - in practice, you'd want to pass repository info
      cleaned = cleaned.replace(/\[([^\]]+)\]\((?!https?:\/\/)([^)]+)\)/g, '$1');

      // Clean up excessive whitespace
      cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
      cleaned = cleaned.trim();

      return cleaned;
    } catch (error) {
      logger.warn('Failed to clean markdown content', { error });
      return content;
    }
  }

  extractDescription(content: string): string {
    try {
      // Look for the first substantial paragraph after any title
      const lines = content.split('\n');
      let foundDescription = false;
      let description = '';

      for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines and headers
        if (trimmed.length === 0 || trimmed.startsWith('#')) {
          if (foundDescription && description.length > 0) {
            break; // Stop at next section
          }
          continue;
        }

        // Skip badges and images
        if (trimmed.startsWith('![') || trimmed.startsWith('[![')) {
          continue;
        }

        // This looks like a description
        if (trimmed.length > 20) {
          if (!foundDescription) {
            description = trimmed;
            foundDescription = true;
          } else {
            // Add continuation if it's part of the same paragraph
            if (description.length + trimmed.length < 300) {
              description += ' ' + trimmed;
            } else {
              break;
            }
          }
        }
      }

      return description || 'No description available';
    } catch (error) {
      logger.warn('Failed to extract description from README', { error });
      return 'No description available';
    }
  }
}

export const readmeParser = new ReadmeParser();