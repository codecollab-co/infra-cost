/**
 * Tests for ask/chat commands
 * Issue #44: Natural Language Cost Queries
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';

describe('Ask Commands', () => {
  const CLI_PATH = './bin/index.js';

  describe('ask command', () => {
    it('should have ask command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('ask');
    });

    it('should show help for ask command', () => {
      const output = execSync(`${CLI_PATH} ask --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('natural language');
      expect(output).toContain('question');
    });

    it('should have chat command available', () => {
      const output = execSync(`${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('chat');
    });

    it('should show help for chat command', () => {
      const output = execSync(`${CLI_PATH} chat --help`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('Interactive');
      expect(output).toContain('chat');
    });
  });

  describe('query parser module', () => {
    it('should export QueryParser class', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      expect(typeof QueryParser).toBe('function');
    });

    it('should parse cost lookup queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse("what's my EC2 spend this month?");
      expect(result.type).toBe('costLookup');
      expect(result.service).toBe('EC2');
      expect(result.timeframe).toContain('month');
    });

    it('should parse comparison queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse('compare production vs staging');
      expect(result.type).toBe('comparison');
      expect(result.comparison).toBeDefined();
      expect(result.comparison?.a).toBe('production');
      expect(result.comparison?.b).toBe('staging');
    });

    it('should parse trend queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse('what increased the most?');
      expect(result.type).toBe('trend');
    });

    it('should parse forecast queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse('what will my bill be at month end?');
      expect(result.type).toBe('forecast');
    });

    it('should parse recommendation queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse('how can I save money?');
      expect(result.type).toBe('recommendation');
    });

    it('should parse anomaly queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse('why did my costs go up yesterday?');
      expect(result.type).toBe('anomaly');
    });

    it('should detect unknown queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const result = parser.parse('random gibberish xyz123');
      expect(result.type).toBe('unknown');
      expect(result.confidence).toBe(0);
    });

    it('should extract services from queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const ec2Query = parser.parse("what's my EC2 cost?");
      expect(ec2Query.service).toBe('EC2');

      const rdsQuery = parser.parse('show me RDS spending');
      expect(rdsQuery.service).toBe('RDS');

      const s3Query = parser.parse('how much am I spending on S3?');
      expect(s3Query.service).toBe('S3');
    });

    it('should handle queries with timeframes', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      // Query should be recognized even if timeframe extraction varies
      const query = parser.parse("what's my EC2 spend this month?");
      expect(query.type).toBeDefined();
      expect(query.confidence).toBeGreaterThan(0);
    });

    it('should suggest example queries', async () => {
      const { QueryParser } = await import('../../../src/core/nlp/query-parser');
      const parser = new QueryParser();

      const suggestions = parser.suggestQueries();
      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('query executor module', () => {
    it('should export QueryExecutor class', async () => {
      const { QueryExecutor } = await import('../../../src/core/nlp/query-executor');
      expect(typeof QueryExecutor).toBe('function');
    });
  });
});
