/**
 * Annotate Command
 * Issue #54: Cost Annotations for IaC Files
 */

import { Command } from 'commander';
import * as fs from 'fs/promises';
import * as path from 'path';
import chalk from 'chalk';

interface AnnotateOptions {
  path: string;
  format?: 'terraform' | 'cloudformation' | 'auto';
  dryRun?: boolean;
  remove?: boolean;
  update?: boolean;
}

interface ResourceCost {
  resourceType: string;
  resourceName: string;
  monthlyCost: number;
  region: string;
  suggestion?: string;
  savingsPotential?: number;
}

/**
 * Register annotate command
 */
export function registerAnnotateCommand(program: Command): void {
  program
    .command('annotate')
    .description('Add cost annotations to Infrastructure as Code files')
    .option('--path <path>', 'Path to IaC files or directory', './terraform')
    .option(
      '--format <format>',
      'IaC format (terraform, cloudformation, auto)',
      'auto'
    )
    .option('--dry-run', 'Show what would be annotated without modifying files')
    .option('--remove', 'Remove existing cost annotations')
    .option('--update', 'Update existing cost annotations')
    .action(async (options: AnnotateOptions) => {
      try {
        await handleAnnotate(options);
      } catch (error: any) {
        console.error(chalk.red('Error:'), error.message);
        process.exit(1);
      }
    });
}

/**
 * Handle annotate command
 */
async function handleAnnotate(options: AnnotateOptions): Promise<void> {

  // Resolve path
  const targetPath = path.resolve(options.path);

  // Check if path exists
  try {
    await fs.access(targetPath);
  } catch (error) {
    throw new Error(`Path not found: ${targetPath}`);
  }

  // Get files to annotate
  const files = await findIaCFiles(targetPath, options.format);

  if (files.length === 0) {
    console.log(chalk.yellow('No IaC files found at:', targetPath));
    return;
  }

  console.log(chalk.cyan(`Found ${files.length} file(s) to annotate`));
  console.log();

  let annotatedCount = 0;
  let skippedCount = 0;

  for (const file of files) {
    const result = await annotateFile(file, options);
    if (result.annotated) {
      annotatedCount++;
      console.log(
        chalk.green('✓'),
        path.relative(process.cwd(), file),
        chalk.dim(`(${result.resourcesAnnotated} resources)`)
      );
    } else {
      skippedCount++;
      console.log(
        chalk.yellow('⊘'),
        path.relative(process.cwd(), file),
        chalk.dim('(no changes)')
      );
    }
  }

  console.log();
  console.log(
    chalk.bold('Summary:'),
    chalk.green(`${annotatedCount} annotated`),
    chalk.yellow(`${skippedCount} skipped`)
  );

  if (options.dryRun) {
    console.log();
    console.log(chalk.yellow('ℹ Dry run - no files were modified'));
    console.log(chalk.dim('Run without --dry-run to apply changes'));
  }
}

/**
 * Find IaC files in directory
 */
