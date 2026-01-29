import { getGlobalLogger } from '../../../core/logging';
export async function handleInventory(format: string, options: any, command: any): Promise<void> {
  getGlobalLogger().info('Exporting inventory', { format, options });
  console.error(`Inventory export (${format}) is not implemented yet.`);
  process.exitCode = 1;
}
