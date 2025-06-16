import { logger } from './logger.js';
import {
  PackageReadmeMcpError,
  PackageNotFoundError,
  RateLimitError,
  NetworkError,
} from '../types/index.js';

export function handleApiError(error: unknown, context: string): never {
  logger.error(`API error in ${context}`, { error });
  
  if (error instanceof PackageReadmeMcpError) {
    throw error;
  }
  
  if (error instanceof Error) {
    // Network/fetch errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new NetworkError(`Failed to connect to ${context}`, error);
    }
    
    // Timeout errors
    if (error.name === 'AbortError' || error.message.includes('timeout')) {
      throw new NetworkError(`Request timeout for ${context}`, error);
    }
    
    throw new PackageReadmeMcpError(
      `Unexpected error in ${context}: ${error.message}`,
      'UNEXPECTED_ERROR',
      undefined,
      error
    );
  }
  
  throw new PackageReadmeMcpError(
    `Unknown error in ${context}`,
    'UNKNOWN_ERROR',
    undefined,
    error
  );
}

export function handleHttpError(
  status: number,
  response: Response,
  context: string
): never {
  logger.error(`HTTP error ${status} in ${context}`, {
    status,
    statusText: response.statusText,
    url: response.url,
  });

  switch (status) {
    case 404:
      // Try to extract package name from context
      const packageMatch = context.match(/(?:crate|package)\s+([^\s]+)/);
      const packageName = packageMatch ? (packageMatch[1] || 'unknown') : 'unknown';
      throw new PackageNotFoundError(packageName);
      
    case 429:
      const retryAfter = response.headers.get('retry-after');
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;
      throw new RateLimitError(context || 'unknown', retryAfterSeconds);
      
    case 500:
    case 502:
    case 503:
    case 504:
      throw new NetworkError(`Server error (${status}) in ${context}`);
      
    default:
      throw new PackageReadmeMcpError(
        `HTTP ${status} error in ${context}`,
        'HTTP_ERROR',
        status
      );
  }
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  context: string = 'operation'
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry certain types of errors
      if (error instanceof PackageNotFoundError ||
          error instanceof PackageReadmeMcpError && 
          !isRetryableError(error)) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        logger.error(`All retry attempts failed for ${context}`, {
          attempts: maxRetries,
          lastError,
        });
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
      const jitter = Math.random() * 0.1 * delay; // Add some jitter
      const finalDelay = delay + jitter;
      
      logger.warn(`Attempt ${attempt} failed for ${context}, retrying in ${Math.round(finalDelay)}ms`, {
        error: lastError.message,
        nextAttempt: attempt + 1,
      });
      
      await sleep(finalDelay);
    }
  }
  
  throw lastError!;
}

function isRetryableError(error: PackageReadmeMcpError): boolean {
  const retryableCodes = [
    'NETWORK_ERROR',
    'RATE_LIMIT_EXCEEDED',
    'HTTP_ERROR',
  ];
  
  return retryableCodes.includes(error.code) || 
         (error.statusCode !== undefined && error.statusCode >= 500);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export class ErrorRecovery {
  private static readonly MAX_CONSECUTIVE_ERRORS = 5;
  private static readonly ERROR_RESET_TIME = 5 * 60 * 1000; // 5 minutes
  
  private errorCounts = new Map<string, { count: number; lastError: number }>();
  
  shouldCircuitBreak(context: string): boolean {
    const errorInfo = this.errorCounts.get(context);
    if (!errorInfo) {
      return false;
    }
    
    const now = Date.now();
    
    // Reset error count if enough time has passed
    if (now - errorInfo.lastError > ErrorRecovery.ERROR_RESET_TIME) {
      this.errorCounts.delete(context);
      return false;
    }
    
    return errorInfo.count >= ErrorRecovery.MAX_CONSECUTIVE_ERRORS;
  }
  
  recordError(context: string): void {
    const now = Date.now();
    const errorInfo = this.errorCounts.get(context);
    
    if (!errorInfo || now - errorInfo.lastError > ErrorRecovery.ERROR_RESET_TIME) {
      this.errorCounts.set(context, { count: 1, lastError: now });
    } else {
      errorInfo.count++;
      errorInfo.lastError = now;
    }
    
    if (errorInfo && errorInfo.count >= ErrorRecovery.MAX_CONSECUTIVE_ERRORS) {
      logger.warn(`Circuit breaker activated for ${context} after ${errorInfo.count} consecutive errors`);
    }
  }
  
  recordSuccess(context: string): void {
    this.errorCounts.delete(context);
  }
}

export const errorRecovery = new ErrorRecovery();