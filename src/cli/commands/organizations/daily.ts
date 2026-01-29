import { getGlobalLogger } from '../../../core/logging';
export async function handleDaily(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Generating daily breakdown', options);
  console.log('Daily breakdown - TO BE IMPLEMENTED');
}
