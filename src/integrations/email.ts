/**
 * Email Integration
 * Issue #58: Email Report Scheduling
 *
 * Send cost reports via email using various providers
 */

import fetch from 'node-fetch';

export interface EmailCostData {
  date: string;
  todayCost: number;
  mtdCost: number;
  budget?: number;
  budgetPercent?: number;
  projectedMonthEnd?: number;
  topServices: Array<{
    name: string;
    cost: number;
    change: number;
  }>;
  alerts?: string[];
  accountName?: string;
  provider?: string;
}

export interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'ses' | 'mailgun';
  from: string;
  to: string | string[];
  subject?: string;
  attachExcel?: boolean;

  // SMTP config
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };

  // SendGrid config
  sendgrid?: {
    apiKey: string;
  };

  // AWS SES config
  ses?: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };

  // Mailgun config
  mailgun?: {
    apiKey: string;
    domain: string;
  };
}

/**
 * Generate email HTML template
 */
function generateEmailHTML(data: EmailCostData): string {
  const {
    date,
    todayCost,
    mtdCost,
    budget,
    budgetPercent,
    projectedMonthEnd,
    topServices,
    alerts,
    accountName,
    provider,
  } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 8px 8px 0 0;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
    }
    .content {
      background: #f8f9fa;
      padding: 30px;
      border-radius: 0 0 8px 8px;
    }
    .section {
      background: white;
      padding: 20px;
      margin-bottom: 20px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #667eea;
    }
    .metric-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .metric-row:last-child {
      border-bottom: none;
    }
    .metric-label {
      font-weight: 500;
      color: #6c757d;
    }
    .metric-value {
      font-weight: bold;
      color: #333;
    }
    .service-item {
      padding: 8px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .change-up {
      color: #dc3545;
    }
    .change-down {
      color: #28a745;
    }
    .change-neutral {
      color: #6c757d;
    }
    .alert {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      padding: 20px;
      color: #6c757d;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💰 Daily Cost Report</h1>
    <p>${accountName ? `${provider || 'Cloud'} Account: ${accountName}` : ''}</p>
    <p>${date}</p>
  </div>

  <div class="content">
    <div class="section">
      <div class="section-title">📊 Today's Summary</div>
      <div class="metric-row">
        <span class="metric-label">Today's Cost</span>
        <span class="metric-value">$${todayCost.toFixed(2)}</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Month-to-Date</span>
        <span class="metric-value">$${mtdCost.toFixed(2)}${budget ? ` / $${budget.toFixed(2)}` : ''}</span>
      </div>
      ${budget ? `
      <div class="metric-row">
        <span class="metric-label">Budget Usage</span>
        <span class="metric-value">${budgetPercent?.toFixed(0)}%</span>
      </div>
      ` : ''}
      ${projectedMonthEnd ? `
      <div class="metric-row">
        <span class="metric-label">Projected Month-End</span>
        <span class="metric-value">$${projectedMonthEnd.toFixed(2)}</span>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">📈 Top Services</div>
      ${topServices.map(service => {
        const changeClass = service.change > 0 ? 'change-up' : service.change < 0 ? 'change-down' : 'change-neutral';
        const changeSymbol = service.change > 0 ? '↑' : service.change < 0 ? '↓' : '→';
        const changeText = service.change !== 0 ? `${changeSymbol} ${service.change > 0 ? '+' : ''}${service.change}%` : '→ 0%';

        return `
        <div class="service-item">
          <span>${service.name}: $${service.cost.toFixed(2)}</span>
          <span class="${changeClass}">${changeText}</span>
        </div>
        `;
      }).join('')}
    </div>

    ${alerts && alerts.length > 0 ? `
    <div class="section">
      <div class="section-title">⚠️ Alerts</div>
      ${alerts.map(alert => `<div class="alert">${alert}</div>`).join('')}
    </div>
    ` : ''}
  </div>

  <div class="footer">
    <p>Generated by infra-cost</p>
    <p>This is an automated report</p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email
 */
function generateEmailText(data: EmailCostData): string {
  const { date, todayCost, mtdCost, budget, budgetPercent, topServices, alerts } = data;

  let text = `Daily Cost Report - ${date}\n\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📊 Today's Summary\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `• Today: $${todayCost.toFixed(2)}\n`;
  text += `• Month-to-Date: $${mtdCost.toFixed(2)}${budget ? ` / $${budget.toFixed(2)}` : ''}\n`;
  if (budget) {
    text += `• Budget Usage: ${budgetPercent?.toFixed(0)}%\n`;
  }
  text += `\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📈 Top Services\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  topServices.forEach((service, index) => {
    const changeSymbol = service.change > 0 ? '↑' : service.change < 0 ? '↓' : '→';
    text += `${index + 1}. ${service.name}: $${service.cost.toFixed(2)} (${changeSymbol} ${service.change > 0 ? '+' : ''}${service.change}%)\n`;
  });
  text += `\n`;

  if (alerts && alerts.length > 0) {
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `⚠️ Alerts\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    alerts.forEach(alert => {
      text += `• ${alert}\n`;
    });
    text += `\n`;
  }

  text += `--\nGenerated by infra-cost`;

  return text;
}

/**
 * Send email using SendGrid
 */
async function sendViaSendGrid(
  config: EmailConfig,
  data: EmailCostData,
): Promise<void> {
  if (!config.sendgrid?.apiKey) {
    throw new Error('SendGrid API key is required');
  }

  const recipients = Array.isArray(config.to) ? config.to : [config.to];

  const payload = {
    personalizations: [
      {
        to: recipients.map(email => ({ email })),
        subject: config.subject || `💰 Daily Cost Report - ${data.date}`,
      },
    ],
    from: {
      email: config.from,
    },
    content: [
      {
        type: 'text/plain',
        value: generateEmailText(data),
      },
      {
        type: 'text/html',
        value: generateEmailHTML(data),
      },
    ],
  };

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.sendgrid.apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid API error: ${response.status} ${errorText}`);
  }
}

/**
 * Send email using Mailgun
 */
async function sendViaMailgun(
  config: EmailConfig,
  data: EmailCostData,
): Promise<void> {
  if (!config.mailgun?.apiKey || !config.mailgun?.domain) {
    throw new Error('Mailgun API key and domain are required');
  }

  const recipients = Array.isArray(config.to) ? config.to.join(',') : config.to;

  const formData = new URLSearchParams();
  formData.append('from', config.from);
  formData.append('to', recipients);
  formData.append('subject', config.subject || `💰 Daily Cost Report - ${data.date}`);
  formData.append('text', generateEmailText(data));
  formData.append('html', generateEmailHTML(data));

  const response = await fetch(
    `https://api.mailgun.net/v3/${config.mailgun.domain}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${config.mailgun.apiKey}`).toString('base64')}`,
      },
      body: formData,
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun API error: ${response.status} ${errorText}`);
  }
}

/**
 * Send email report
 */
export async function sendEmailReport(
  data: EmailCostData,
  config: EmailConfig,
): Promise<void> {
  try {
    switch (config.provider) {
      case 'sendgrid':
        await sendViaSendGrid(config, data);
        break;

      case 'mailgun':
        await sendViaMailgun(config, data);
        break;

      case 'smtp':
        // SMTP would require additional library like nodemailer
        throw new Error('SMTP provider not yet implemented - use SendGrid or Mailgun');

      case 'ses':
        // AWS SES would require AWS SDK
        throw new Error('AWS SES provider not yet implemented - use SendGrid or Mailgun');

      default:
        throw new Error(`Unknown email provider: ${config.provider}`);
    }
  } catch (error: any) {
    throw new Error(`Failed to send email report: ${error.message}`);
  }
}
