/**
 * Tests for scorecard commands
 * Issue #59: FinOps Scorecards (Team Performance Metrics)
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Scorecard Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('scorecard command', () => {
    it('should have scorecard command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('scorecard');
    });

    it('should show help for scorecard command', () => {
      const output = execSync(`${CLI_PATH} scorecard --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('FinOps');
      expect(output).toContain('performance');
    });

    it('should have show subcommand', () => {
      const output = execSync(`${CLI_PATH} scorecard --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('show');
    });

    it('should have leaderboard subcommand', () => {
      const output = execSync(`${CLI_PATH} scorecard --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('leaderboard');
    });
  });

  describe('scorecard show command', () => {
    it('should support --team option', () => {
      const output = execSync(`${CLI_PATH} scorecard show --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('--team');
    });
  });

  describe('scorecard module', () => {
    it('should export buildTeamScorecard function', async () => {
      const { buildTeamScorecard } = await import('../../../src/core/scorecard');
      expect(typeof buildTeamScorecard).toBe('function');
    });

    it('should export generateLeaderboard function', async () => {
      const { generateLeaderboard } = await import('../../../src/core/scorecard');
      expect(typeof generateLeaderboard).toBe('function');
    });

    it('should export calculateCategoryScore function', async () => {
      const { calculateCategoryScore } = await import('../../../src/core/scorecard');
      expect(typeof calculateCategoryScore).toBe('function');
    });

    it('should export calculateGrade function', async () => {
      const { calculateGrade } = await import('../../../src/core/scorecard');
      expect(typeof calculateGrade).toBe('function');
    });

    it('should export DEFAULT_SCORECARD_CONFIG', async () => {
      const { DEFAULT_SCORECARD_CONFIG } = await import('../../../src/core/scorecard');
      expect(DEFAULT_SCORECARD_CONFIG).toBeDefined();
      expect(DEFAULT_SCORECARD_CONFIG.categories).toBeDefined();
      expect(DEFAULT_SCORECARD_CONFIG.gradingScale).toBeDefined();
    });

    it('should calculate category score correctly', async () => {
      const { calculateCategoryScore } = await import('../../../src/core/scorecard');
      const result = calculateCategoryScore(90, 90, 25, false);
      expect(result.score).toBe(25);
      expect(result.status).toBe('excellent');
    });

    it('should calculate grade correctly', async () => {
      const { calculateGrade, DEFAULT_SCORECARD_CONFIG } = await import('../../../src/core/scorecard');
      expect(calculateGrade(95, DEFAULT_SCORECARD_CONFIG)).toBe('A');
      expect(calculateGrade(85, DEFAULT_SCORECARD_CONFIG)).toBe('B+');
      expect(calculateGrade(75, DEFAULT_SCORECARD_CONFIG)).toBe('C+');
      expect(calculateGrade(65, DEFAULT_SCORECARD_CONFIG)).toBe('D');
      expect(calculateGrade(50, DEFAULT_SCORECARD_CONFIG)).toBe('F');
    });

    it('should build team scorecard with all categories', async () => {
      const { buildTeamScorecard } = await import('../../../src/core/scorecard');
      const metrics = {
        budgetUsage: 85,
        costTrend: -5,
        taggingCompliance: 92,
        reservedCoverage: 65,
        wastePercentage: 22,
        optimizationsActed: 4,
        totalOptimizations: 5,
      };
      const scorecard = buildTeamScorecard('Test Team', metrics);

      expect(scorecard.teamName).toBe('Test Team');
      expect(scorecard.totalScore).toBeGreaterThan(0);
      expect(scorecard.grade).toBeDefined();
      expect(scorecard.categories).toHaveLength(6);
      expect(scorecard.quickWins).toBeDefined();
    });

    it('should generate leaderboard correctly', async () => {
      const { buildTeamScorecard, generateLeaderboard } = await import('../../../src/core/scorecard');

      const scorecards = [
        buildTeamScorecard('Team A', {
          budgetUsage: 85,
          costTrend: -5,
          taggingCompliance: 92,
          reservedCoverage: 65,
          wastePercentage: 22,
          optimizationsActed: 4,
          totalOptimizations: 5,
        }),
        buildTeamScorecard('Team B', {
          budgetUsage: 90,
          costTrend: 2,
          taggingCompliance: 85,
          reservedCoverage: 60,
          wastePercentage: 25,
          optimizationsActed: 3,
          totalOptimizations: 5,
        }),
      ];

      const leaderboard = generateLeaderboard(scorecards);
      expect(leaderboard).toHaveLength(2);
      expect(leaderboard[0].rank).toBe(1);
      expect(leaderboard[1].rank).toBe(2);
      expect(leaderboard[0].score).toBeGreaterThanOrEqual(leaderboard[1].score);
    });
  });
});
