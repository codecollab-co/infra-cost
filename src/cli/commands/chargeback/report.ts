import { getGlobalLogger } from '../../../core/logging';
export async function handleReport(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Generating chargeback report', options);
  console.log('Chargeback report - TO BE IMPLEMENTED');
}
