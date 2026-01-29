import { getGlobalLogger } from '../../../core/logging';
export async function handleInit(path: string | undefined, options: any, command: any): Promise<void> {
  getGlobalLogger().info('Initializing configuration', { path, options });
  console.error('Config initialization is not implemented yet.');
  process.exitCode = 1;
}
