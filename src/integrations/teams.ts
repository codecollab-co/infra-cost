/**
 * Microsoft Teams Integration
 * Issue #45: Microsoft Teams Integration
 *
 * Send cost reports to Microsoft Teams via Incoming Webhooks
 */

import fetch from 'node-fetch';

export interface TeamsCostData {
  todayCost: number;
  mtdCost: number;
  budget?: number;
  budgetPercent?: number;
  topServices: Array<{
    name: string;
    cost: number;
    change: number;
  }>;
  alerts?: string[];
  accountName?: string;
  provider?: string;
}

export interface TeamsConfig {
  webhook: string;
  cardStyle?: 'compact' | 'detailed' | 'executive';
  mentions?: string[];
}

interface AdaptiveCardElement {
  type: string;
  text?: string;
  weight?: string;
  size?: string;
  isSubtle?: boolean;
  wrap?: boolean;
  separator?: boolean;
  spacing?: string;
  columns?: Array<{ type: string; width: string; items: AdaptiveCardElement[] }>;
  items?: AdaptiveCardElement[];
  facts?: Array<{ title: string; value: string }>;
}

interface AdaptiveCardAction {
  type: string;
  title: string;
  url?: string;
}

interface AdaptiveCard {
  type: 'message';
  attachments: Array<{
    contentType: 'application/vnd.microsoft.card.adaptive';
    content: {
      type: 'AdaptiveCard';
      $schema: string;
      version: string;
      body: AdaptiveCardElement[];
      actions: AdaptiveCardAction[];
    };
  }>;
}

/**
 * Create Microsoft Teams Adaptive Card
 */
function createAdaptiveCard(data: TeamsCostData, style: string = 'detailed'): AdaptiveCard {
  const { todayCost, mtdCost, budget, budgetPercent, topServices, alerts, accountName, provider } = data;

  // Determine card color based on budget
  let color = 'good'; // green
  if (budgetPercent && budgetPercent > 90) {
    color = 'attention'; // red
  } else if (budgetPercent && budgetPercent > 75) {
    color = 'warning'; // yellow
  }

  const card: AdaptiveCard = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          type: 'AdaptiveCard',
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          version: '1.4',
          body: [],
          actions: [],
        },
      },
    ],
  };

  const body = card.attachments[0].content.body;

  // Header
  body.push({
    type: 'TextBlock',
    text: '💰 Daily Cost Report',
    weight: 'bolder',
    size: 'large',
  });

  if (accountName) {
    body.push({
      type: 'TextBlock',
      text: `${provider || 'Cloud'} Account: ${accountName}`,
      isSubtle: true,
      wrap: true,
    });
  }

  // Cost Summary
  const facts = [
    {
      title: 'Today\'s Cost',
      value: `$${todayCost.toFixed(2)}`,
    },
    {
      title: 'Month-to-Date',
      value: `$${mtdCost.toFixed(2)}`,
    },
  ];

  if (budget) {
    facts.push({
      title: 'Budget',
      value: `$${mtdCost.toFixed(2)} / $${budget.toFixed(2)} (${budgetPercent?.toFixed(0)}%)`,
    });
  }

  body.push({
    type: 'FactSet',
    facts,
  });

  // Top Services
  if (style === 'detailed' && topServices.length > 0) {
    body.push({
      type: 'TextBlock',
      text: 'Top Services',
      weight: 'bolder',
      wrap: true,
      spacing: 'medium',
    });

    topServices.forEach((service) => {
      const changeEmoji = service.change > 0 ? '↗' : service.change < 0 ? '↘' : '→';
      const changePercent = service.change > 0 ? `+${service.change}%` : `${service.change}%`;

      body.push({
        type: 'TextBlock',
        text: `• ${service.name}: $${service.cost.toFixed(2)} (${changeEmoji} ${changePercent})`,
        wrap: true,
      });
    });
  }

  // Alerts
  if (alerts && alerts.length > 0) {
    body.push({
      type: 'TextBlock',
      text: '⚠️ Alerts',
      weight: 'bolder',
      wrap: true,
      spacing: 'medium',
      color: 'attention',
    });

    alerts.forEach((alert) => {
      body.push({
        type: 'TextBlock',
        text: `• ${alert}`,
        wrap: true,
        color: 'attention',
      });
    });
  }

  // Actions
  card.attachments[0].content.actions = [
    {
      type: 'Action.OpenUrl',
      title: 'View Details',
      url: 'https://console.aws.amazon.com/cost-management',
    },
  ];

  return card;
}

/**
 * Send cost report to Microsoft Teams
 */
export async function sendTeamsReport(
  webhook: string,
  data: TeamsCostData,
  config: Partial<TeamsConfig> = {},
): Promise<void> {
  const { cardStyle = 'detailed', mentions = [] } = config;

  try {
    const card = createAdaptiveCard(data, cardStyle);

    // Add mentions if specified
    if (mentions.length > 0) {
      const mentionText = mentions.map((email) => `<at>${email}</at>`).join(' ');
      card.attachments[0].content.body.unshift({
        type: 'TextBlock',
        text: mentionText,
        wrap: true,
      });
    }

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Teams webhook failed: ${response.status} ${errorText}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to send Teams report: ${error.message}`);
  }
}

/**
 * Send simple text message to Teams
 */
export async function sendTeamsMessage(
  webhook: string,
  title: string,
  message: string,
): Promise<void> {
  try {
    const card = {
      type: 'message',
      attachments: [
        {
          contentType: 'application/vnd.microsoft.card.adaptive',
          content: {
            type: 'AdaptiveCard',
            $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
            version: '1.4',
            body: [
              {
                type: 'TextBlock',
                text: title,
                weight: 'bolder',
                size: 'large',
              },
              {
                type: 'TextBlock',
                text: message,
                wrap: true,
              },
            ],
          },
        },
      ],
    };

    const response = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card),
    });

    if (!response.ok) {
      throw new Error(`Teams webhook failed: ${response.status}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to send Teams message: ${error.message}`);
  }
}
