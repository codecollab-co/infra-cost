import { getGlobalLogger } from '../../../core/logging';
export async function handleList(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Listing organization accounts', options);
  console.log('Organization account list - TO BE IMPLEMENTED');
}
