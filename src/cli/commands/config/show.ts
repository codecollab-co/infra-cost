import { getGlobalLogger } from '../../../core/logging';
export async function handleShow(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Showing configuration', options);
  console.log('Config display - TO BE IMPLEMENTED');
}
