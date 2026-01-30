/**
 * Tests for GitHub Action integration
 * Issue #46: GitHub Actions Integration
 */

import { describe, it, expect } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as yaml from 'yaml';

describe('GitHub Action Integration', () => {
  const ACTION_PATH = join(process.cwd(), 'action.yml');
  let actionConfig: any;

  beforeAll(() => {
    const actionContent = readFileSync(ACTION_PATH, 'utf-8');
    // Parse YAML without yaml library to avoid dependency
    actionConfig = actionContent;
  });

  describe('action.yml structure', () => {
    it('should exist and be readable', () => {
      expect(actionConfig).toBeTruthy();
      expect(actionConfig.length).toBeGreaterThan(0);
    });

    it('should have required metadata', () => {
      expect(actionConfig).toContain('name:');
      expect(actionConfig).toContain('description:');
      expect(actionConfig).toContain('author:');
    });

    it('should have branding configuration', () => {
      expect(actionConfig).toContain('branding:');
      expect(actionConfig).toContain('icon:');
      expect(actionConfig).toContain('color:');
    });

    it('should define inputs', () => {
      expect(actionConfig).toContain('inputs:');
    });

    it('should define outputs', () => {
      expect(actionConfig).toContain('outputs:');
    });

    it('should define composite runs', () => {
      expect(actionConfig).toContain('runs:');
      expect(actionConfig).toContain("using: 'composite'");
    });
  });

  describe('inputs configuration', () => {
    it('should have provider input with default', () => {
      expect(actionConfig).toContain('provider:');
      expect(actionConfig).toContain("default: 'aws'");
    });

    it('should have command input for new subcommand structure', () => {
      expect(actionConfig).toContain('command:');
      expect(actionConfig).toContain('now');
      expect(actionConfig).toContain('free-tier');
      expect(actionConfig).toContain('annotate');
    });

    it('should have subcommand input', () => {
      expect(actionConfig).toContain('subcommand:');
    });

    it('should have cost gate inputs', () => {
      expect(actionConfig).toContain('fail-on-increase:');
      expect(actionConfig).toContain('cost-threshold:');
      expect(actionConfig).toContain('fail-on-threshold:');
    });

    it('should have cloud provider credential inputs', () => {
      expect(actionConfig).toContain('aws-access-key-id:');
      expect(actionConfig).toContain('aws-secret-access-key:');
      expect(actionConfig).toContain('gcp-project-id:');
      expect(actionConfig).toContain('azure-subscription-id:');
    });

    it('should have notification inputs', () => {
      expect(actionConfig).toContain('slack-webhook:');
      expect(actionConfig).toContain('comment-on-pr:');
    });

    it('should have output format input', () => {
      expect(actionConfig).toContain('output-format:');
    });
  });

  describe('outputs configuration', () => {
    it('should have cost metric outputs', () => {
      expect(actionConfig).toContain('today-cost:');
      expect(actionConfig).toContain('mtd-cost:');
      expect(actionConfig).toContain('ytd-cost:');
      expect(actionConfig).toContain('total-cost:');
    });

    it('should have cost change outputs', () => {
      expect(actionConfig).toContain('cost-change:');
      expect(actionConfig).toContain('cost-change-percent:');
    });

    it('should have optimization outputs', () => {
      expect(actionConfig).toContain('optimization-savings:');
      expect(actionConfig).toContain('free-tier-usage:');
    });

    it('should have status outputs', () => {
      expect(actionConfig).toContain('exit-code:');
      expect(actionConfig).toContain('threshold-exceeded:');
    });

    it('should have report output', () => {
      expect(actionConfig).toContain('report-json:');
    });
  });

  describe('workflow steps', () => {
    it('should setup Node.js 20', () => {
      expect(actionConfig).toContain('Setup Node.js');
      expect(actionConfig).toContain('actions/setup-node@v4');
      expect(actionConfig).toContain("node-version: '20'");
    });

    it('should install infra-cost from npm', () => {
      expect(actionConfig).toContain('Install infra-cost');
      expect(actionConfig).toContain('npm install -g infra-cost');
    });

    it('should run cost analysis', () => {
      expect(actionConfig).toContain('Run Cost Analysis');
      expect(actionConfig).toContain('infra-cost');
    });

    it('should use new command structure', () => {
      expect(actionConfig).toContain('${{ inputs.command }}');
      expect(actionConfig).toContain('${{ inputs.subcommand }}');
    });

    it('should set environment variables for credentials', () => {
      expect(actionConfig).toContain('AWS_ACCESS_KEY_ID:');
      expect(actionConfig).toContain('AWS_SECRET_ACCESS_KEY:');
      expect(actionConfig).toContain('GOOGLE_APPLICATION_CREDENTIALS:');
      expect(actionConfig).toContain('AZURE_SUBSCRIPTION_ID:');
    });

    it('should parse JSON output with jq', () => {
      expect(actionConfig).toContain('jq');
      expect(actionConfig).toContain('GITHUB_OUTPUT');
    });

    it('should implement cost gates', () => {
      expect(actionConfig).toContain('cost-threshold');
      expect(actionConfig).toContain('fail-on-increase');
      expect(actionConfig).toContain('THRESHOLD_EXCEEDED');
    });

    it('should comment on PR', () => {
      expect(actionConfig).toContain('Comment on PR');
      expect(actionConfig).toContain('actions/github-script@v7');
      expect(actionConfig).toContain('github.event_name');
    });

    it('should send Slack notifications', () => {
      expect(actionConfig).toContain('Send Slack Notification');
      expect(actionConfig).toContain('slack-webhook');
      expect(actionConfig).toContain('curl');
    });
  });

  describe('PR comment formatting', () => {
    it('should include cost summary table', () => {
      expect(actionConfig).toContain('Cost Summary');
      expect(actionConfig).toContain('today-cost');
      expect(actionConfig).toContain('mtd-cost');
    });

    it('should show cost changes with emojis', () => {
      expect(actionConfig).toContain('statusEmoji');
      expect(actionConfig).toContain('✅');
      expect(actionConfig).toContain('⚠️');
      expect(actionConfig).toContain('❌');
    });

    it('should include threshold warning', () => {
      expect(actionConfig).toContain('Cost Gate Failed');
      expect(actionConfig).toContain('threshold-exceeded');
    });

    it('should show configuration details', () => {
      expect(actionConfig).toContain('Configuration');
      expect(actionConfig).toContain('Provider');
      expect(actionConfig).toContain('Region');
    });

    it('should include full JSON report in details', () => {
      expect(actionConfig).toContain('Full Report');
      expect(actionConfig).toContain('report-json');
      expect(actionConfig).toContain('JSON.stringify');
    });
  });

  describe('cost gate logic', () => {
    it('should check cost threshold', () => {
      expect(actionConfig).toContain('Check cost gates');
      expect(actionConfig).toContain('THRESHOLD_EXCEEDED');
    });

    it('should fail when threshold exceeded', () => {
      expect(actionConfig).toContain('fail-on-threshold');
      expect(actionConfig).toContain('EXIT_CODE=1');
    });

    it('should detect cost increases', () => {
      expect(actionConfig).toContain('fail-on-increase');
      expect(actionConfig).toContain('costChange');
    });

    it('should output threshold status', () => {
      expect(actionConfig).toContain('threshold-exceeded=');
    });
  });
});
