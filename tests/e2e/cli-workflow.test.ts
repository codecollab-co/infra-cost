/**
 * End-to-End CLI Workflow Tests
 *
 * Tests complete user workflows from CLI invocation to output.
 * These tests verify the entire stack works together correctly.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('CLI Workflow E2E Tests', () => {
  const CLI_PATH = path.join(__dirname, '../../dist/cli/index.js');
  let tempDir: string;
  let configPath: string;
  let cliExists: boolean;

  beforeAll(() => {
    // Check if CLI is built
    cliExists = fs.existsSync(CLI_PATH);

    if (!cliExists) {
      console.warn('CLI not built. Some tests will be skipped. Run "npm run build" to enable all tests.');
    }

    // Create temporary directory for test artifacts
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'infra-cost-e2e-'));
    configPath = path.join(tempDir, 'config.json');
  });

  afterAll(() => {
    // Clean up temporary directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('CLI Help and Version', () => {
    it('should display help when --help flag is used', () => {
      const output = execSync(`node ${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('infra-cost');
      expect(output).toContain('Multi-cloud FinOps CLI');
    });

    it('should display version when --version flag is used', () => {
      const output = execSync(`node ${CLI_PATH} --version`, {
        encoding: 'utf-8',
      });

      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });

    it('should display help for cost command', () => {
      const output = execSync(`node ${CLI_PATH} cost --help`, {
        encoding: 'utf-8',
      });

      expect(output).toContain('cost');
      expect(output).toContain('analyze');
    });
  });

  describe('Configuration Management', () => {
    it('should initialize configuration file', () => {
      const output = execSync(
        `node ${CLI_PATH} config init --config-path ${configPath} --provider aws`,
        { encoding: 'utf-8' }
      );

      expect(fs.existsSync(configPath)).toBe(true);
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      expect(config.provider).toBe('aws');
    });

    it('should validate configuration file', () => {
      // Create a valid config
      const validConfig = {
        provider: 'aws',
        credentials: {
          profile: 'default',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2));

      const output = execSync(
        `node ${CLI_PATH} config validate --config-path ${configPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('valid') || expect(output).toContain('✓');
    });

    it('should show configuration details', () => {
      const config = {
        provider: 'aws',
        credentials: {
          profile: 'test-profile',
        },
        region: 'us-east-1',
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      const output = execSync(
        `node ${CLI_PATH} config show --config-path ${configPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('aws');
      expect(output).toContain('test-profile');
    });
  });

  describe('Provider Configuration', () => {
    it('should accept AWS provider with profile', () => {
      const config = {
        provider: 'aws',
        credentials: {
          profile: 'default',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // This should not throw
      execSync(`node ${CLI_PATH} config validate --config-path ${configPath}`, {
        encoding: 'utf-8',
      });
    });

    it('should accept GCP provider with project ID', () => {
      const config = {
        provider: 'gcp',
        credentials: {
          projectId: 'test-project',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      // This should not throw
      execSync(`node ${CLI_PATH} config validate --config-path ${configPath}`, {
        encoding: 'utf-8',
      });
    });

    it('should reject invalid provider', () => {
      const config = {
        provider: 'invalid-provider',
        credentials: {},
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

      expect(() => {
        execSync(`node ${CLI_PATH} config validate --config-path ${configPath}`, {
          encoding: 'utf-8',
        });
      }).toThrow();
    });
  });

  describe('Output Formats', () => {
    const testConfig = {
      provider: 'aws',
      credentials: {
        profile: 'default',
      },
    };

    beforeEach(() => {
      fs.writeFileSync(configPath, JSON.stringify(testConfig, null, 2));
    });

    it('should support JSON output format', () => {
      try {
        const output = execSync(
          `node ${CLI_PATH} cost analyze --config-path ${configPath} --output json --dry-run`,
          { encoding: 'utf-8' }
        );

        // Should be valid JSON or contain JSON structure indicators
        expect(output).toContain('{') || expect(output).toContain('json');
      } catch (error: any) {
        // Expected if credentials are not available
        expect(error.message).toContain('credentials') ||
          expect(error.message).toContain('AWS');
      }
    });

    it('should support fancy output format', () => {
      try {
        const output = execSync(
          `node ${CLI_PATH} cost analyze --config-path ${configPath} --output fancy --dry-run`,
          { encoding: 'utf-8' }
        );

        // Fancy output typically includes box-drawing characters or colors
        expect(typeof output).toBe('string');
      } catch (error: any) {
        // Expected if credentials are not available
        expect(error.message).toContain('credentials') ||
          expect(error.message).toContain('AWS');
      }
    });

    it('should support text output format', () => {
      try {
        const output = execSync(
          `node ${CLI_PATH} cost analyze --config-path ${configPath} --output text --dry-run`,
          { encoding: 'utf-8' }
        );

        expect(typeof output).toBe('string');
      } catch (error: any) {
        // Expected if credentials are not available
        expect(error.message).toContain('credentials') ||
          expect(error.message).toContain('AWS');
      }
    });
  });

  describe('Error Handling', () => {
    it('should show helpful error for missing config file', () => {
      const nonExistentConfig = path.join(tempDir, 'nonexistent.json');

      expect(() => {
        execSync(
          `node ${CLI_PATH} config show --config-path ${nonExistentConfig}`,
          { encoding: 'utf-8' }
        );
      }).toThrow();
    });

    it('should show helpful error for invalid JSON config', () => {
      const invalidConfigPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(invalidConfigPath, '{ invalid json }');

      expect(() => {
        execSync(
          `node ${CLI_PATH} config validate --config-path ${invalidConfigPath}`,
          { encoding: 'utf-8' }
        );
      }).toThrow();
    });

    it('should show helpful error for missing required fields', () => {
      const incompleteConfig = {
        provider: 'gcp',
        credentials: {}, // Missing projectId
      };
      fs.writeFileSync(configPath, JSON.stringify(incompleteConfig, null, 2));

      expect(() => {
        execSync(`node ${CLI_PATH} config validate --config-path ${configPath}`, {
          encoding: 'utf-8',
        });
      }).toThrow();
    });
  });

  describe('Command Chaining', () => {
    const validConfig = {
      provider: 'aws',
      credentials: {
        profile: 'default',
      },
    };

    beforeEach(() => {
      fs.writeFileSync(configPath, JSON.stringify(validConfig, null, 2));
    });

    it('should validate config before running commands', () => {
      // Create invalid config
      const invalidConfig = {
        provider: 'invalid',
        credentials: {},
      };
      fs.writeFileSync(configPath, JSON.stringify(invalidConfig, null, 2));

      expect(() => {
        execSync(
          `node ${CLI_PATH} cost analyze --config-path ${configPath}`,
          { encoding: 'utf-8', stdio: 'pipe' }
        );
      }).toThrow();
    });
  });

  describe('GCP Provider Workflows', () => {
    const gcpConfig = {
      provider: 'gcp',
      credentials: {
        projectId: 'test-project-123',
      },
    };

    beforeEach(() => {
      fs.writeFileSync(configPath, JSON.stringify(gcpConfig, null, 2));
    });

    it('should accept GCP single project configuration', () => {
      const output = execSync(
        `node ${CLI_PATH} config show --config-path ${configPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('gcp');
      expect(output).toContain('test-project-123');
    });

    it('should accept GCP multi-project configuration', () => {
      const multiProjectConfig = {
        provider: 'gcp',
        credentials: {
          projectId: 'main-project',
          projectIds: ['project-1', 'project-2', 'project-3'],
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(multiProjectConfig, null, 2));

      const output = execSync(
        `node ${CLI_PATH} config show --config-path ${configPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('gcp');
      expect(output).toContain('main-project');
    });

    it('should accept GCP organization configuration', () => {
      const orgConfig = {
        provider: 'gcp',
        credentials: {
          projectId: 'admin-project',
          organizationId: '123456789',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(orgConfig, null, 2));

      const output = execSync(
        `node ${CLI_PATH} config show --config-path ${configPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('gcp');
      expect(output).toContain('123456789');
    });
  });

  describe('AWS Provider Workflows', () => {
    it('should accept AWS profile configuration', () => {
      const awsConfig = {
        provider: 'aws',
        credentials: {
          profile: 'production',
        },
        region: 'us-west-2',
      };
      fs.writeFileSync(configPath, JSON.stringify(awsConfig, null, 2));

      const output = execSync(
        `node ${CLI_PATH} config show --config-path ${configPath}`,
        { encoding: 'utf-8' }
      );

      expect(output).toContain('aws');
      expect(output).toContain('production');
      expect(output).toContain('us-west-2');
    });

    it('should accept AWS with access keys (from env)', () => {
      const awsConfig = {
        provider: 'aws',
        credentials: {
          accessKeyId: '${AWS_ACCESS_KEY_ID}',
          secretAccessKey: '${AWS_SECRET_ACCESS_KEY}',
        },
      };
      fs.writeFileSync(configPath, JSON.stringify(awsConfig, null, 2));

      // Should not throw on validation
      execSync(`node ${CLI_PATH} config validate --config-path ${configPath}`, {
        encoding: 'utf-8',
      });
    });
  });

  describe('Exit Codes', () => {
    it('should exit with 0 on successful help display', () => {
      const result = execSync(`node ${CLI_PATH} --help`, {
        encoding: 'utf-8',
      });

      expect(result).toBeTruthy();
    });

    it('should exit with non-zero on invalid command', () => {
      expect(() => {
        execSync(`node ${CLI_PATH} invalid-command`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      }).toThrow();
    });

    it('should exit with non-zero on invalid config', () => {
      const invalidConfig = path.join(tempDir, 'invalid-syntax.json');
      fs.writeFileSync(invalidConfig, '{ bad json');

      expect(() => {
        execSync(`node ${CLI_PATH} config validate --config-path ${invalidConfig}`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
      }).toThrow();
    });
  });
});
