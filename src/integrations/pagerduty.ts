/**
 * PagerDuty Integration
 * Issue #48: PagerDuty and OpsGenie Alert Integration
 *
 * Send cost alerts to PagerDuty using Events API v2
 */

import fetch from 'node-fetch';

export interface PagerDutyAlert {
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

export interface PagerDutyConfig {
  routingKey: string;
  severity?: 'critical' | 'error' | 'warning' | 'info';
  dedupKey?: string;
  component?: string;
}

/**
 * Send alert to PagerDuty
 */
export async function sendPagerDutyAlert(
  alert: PagerDutyAlert,
  config: PagerDutyConfig,
): Promise<void> {
  const { routingKey, severity = 'warning', dedupKey, component = 'cost-monitoring' } = config;

  const payload = {
    routing_key: routingKey,
    event_action: 'trigger',
    dedup_key: dedupKey || `infra-cost-${alert.accountId}-${new Date().toISOString().split('T')[0]}`,
    payload: {
      summary: `Cloud Cost Spike: +$${alert.increaseAmount.toFixed(2)} (+${alert.increasePercent.toFixed(1)}%) in ${alert.accountName}`,
      severity,
      source: 'infra-cost',
      component,
      group: alert.accountName,
      class: 'cost-anomaly',
      custom_details: {
        account_id: alert.accountId,
        account_name: alert.accountName,
        today_cost: `$${alert.todayCost.toFixed(2)}`,
        yesterday_cost: `$${alert.yesterdayCost.toFixed(2)}`,
        increase_amount: `$${alert.increaseAmount.toFixed(2)}`,
        increase_percent: `${alert.increasePercent.toFixed(1)}%`,
        top_service: alert.topService,
        top_service_increase: `+$${alert.topServiceIncrease.toFixed(2)}`,
        threshold: alert.threshold ? `${alert.threshold}%` : 'N/A',
      },
    },
    links: [
      {
        href: 'https://console.aws.amazon.com/cost-management',
        text: 'View in AWS Cost Explorer',
      },
    ],
  };

  try {
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PagerDuty API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    return result;
  } catch (error: any) {
    throw new Error(`Failed to send PagerDuty alert: ${error.message}`);
  }
}

/**
 * Resolve PagerDuty alert
 */
export async function resolvePagerDutyAlert(
  routingKey: string,
  dedupKey: string,
): Promise<void> {
  const payload = {
    routing_key: routingKey,
    event_action: 'resolve',
    dedup_key: dedupKey,
  };

  try {
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`PagerDuty API error: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to resolve PagerDuty alert: ${error.message}`);
  }
}
