import { getGlobalLogger } from '../../../core/logging';
export async function handleBudgets(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Managing budgets', options);
  console.log('Budget management - TO BE IMPLEMENTED');
}
