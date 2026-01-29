import { getGlobalLogger } from '../../../core/logging';
export async function handleSlack(options: any, command: any): Promise<void> {
  getGlobalLogger().info('Sending chargeback to Slack', options);
  console.log('Slack integration - TO BE IMPLEMENTED');
}
