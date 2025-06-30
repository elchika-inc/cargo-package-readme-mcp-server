export class SectionExtractor {
  private static readonly USAGE_SECTION_PATTERNS = [
    /^#{1,6}\s*(usage|use|using|how to use|getting started|quick start|examples?|basic usage)\s*$/gim,
    /^usage:?\s*$/gim,
    /^examples?:?\s*$/gim,
  ];

  extractUsageSections(content: string): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    let currentSection: string[] = [];
    let inUsageSection = false;
    let sectionLevel = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isHeader = line ? /^#{1,6}\s/.test(line) : false;
      
      if (isHeader && line) {
        const level = (line.match(/^#+/) || [''])[0].length;
        const isUsageHeader = this.isUsageHeader(line);

        if (isUsageHeader) {
          if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'));
          }
          currentSection = [line || ''];
          inUsageSection = true;
          sectionLevel = level;
        } else if (inUsageSection && level <= sectionLevel) {
          if (currentSection.length > 0) {
            sections.push(currentSection.join('\n'));
          }
          currentSection = [];
          inUsageSection = false;
        } else if (inUsageSection) {
          currentSection.push(line || '');
        }
      } else if (inUsageSection) {
        currentSection.push(line || '');
      }
    }

    if (currentSection.length > 0) {
      sections.push(currentSection.join('\n'));
    }

    return sections;
  }

  private isUsageHeader(line: string): boolean {
    return SectionExtractor.USAGE_SECTION_PATTERNS.some(pattern => {
      pattern.lastIndex = 0;
      return pattern.test(line);
    });
  }
}