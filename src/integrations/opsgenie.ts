/**
 * OpsGenie Integration
 * Issue #48: PagerDuty and OpsGenie Alert Integration
 *
 * Send cost alerts to OpsGenie using Alert API
 */

import fetch from 'node-fetch';

export interface OpsGenieAlert {
  accountId: string;
  accountName: string;
  todayCost: number;
  yesterdayCost: number;
  increaseAmount: number;
  increasePercent: number;
  topService: string;
  topServiceIncrease: number;
  threshold?: number;
}

export interface OpsGenieConfig {
  apiKey: string;
  priority?: 'P1' | 'P2' | 'P3' | 'P4' | 'P5';
  tags?: string[];
  responders?: Array<{
    type: 'team' | 'user' | 'escalation' | 'schedule';
    name?: string;
    id?: string;
  }>;
  alias?: string;
}

/**
 * Send alert to OpsGenie
 */
export async function sendOpsGenieAlert(
  alert: OpsGenieAlert,
  config: OpsGenieConfig,
): Promise<void> {
  const { apiKey, priority = 'P3', tags = ['cost-alert', 'finops'], responders, alias } = config;

  const payload = {
    message: `Cloud Cost Spike: +$${alert.increaseAmount.toFixed(2)} (+${alert.increasePercent.toFixed(1)}%)`,
    alias: alias || `infra-cost-${alert.accountId}-${new Date().toISOString().split('T')[0]}`,
    description: `Cost increase detected in ${alert.accountName} account.\n\nToday: $${alert.todayCost.toFixed(2)}\nYesterday: $${alert.yesterdayCost.toFixed(2)}\nIncrease: +$${alert.increaseAmount.toFixed(2)} (+${alert.increasePercent.toFixed(1)}%)\n\nTop service: ${alert.topService} (+$${alert.topServiceIncrease.toFixed(2)})`,
    priority,
    tags,
    details: {
      account_id: alert.accountId,
      account_name: alert.accountName,
      today_cost: alert.todayCost.toFixed(2),
      yesterday_cost: alert.yesterdayCost.toFixed(2),
      increase_amount: alert.increaseAmount.toFixed(2),
      increase_percent: alert.increasePercent.toFixed(1),
      top_service: alert.topService,
      top_service_increase: alert.topServiceIncrease.toFixed(2),
      threshold: alert.threshold?.toString() || 'N/A',
    },
    responders,
  };

  try {
    const response = await fetch('https://api.opsgenie.com/v2/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `GenieKey ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpsGenie API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(`Failed to send OpsGenie alert: ${error.message}`);
  }
}

/**
 * Close OpsGenie alert
 */
export async function closeOpsGenieAlert(
  apiKey: string,
  alias: string,
): Promise<void> {
  try {
    const response = await fetch(
      `https://api.opsgenie.com/v2/alerts/${encodeURIComponent(alias)}/close?identifierType=alias`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `GenieKey ${apiKey}`,
        },
        body: JSON.stringify({
          note: 'Cost normalized - alert auto-resolved by infra-cost',
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpsGenie API error: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to close OpsGenie alert: ${error.message}`);
  }
}
