import { getGlobalLogger } from '../../../core/logging';
export async function handleReports(format: string, options: any, command: any): Promise<void> {
  getGlobalLogger().info('Exporting reports', { format, options });
  console.log(`Report export (${format}) - TO BE IMPLEMENTED`);
}
