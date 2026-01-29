import { getGlobalLogger } from '../../../core/logging';
export async function handleCosts(format: string, options: any, command: any): Promise<void> {
  getGlobalLogger().info('Exporting costs', { format, options });
  console.log(`Cost export (${format}) - TO BE IMPLEMENTED`);
}
