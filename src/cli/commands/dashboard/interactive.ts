import { getGlobalLogger } from '../../../core/logging';
export async function handleInteractive(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Launching interactive dashboard', options);
  console.log('Interactive dashboard - TO BE IMPLEMENTED');
}
