import { getGlobalLogger } from '../../../core/logging';
export async function handleAllocate(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Allocating costs', options);
  console.log('Cost allocation - TO BE IMPLEMENTED');
}
