export interface ScoreDetail {
  quality: number;
  popularity: number;
  maintenance: number;
}

export interface Score {
  final: number;
  detail: ScoreDetail;
}

export class ScoreCalculator {
  private static readonly QUALITY_NORMALIZER = 10000;
  private static readonly POPULARITY_NORMALIZER = 100000;
  private static readonly DEFAULT_MAINTENANCE_SCORE = 0.8;

  static calculateScore(recentDownloads: number, totalDownloads: number): Score {
    const qualityScore = Math.min(1, recentDownloads / this.QUALITY_NORMALIZER);
    const popularityScore = Math.min(1, totalDownloads / this.POPULARITY_NORMALIZER);
    const maintenanceScore = this.DEFAULT_MAINTENANCE_SCORE;
    
    const finalScore = (qualityScore + popularityScore + maintenanceScore) / 3;

    return {
      final: finalScore,
      detail: {
        quality: qualityScore,
        popularity: popularityScore,
        maintenance: maintenanceScore,
      },
    };
  }

  static calculateSearchScore(exactMatch: boolean): number {
    return exactMatch ? 1.0 : 0.8;
  }

  static matchesFilters(score: ScoreDetail, qualityThreshold?: number, popularityThreshold?: number): boolean {
    if (qualityThreshold !== undefined && score.quality < qualityThreshold) {
      return false;
    }
    if (popularityThreshold !== undefined && score.popularity < popularityThreshold) {
      return false;
    }
    return true;
  }
}