async function findIaCFiles(
  targetPath: string,
  format: string
): Promise<string[]> {
  const stats = await fs.stat(targetPath);

  if (stats.isFile()) {
    return [targetPath];
  }

  // Read directory recursively
  const files: string[] = [];
  const entries = await fs.readdir(targetPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(targetPath, entry.name);

    if (entry.isDirectory()) {
      // Skip common directories
      if (
        entry.name === 'node_modules' ||
        entry.name === '.git' ||
        entry.name === '.terraform'
      ) {
        continue;
      }
      files.push(...(await findIaCFiles(fullPath, format)));
    } else if (entry.isFile()) {
      if (shouldAnnotateFile(entry.name, format)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

/**
 * Check if file should be annotated
 */
function shouldAnnotateFile(filename: string, format: string): boolean {
  if (format === 'terraform' || format === 'auto') {
    if (filename.endsWith('.tf') || filename.endsWith('.tf.json')) {
      return true;
    }
  }

  if (format === 'cloudformation' || format === 'auto') {
    if (
      filename.endsWith('.yaml') ||
      filename.endsWith('.yml') ||
      filename.endsWith('.template')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Annotate a single file
 */
async function annotateFile(
  filePath: string,
  options: AnnotateOptions
): Promise<{ annotated: boolean; resourcesAnnotated: number }> {
  const content = await fs.readFile(filePath, 'utf-8');

  // Detect file format
  const isTerraform = filePath.endsWith('.tf') || filePath.endsWith('.tf.json');
  const isCloudFormation =
    filePath.endsWith('.yaml') ||
    filePath.endsWith('.yml') ||
    filePath.endsWith('.template');

  if (options.remove) {
    // Remove annotations
    const cleaned = removeAnnotations(content);
    if (cleaned !== content && !options.dryRun) {
      await fs.writeFile(filePath, cleaned, 'utf-8');
    }
    return {
      annotated: cleaned !== content,
      resourcesAnnotated: 0,
    };
  }

  // Parse and annotate resources
  let annotatedContent: string;
  let resourcesAnnotated = 0;

  if (isTerraform) {
    const result = annotateTerraform(content, options);
    annotatedContent = result.content;
    resourcesAnnotated = result.count;
  } else if (isCloudFormation) {
    const result = annotateCloudFormation(content, options);
    annotatedContent = result.content;
    resourcesAnnotated = result.count;
  } else {
    return { annotated: false, resourcesAnnotated: 0 };
  }

  // Write back to file
  if (annotatedContent !== content && !options.dryRun) {
    await fs.writeFile(filePath, annotatedContent, 'utf-8');
  }

  return {
    annotated: annotatedContent !== content,
    resourcesAnnotated,
  };
}

/**
 * Remove cost annotations from content
 */
function removeAnnotations(content: string): string {
  // Remove lines starting with # 💰, # 💡, # 📊, # ⚠️
  const lines = content.split('\n');
  const filtered = lines.filter(
    (line) =>
      !line.trim().startsWith('# 💰') &&
      !line.trim().startsWith('# 💡') &&
      !line.trim().startsWith('# 📊') &&
      !line.trim().startsWith('# ⚠️')
  );
  return filtered.join('\n');
}

/**
 * Annotate Terraform file
 */
function annotateTerraform(
  content: string,
  options: AnnotateOptions
): { content: string; count: number } {
  const lines = content.split('\n');
  const result: string[] = [];
  let resourceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match resource blocks: resource "aws_instance" "web" {
    const resourceMatch = line.match(/^resource\s+"([^"]+)"\s+"([^"]+)"\s+\{/);

    if (resourceMatch) {
      const resourceType = resourceMatch[1];
      const resourceName = resourceMatch[2];

      // Check if already annotated (unless updating)
      const prevLine = i > 0 ? lines[i - 1] : '';
      const alreadyAnnotated = prevLine.trim().startsWith('# 💰');

      if (!alreadyAnnotated || options.update) {
        // Remove old annotation if updating
        if (alreadyAnnotated && options.update) {
          result.pop(); // Remove previous annotation line
          // Remove additional annotation lines
          while (
            result.length > 0 &&
            result[result.length - 1].trim().startsWith('#')
          ) {
            result.pop();
          }
        }

        // Get cost estimate
        const cost = estimateResourceCost(resourceType, resourceName);

        // Add annotation
        const indent = line.match(/^\s*/)?.[0] || '';
        result.push(
          `${indent}# 💰 infra-cost: $${cost.monthlyCost.toFixed(2)}/month | ${resourceType} @ ${cost.region}`
        );

        if (cost.suggestion) {
          result.push(
            `${indent}# 💡 ${cost.suggestion}${cost.savingsPotential ? ` (saves $${cost.savingsPotential.toFixed(2)}/month)` : ''}`
          );
        }

        result.push(
          `${indent}# 📊 Last updated: ${new Date().toISOString().split('T')[0]}`
        );

        resourceCount++;
      }
    }

    result.push(line);
  }

  return {
    content: result.join('\n'),
    count: resourceCount,
  };
}

/**
 * Annotate CloudFormation file
 */
function annotateCloudFormation(
  content: string,
  options: AnnotateOptions
): { content: string; count: number } {
  const lines = content.split('\n');
  const result: string[] = [];
  let resourceCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Match CloudFormation resource: Type: AWS::EC2::Instance
    const typeMatch = line.match(/^\s+Type:\s+(AWS::[^\s]+)/);

    if (typeMatch) {
      const resourceType = typeMatch[1];

      // Check if already annotated
      const prevLine = i > 0 ? lines[i - 1] : '';
      const alreadyAnnotated = prevLine.trim().startsWith('# 💰');

      if (!alreadyAnnotated || options.update) {
        if (alreadyAnnotated && options.update) {
          result.pop();
          while (
            result.length > 0 &&
            result[result.length - 1].trim().startsWith('#')
          ) {
            result.pop();
          }
        }

        const cost = estimateResourceCost(resourceType, 'resource');
        const indent = line.match(/^\s*/)?.[0] || '';

        result.push(
          `${indent}# 💰 infra-cost: $${cost.monthlyCost.toFixed(2)}/month | ${resourceType} @ ${cost.region}`
        );

        if (cost.suggestion) {
          result.push(`${indent}# 💡 ${cost.suggestion}`);
        }

        resourceCount++;
      }
    }

    result.push(line);
  }

  return {
    content: result.join('\n'),
    count: resourceCount,
  };
}

/**
 * Estimate resource cost (simplified for demo)
 */
function estimateResourceCost(
  resourceType: string,
  resourceName: string
): ResourceCost {
  // Simplified cost estimation - in production, this would query actual pricing
  const costs: { [key: string]: Partial<ResourceCost> } = {
    aws_instance: {
      monthlyCost: 121.47,
      suggestion: 'Consider t3.large for 50% savings if CPU < 40%',
      savingsPotential: 60.74,
    },
    't3.xlarge': {
      monthlyCost: 121.47,
      suggestion: 'Consider t3.large for 50% savings',
      savingsPotential: 60.74,
    },
    aws_db_instance: {
      monthlyCost: 172.8,
      suggestion: 'Consider reserved instances for 40% savings',
      savingsPotential: 69.12,
    },
    aws_s3_bucket: {
      monthlyCost: 23.0,
    },
    aws_lambda_function: {
      monthlyCost: 12.5,
    },
    aws_nat_gateway: {
      monthlyCost: 32.4,
      suggestion: 'Consider NAT instances for dev environments',
      savingsPotential: 20.0,
    },
    'AWS::EC2::Instance': {
      monthlyCost: 121.47,
      suggestion: 'Consider smaller instance type',
      savingsPotential: 60.74,
    },
    'AWS::RDS::DBInstance': {
      monthlyCost: 172.8,
      suggestion: 'Consider reserved instances',
      savingsPotential: 69.12,
    },
  };

  const estimate = costs[resourceType] || { monthlyCost: 50.0 };

  return {
    resourceType,
    resourceName,
    monthlyCost: estimate.monthlyCost || 50.0,
    region: 'us-east-1',
    suggestion: estimate.suggestion,
    savingsPotential: estimate.savingsPotential,
  };
}
