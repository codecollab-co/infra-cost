import fetch from 'node-fetch';
import { TotalCosts } from '../../providers/aws/cost';

/**
 * Formats the costs by service for all time periods into a string
 *
 * @param costs Cost breakdown for account
 * @returns formatted message
 */
function formatServiceBreakdown(costs: TotalCosts): string {
  const serviceCosts = costs.totalsByService;

  // Get all services that have any costs across all periods
  const allServices = new Set([
    ...Object.keys(serviceCosts.lastMonth),
    ...Object.keys(serviceCosts.thisMonth),
    ...Object.keys(serviceCosts.last7Days),
    ...Object.keys(serviceCosts.yesterday)
  ]);

  // Sort services by yesterday's costs (descending), then alphabetically
  const sortedServices = Array.from(allServices).sort((a, b) => {
    const costDiff = (serviceCosts.yesterday[b] || 0) - (serviceCosts.yesterday[a] || 0);
    return costDiff !== 0 ? costDiff : a.localeCompare(b);
  });

  // Filter out services that have zero costs across all periods
  const servicesWithCosts = sortedServices.filter(service =>
    (serviceCosts.lastMonth[service] || 0) > 0 ||
    (serviceCosts.thisMonth[service] || 0) > 0 ||
    (serviceCosts.last7Days[service] || 0) > 0 ||
    (serviceCosts.yesterday[service] || 0) > 0
  );

  let breakdown = '';

  // Format service breakdown for each time period
  const periods = [
    { name: 'Last Month', data: serviceCosts.lastMonth },
    { name: 'This Month', data: serviceCosts.thisMonth },
    { name: 'Last 7 Days', data: serviceCosts.last7Days },
    { name: 'Yesterday', data: serviceCosts.yesterday }
  ];

  periods.forEach((period, index) => {
    const servicesForPeriod = servicesWithCosts.filter(service =>
      (period.data[service] || 0) > 0
    );

    if (servicesForPeriod.length > 0) {
      if (index > 0) breakdown += '\n';
      breakdown += `> *${period.name}:*\n`;

      servicesForPeriod.forEach(service => {
        const cost = period.data[service] || 0;
        breakdown += `> • ${service}: \`$${cost.toFixed(2)}\`\n`;
      });
    }
  });

  return breakdown;
}

export async function notifySlack(
  accountAlias: string,
  costs: TotalCosts,
  isSummary: boolean,
  slackToken: string,
  slackChannel: string
) {
  const channel = slackChannel;
  const totals = costs.totals;

  const summary = `> *Account: ${accountAlias}*

> *Summary*
> Total Last Month: \`$${totals.lastMonth.toFixed(2)}\`
> Total This Month: \`$${totals.thisMonth.toFixed(2)}\`
> Total Last 7 Days: \`$${totals.last7Days.toFixed(2)}\`
> Total Yesterday: \`$${totals.yesterday.toFixed(2)}\`
`;

  const breakdown = `
> *Breakdown by Service:*
${formatServiceBreakdown(costs)}
`;

  let message = `${summary}`;
  if (!isSummary) {
    message += `${breakdown}`;
  }

  // Slack Block Kit enforces 3000 character limit per section block
  const MAX_SECTION_LENGTH = 3000;
  if (message.length > MAX_SECTION_LENGTH) {
    const truncatedMessage = message.substring(0, MAX_SECTION_LENGTH - 50);
    message = truncatedMessage + '\n\n_...truncated (message too long)_';
  }

  const response = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'post',
    body: JSON.stringify({
      channel,
      text: `AWS Cost Report for ${accountAlias}`, // Fallback text for accessibility
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
      ],
    }),
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${slackToken}`,
    },
  });

  const data = (await response.json()) as { ok: boolean; error?: string };
  if (!data.ok) {
    const message = data.error || 'Unknown error';
    throw new Error(`Failed to send message to Slack: ${message}`);
  }

  console.log('\nSuccessfully sent message to Slack');
}
