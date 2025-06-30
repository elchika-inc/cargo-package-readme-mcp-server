export class CodeAnalyzer {
  generateExampleTitle(code: string, language: string): string {
    const firstLine = (code.split('\n')[0] || '').trim();
    
    if (this.isShellLanguage(language)) {
      return this.getShellExampleTitle(firstLine);
    }

    if (this.isRustLanguage(language)) {
      return this.getRustExampleTitle(code, firstLine);
    }

    if (this.isConfigLanguage(language)) {
      if (language.toLowerCase() === 'json') {
        return 'JSON Configuration';
      }
      if (language.toLowerCase() === 'toml') {
        return 'Cargo.toml Configuration';
      }
      return 'Configuration';
    }

    return 'Code Example';
  }

  normalizeLanguage(language: string): string {
    const normalized = language.toLowerCase();
    
    switch (normalized) {
      case 'rs':
      case 'rust':
        return 'rust';
      case 'sh':
      case 'shell':
      case 'bash':
      case 'zsh':
        return 'bash';
      case 'yml':
        return 'yaml';
      case 'toml':
      case 'yaml':
      case 'json':
        return normalized;
      default:
        return 'text';
    }
  }

  private isShellLanguage(language: string): boolean {
    return ['bash', 'shell', 'sh', 'zsh'].includes(language.toLowerCase());
  }

  private isRustLanguage(language: string): boolean {
    return ['rust', 'rs'].includes(language.toLowerCase());
  }

  private isConfigLanguage(language: string): boolean {
    return ['toml', 'yaml', 'yml', 'json'].includes(language.toLowerCase());
  }

  private getShellExampleTitle(firstLine: string): string {
    if (firstLine.includes('cargo install') || firstLine.includes('cargo add')) {
      return 'Installation';
    }
    if (firstLine.includes('cargo run') || firstLine.includes('cargo build')) {
      return 'Build and Run';
    }
    return 'Command Line Usage';
  }

  private getRustExampleTitle(code: string, firstLine: string): string {
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
    if (code.includes('#[test]') || code.includes('assert!')) {
      return 'Test Example';
    }
    return 'Code Example';
  }
}