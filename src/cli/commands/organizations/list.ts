import { getGlobalLogger } from '../../../core/logging';
export async function handleList(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Listing organization accounts', options);
  console.error('Organization account list is not implemented yet.');
  process.exitCode = 1;
}
