/**
 * Cost Analyze Command Handler
 *
 * Handles: infra-cost cost analyze [options]
 */

import { getGlobalLogger } from '../../../core/logging';
import { CloudProviderFactory } from '../../../providers/factory';
import { generateEnhancedOutput, formatEnhancedSections } from '../../../core/enhanced-output';
import { printFancy } from '../../../exporters/formats/fancy';
import { printJson } from '../../../exporters/formats/json';
import { printPlainText } from '../../../exporters/formats/text';

interface AnalyzeOptions {
  startDate?: string;
  endDate?: string;
  showDelta?: boolean;
  showQuickWins?: boolean;
  deltaThreshold?: string;
  groupBy?: string;
  provider?: string;
  profile?: string;
  region?: string;
  output?: string;
  [key: string]: any;
}

/**
 * Handle cost analyze command
 */
export async function handleAnalyze(options: AnalyzeOptions, command: any): Promise<void> {
  const logger = getGlobalLogger();
  logger.info('Analyzing cloud costs', { provider: options.provider });

  try {
    // Get global options from parent command
    const globalOpts = command.parent?.opts() || {};
    const mergedOpts = { ...globalOpts, ...options };

    // Create cloud provider
    const factory = new CloudProviderFactory();
    const provider = factory.createProvider({
      provider: mergedOpts.provider || 'aws',
      profile: mergedOpts.profile,
      region: mergedOpts.region,
      credentials: {
        accessKeyId: mergedOpts.accessKey,
        secretAccessKey: mergedOpts.secretKey,
        sessionToken: mergedOpts.sessionToken,
      },
    });

    // Calculate date range
    const endDate = options.endDate ? new Date(options.endDate) : new Date();
    const startDate = options.startDate
      ? new Date(options.startDate)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    logger.debug('Fetching cost data', { startDate, endDate });

    // Fetch costs from provider
    // Note: getCostBreakdown() fetches the last 65 days of data internally
    // startDate/endDate parameters are noted but not currently supported by the provider interface
    const costs = await provider.getCostBreakdown();

    // Generate enhanced output with delta and quick wins
    const enhanced = generateEnhancedOutput(costs, undefined, {
      showDelta: options.showDelta !== false,
      showQuickWins: options.showQuickWins !== false,
      deltaThreshold: parseFloat(options.deltaThreshold || '10'),
      quickWinsCount: 3,
      colorOutput: mergedOpts.color !== false,
    });

    // Format output based on selected format
    const outputFormat = mergedOpts.output || 'fancy';

    switch (outputFormat) {
      case 'json':
        printJson({ costs: enhanced.costs, deltas: enhanced.deltas, quickWins: enhanced.quickWins });
        break;

      case 'text':
        printPlainText(mergedOpts.profile || 'default', costs, false);
        // Print enhanced sections
        console.log(formatEnhancedSections(enhanced, {
          showDelta: options.showDelta !== false,
          showQuickWins: options.showQuickWins !== false,
          deltaThreshold: parseFloat(options.deltaThreshold || '10'),
          quickWinsCount: 3,
          colorOutput: false,
        }));
        break;

      case 'fancy':
      default:
        printFancy(mergedOpts.profile || 'default', costs, false);
        // Print enhanced sections
        console.log(formatEnhancedSections(enhanced, {
          showDelta: options.showDelta !== false,
          showQuickWins: options.showQuickWins !== false,
          deltaThreshold: parseFloat(options.deltaThreshold || '10'),
          quickWinsCount: 3,
          colorOutput: mergedOpts.color !== false,
        }));
        break;
    }

    logger.info('Cost analysis complete');
  } catch (error) {
    logger.error('Cost analysis failed', { error });
    throw error;
  }
}
