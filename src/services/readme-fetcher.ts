import { logger } from '../utils/logger.js';
import { cratesIoApi } from './crates-io-api.js';
import { githubApi } from './github-api.js';
import { readmeParser } from './readme-parser.js';

export interface ReadmeResult {
  content: string;
  source: 'crates.io' | 'github' | 'none';
}

export class ReadmeFetcher {
  async fetchReadme(packageName: string, version: string, repositoryUrl?: string): Promise<ReadmeResult> {
    let readmeContent = '';
    let readmeSource: 'crates.io' | 'github' | 'none' = 'none';

    // First, try to get README from crates.io
    const cratesIoReadme = await cratesIoApi.getReadmeContent(packageName, version);
    if (cratesIoReadme) {
      readmeContent = cratesIoReadme;
      readmeSource = 'crates.io';
      logger.debug(`Got README from crates.io: ${packageName}`);
    }
    // If no README from crates.io, try GitHub as fallback
    else if (repositoryUrl) {
      const githubReadme = await githubApi.getReadmeFromRepository(repositoryUrl);
      if (githubReadme) {
        readmeContent = githubReadme;
        readmeSource = 'github';
        logger.debug(`Got README from GitHub: ${packageName}`);
      }
    }

    return {
      content: readmeContent,
      source: readmeSource,
    };
  }

  cleanAndParseReadme(readmeContent: string, includeExamples: boolean) {
    const cleanedReadme = readmeParser.cleanMarkdown(readmeContent);
    const usageExamples = readmeParser.parseUsageExamples(readmeContent, includeExamples);

    return {
      cleanedReadme,
      usageExamples,
    };
  }
}

export const readmeFetcher = new ReadmeFetcher();