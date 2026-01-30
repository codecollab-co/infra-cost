/**
 * FinOps Scorecard System
 * Issue #59: FinOps Scorecards (Team Performance Metrics)
 */

export interface ScorecardCategory {
  name: string;
  weight: number; // Percentage
  target: number;
  currentValue: number;
  score: number; // Points earned
  maxScore: number; // Maximum possible points
  status: 'excellent' | 'good' | 'warning' | 'critical';
}

export interface TeamScorecard {
  teamName: string;
  totalScore: number;
  grade: string;
  trend: number; // Change from last period
  categories: ScorecardCategory[];
  quickWins: QuickWin[];
  badges: Badge[];
  monthlyHistory: MonthlyScore[];
}

export interface QuickWin {
  description: string;
  pointsGain: number;
  estimatedSavings?: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface Badge {
  name: string;
  emoji: string;
  description: string;
  awardedDate: string;
}

export interface MonthlyScore {
  month: string;
  score: number;
  grade: string;
}

export interface LeaderboardEntry {
  rank: number;
  teamName: string;
  score: number;
  grade: string;
  trend: number;
  savings: number;
}

export interface ScorecardConfig {
  enabled: boolean;
  categories: {
    budgetAdherence: { weight: number; target: number };
    costEfficiency: { weight: number; target: number };
    taggingCompliance: { weight: number; target: number };
    reservedCoverage: { weight: number; target: number };
    wasteElimination: { weight: number; target: number };
    optimizationActions: { weight: number; target: number };
  };
  gradingScale: {
    A: number;
    B: number;
    C: number;
    D: number;
  };
  notifications: {
    weekly: boolean;
    monthlyReport: boolean;
    awardBadges: boolean;
  };
}

export const DEFAULT_SCORECARD_CONFIG: ScorecardConfig = {
  enabled: true,
  categories: {
    budgetAdherence: { weight: 25, target: 80 },
    costEfficiency: { weight: 20, target: 0 },
    taggingCompliance: { weight: 15, target: 90 },
    reservedCoverage: { weight: 15, target: 70 },
    wasteElimination: { weight: 15, target: 80 },
    optimizationActions: { weight: 10, target: 80 },
  },
  gradingScale: {
    A: 90,
    B: 80,
    C: 70,
    D: 60,
  },
  notifications: {
    weekly: true,
    monthlyReport: true,
    awardBadges: true,
  },
};

/**
 * Calculate category score based on current value vs target
 */
export function calculateCategoryScore(
  currentValue: number,
  target: number,
  weight: number,
  isInverse: boolean = false
): { score: number; status: 'excellent' | 'good' | 'warning' | 'critical' } {
  const maxScore = weight;
  let performance: number;

  if (isInverse) {
    // For metrics like cost increase where lower is better
    performance = target === 0 ? (currentValue <= 0 ? 100 : 0) : Math.max(0, 100 - (currentValue / target) * 100);
  } else {
    // For metrics like tagging compliance where higher is better
    performance = (currentValue / target) * 100;
  }

  performance = Math.min(100, Math.max(0, performance));
  const score = (performance / 100) * maxScore;

  let status: 'excellent' | 'good' | 'warning' | 'critical';
  if (performance >= 95) status = 'excellent';
  else if (performance >= 80) status = 'good';
  else if (performance >= 60) status = 'warning';
  else status = 'critical';

  return { score, status };
}

/**
 * Calculate grade from total score
 */
export function calculateGrade(score: number, config: ScorecardConfig): string {
  if (score >= config.gradingScale.A) return 'A';
  if (score >= config.gradingScale.B) return 'B+';
  if (score >= config.gradingScale.C) return 'C+';
  if (score >= config.gradingScale.D) return 'D';
  return 'F';
}

/**
 * Generate quick wins based on current performance
 */
export function generateQuickWins(categories: ScorecardCategory[]): QuickWin[] {
  const quickWins: QuickWin[] = [];

  categories.forEach((category) => {
    if (category.status === 'warning' || category.status === 'critical') {
      const gap = category.target - category.currentValue;
      const potentialPoints = (gap / category.target) * category.maxScore;

      if (category.name === 'Reserved Coverage') {
        quickWins.push({
          description: `Increase RI coverage by ${gap.toFixed(0)}%`,
          pointsGain: Math.round(potentialPoints),
          estimatedSavings: gap * 100, // Rough estimate
          difficulty: 'medium',
        });
      } else if (category.name === 'Tagging Compliance') {
        const missingTags = Math.round((gap / 100) * 100); // Estimate number of resources
        quickWins.push({
          description: `Add missing tags to ~${missingTags} resources`,
          pointsGain: Math.round(potentialPoints),
          difficulty: 'easy',
        });
      } else if (category.name === 'Waste Elimination') {
        quickWins.push({
          description: `Clean up unused resources (${gap.toFixed(0)}% remaining)`,
          pointsGain: Math.round(potentialPoints),
          estimatedSavings: gap * 50,
          difficulty: 'easy',
        });
      }
    }
  });

  return quickWins.sort((a, b) => b.pointsGain - a.pointsGain).slice(0, 5);
}

/**
 * Check if team earned any badges
 */
export function checkBadges(scorecard: TeamScorecard, historicalData: MonthlyScore[]): Badge[] {
  const badges: Badge[] = [];
  const today = new Date().toISOString();

  // Budget Champion - Under budget for 3 consecutive months
  const budgetCategory = scorecard.categories.find((c) => c.name === 'Budget Adherence');
  if (budgetCategory && budgetCategory.currentValue >= budgetCategory.target) {
    const last3Months = historicalData.slice(-3);
    if (last3Months.length === 3 && last3Months.every((m) => m.score >= 80)) {
      badges.push({
        name: 'Budget Champion',
        emoji: '🏅',
        description: 'Under budget for 3 consecutive months',
        awardedDate: today,
      });
    }
  }

  // Tagging Star - 100% tagging compliance
  const taggingCategory = scorecard.categories.find((c) => c.name === 'Tagging Compliance');
  if (taggingCategory && taggingCategory.currentValue >= 100) {
    badges.push({
      name: 'Tagging Star',
      emoji: '⭐',
      description: '100% tagging compliance',
      awardedDate: today,
    });
  }

  // Green Team - Reduced costs 20% this quarter
  const costCategory = scorecard.categories.find((c) => c.name === 'Cost Efficiency');
  if (costCategory && costCategory.currentValue <= -20) {
    badges.push({
      name: 'Green Team',
      emoji: '🌱',
      description: 'Reduced costs 20% this quarter',
      awardedDate: today,
    });
  }

  // Efficiency Expert - Score above 90 for 6 months
  if (scorecard.totalScore >= 90) {
    const last6Months = historicalData.slice(-6);
    if (last6Months.length === 6 && last6Months.every((m) => m.score >= 90)) {
      badges.push({
        name: 'Efficiency Expert',
        emoji: '💎',
        description: 'Score above 90 for 6 months',
        awardedDate: today,
      });
    }
  }

  return badges;
}

/**
 * Build team scorecard from metrics
 */
export function buildTeamScorecard(
  teamName: string,
  metrics: {
    budgetUsage: number; // Percentage of budget used
    costTrend: number; // MoM percentage change
    taggingCompliance: number; // Percentage of resources tagged
    reservedCoverage: number; // Percentage on RI/SP
    wastePercentage: number; // Percentage of waste
    optimizationsActed: number; // Number of recommendations acted on
    totalOptimizations: number; // Total recommendations
  },
  config: ScorecardConfig = DEFAULT_SCORECARD_CONFIG,
  historicalData: MonthlyScore[] = []
): TeamScorecard {
  const categories: ScorecardCategory[] = [];

  // Budget Adherence (25%)
  const budgetTarget = config.categories.budgetAdherence.target;
  const budgetScore = calculateCategoryScore(
    Math.min(metrics.budgetUsage, 100),
    budgetTarget,
    config.categories.budgetAdherence.weight,
    false
  );
  categories.push({
    name: 'Budget Adherence',
    weight: config.categories.budgetAdherence.weight,
    target: budgetTarget,
    currentValue: metrics.budgetUsage,
    score: budgetScore.score,
    maxScore: config.categories.budgetAdherence.weight,
    status: budgetScore.status,
  });

  // Cost Efficiency (20%)
  const costEffScore = calculateCategoryScore(
    Math.abs(metrics.costTrend),
    Math.abs(config.categories.costEfficiency.target),
    config.categories.costEfficiency.weight,
    true
  );
  categories.push({
    name: 'Cost Efficiency',
    weight: config.categories.costEfficiency.weight,
    target: config.categories.costEfficiency.target,
    currentValue: metrics.costTrend,
    score: costEffScore.score,
    maxScore: config.categories.costEfficiency.weight,
    status: costEffScore.status,
  });

  // Tagging Compliance (15%)
  const taggingScore = calculateCategoryScore(
    metrics.taggingCompliance,
    config.categories.taggingCompliance.target,
    config.categories.taggingCompliance.weight
  );
  categories.push({
    name: 'Tagging Compliance',
    weight: config.categories.taggingCompliance.weight,
    target: config.categories.taggingCompliance.target,
    currentValue: metrics.taggingCompliance,
    score: taggingScore.score,
    maxScore: config.categories.taggingCompliance.weight,
    status: taggingScore.status,
  });

  // Reserved Coverage (15%)
  const reservedScore = calculateCategoryScore(
    metrics.reservedCoverage,
    config.categories.reservedCoverage.target,
    config.categories.reservedCoverage.weight
  );
  categories.push({
    name: 'Reserved Coverage',
    weight: config.categories.reservedCoverage.weight,
    target: config.categories.reservedCoverage.target,
    currentValue: metrics.reservedCoverage,
    score: reservedScore.score,
    maxScore: config.categories.reservedCoverage.weight,
    status: reservedScore.status,
  });

  // Waste Elimination (15%)
  const wasteScore = calculateCategoryScore(
    100 - metrics.wastePercentage,
    config.categories.wasteElimination.target,
    config.categories.wasteElimination.weight
  );
  categories.push({
    name: 'Waste Elimination',
    weight: config.categories.wasteElimination.weight,
    target: config.categories.wasteElimination.target,
    currentValue: 100 - metrics.wastePercentage,
    score: wasteScore.score,
    maxScore: config.categories.wasteElimination.weight,
    status: wasteScore.status,
  });

  // Optimization Actions (10%)
  const optActionsPercent = (metrics.optimizationsActed / Math.max(metrics.totalOptimizations, 1)) * 100;
  const optScore = calculateCategoryScore(
    optActionsPercent,
    config.categories.optimizationActions.target,
    config.categories.optimizationActions.weight
  );
  categories.push({
    name: 'Optimization Actions',
    weight: config.categories.optimizationActions.weight,
    target: config.categories.optimizationActions.target,
    currentValue: optActionsPercent,
    score: optScore.score,
    maxScore: config.categories.optimizationActions.weight,
    status: optScore.status,
  });

  // Calculate total score
  const totalScore = Math.round(categories.reduce((sum, cat) => sum + cat.score, 0));
  const grade = calculateGrade(totalScore, config);

  // Calculate trend
  const lastMonthScore = historicalData.length > 0 ? historicalData[historicalData.length - 1].score : totalScore;
  const trend = totalScore - lastMonthScore;

  // Generate quick wins
  const quickWins = generateQuickWins(categories);

  // Check badges
  const scorecard: TeamScorecard = {
    teamName,
    totalScore,
    grade,
    trend,
    categories,
    quickWins,
    badges: [],
    monthlyHistory: historicalData,
  };

  scorecard.badges = checkBadges(scorecard, historicalData);

  return scorecard;
}

/**
 * Generate organization leaderboard
 */
export function generateLeaderboard(scorecards: TeamScorecard[]): LeaderboardEntry[] {
  return scorecards
    .map((sc, index) => ({
      rank: index + 1,
      teamName: sc.teamName,
      score: sc.totalScore,
      grade: sc.grade,
      trend: sc.trend,
      savings: sc.quickWins.reduce((sum, qw) => sum + (qw.estimatedSavings || 0), 0),
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
