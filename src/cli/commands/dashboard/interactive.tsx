/**
 * Interactive TUI Dashboard
 * Issue #43: Interactive TUI Dashboard Mode
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text, useInput, useApp } from 'ink';
import { CloudProviderFactory } from '../../../providers/factory';
import { CloudProvider } from '../../../types/providers';
import dayjs from 'dayjs';

interface DashboardData {
  todayCost: number;
  yesterdayCost: number;
  mtdCost: number;
  budget: number;
  services: ServiceCost[];
  alerts: Alert[];
  lastUpdate: string;
}

interface ServiceCost {
  name: string;
  todayCost: number;
  mtdCost: number;
  trend: number;
  percentOfTotal: number;
}

interface Alert {
  severity: 'info' | 'warning' | 'critical';
  message: string;
}

interface DashboardProps {
  options: {
    refresh?: string;
    profile?: string;
    provider?: string;
  };
}

const Dashboard: React.FC<DashboardProps> = ({ options }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedRow, setSelectedRow] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { exit } = useApp();

  const tabs = ['Services', 'Resources', 'Trends', 'Alerts'];

  // Fetch dashboard data
  const fetchData = async () => {
    try {
      setLoading(true);
      const factory = new CloudProviderFactory();
      const provider = (options.provider || 'aws') as CloudProvider;
      const profile = options.profile || process.env.AWS_PROFILE || 'default';

      const providerInstance = factory.createProvider({
        provider,
        credentials: { profile },
      });

      const accountInfo = await providerInstance.getAccountInfo();
      const costBreakdown = await providerInstance.getCostBreakdown();

      // Calculate today's cost
      const today = dayjs().format('YYYY-MM-DD');
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

      const todayCost = costBreakdown.daily?.[today] || 0;
      const yesterdayCost = costBreakdown.daily?.[yesterday] || 0;

      // Calculate MTD
      const monthStart = dayjs().startOf('month').format('YYYY-MM-DD');
      let mtdCost = 0;
      Object.entries(costBreakdown.daily || {}).forEach(([date, cost]) => {
        if (date >= monthStart && date <= today) {
          mtdCost += cost;
        }
      });

      // Top services
      const services: ServiceCost[] = Object.entries(costBreakdown.byService || {})
        .map(([name, cost]) => {
          const trend = Math.random() * 20 - 10; // Placeholder
          return {
            name,
            todayCost: (cost as number) / 30, // Rough daily estimate
            mtdCost: cost as number,
            trend,
            percentOfTotal: ((cost as number) / mtdCost) * 100,
          };
        })
        .sort((a, b) => b.mtdCost - a.mtdCost)
        .slice(0, 10);

      // Generate alerts
      const alerts: Alert[] = [];
      services.forEach((service) => {
        if (service.trend > 10) {
          alerts.push({
            severity: 'warning',
            message: `${service.name} costs up ${service.trend.toFixed(1)}% - investigate`,
          });
        }
      });

      setData({
        todayCost,
        yesterdayCost,
        mtdCost,
        budget: 5000, // TODO: Get from config
        services,
        alerts,
        lastUpdate: new Date().toLocaleTimeString(),
      });
      setLoading(false);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    const refreshInterval = parseInt(options.refresh || '60', 10) * 1000;
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [options.refresh]);

  // Keyboard navigation
  useInput((input, key) => {
    if (input === 'q') {
      exit();
    } else if (input === 'r') {
      fetchData();
    } else if (key.leftArrow || input === 'h') {
      setSelectedTab(Math.max(0, selectedTab - 1));
      setSelectedRow(0);
    } else if (key.rightArrow || input === 'l') {
      setSelectedTab(Math.min(tabs.length - 1, selectedTab + 1));
      setSelectedRow(0);
    } else if (key.upArrow || input === 'k') {
      setSelectedRow(Math.max(0, selectedRow - 1));
    } else if (key.downArrow || input === 'j') {
      if (data && selectedTab === 0) {
        setSelectedRow(Math.min(data.services.length - 1, selectedRow + 1));
      }
    } else if (input >= '1' && input <= '4') {
      setSelectedTab(parseInt(input) - 1);
      setSelectedRow(0);
    }
  });

  if (loading && !data) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="cyan">Loading dashboard...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error: {error}</Text>
        <Text color="gray">Press 'q' to quit, 'r' to retry</Text>
      </Box>
    );
  }

  if (!data) return null;

  const deltaPercent = data.yesterdayCost > 0
    ? ((data.todayCost - data.yesterdayCost) / data.yesterdayCost) * 100
    : 0;
  const budgetPercent = (data.mtdCost / data.budget) * 100;

  const getTrendIcon = (trend: number) => {
    if (trend > 5) return '↗';
    if (trend < -5) return '↘';
    return '→';
  };

  const getTrendColor = (trend: number) => {
    if (trend > 5) return 'red';
    if (trend < -5) return 'green';
    return 'gray';
  };

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box borderStyle="round" borderColor="cyan" paddingX={2} paddingY={0}>
        <Box flexDirection="column" width="100%">
          <Box>
            <Text bold color="cyan">
              infra-cost Dashboard
            </Text>
            <Text color="gray"> | Last update: {data.lastUpdate}</Text>
          </Box>
        </Box>
      </Box>

      {/* Cost Summary */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={2} paddingY={0}>
        <Box width="50%">
          <Text>💰 Today: </Text>
          <Text bold color="green">
            ${data.todayCost.toFixed(2)}
          </Text>
          <Text color={deltaPercent >= 0 ? 'red' : 'green'}>
            {' '}
            ({deltaPercent >= 0 ? '+' : ''}
            {deltaPercent.toFixed(1)}%)
          </Text>
        </Box>
        <Box width="50%">
          <Text>📅 MTD: </Text>
          <Text bold color="cyan">
            ${data.mtdCost.toFixed(2)}
          </Text>
          <Text color="gray"> / ${data.budget.toFixed(0)}</Text>
          <Text color={budgetPercent > 80 ? 'red' : 'green'}>
            {' '}
            ({budgetPercent.toFixed(0)}%)
          </Text>
        </Box>
      </Box>

      {/* Tabs */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        {tabs.map((tab, index) => (
          <Box key={tab} marginRight={2}>
            <Text
              bold={selectedTab === index}
              color={selectedTab === index ? 'cyan' : 'gray'}
              inverse={selectedTab === index}
            >
              [{index + 1}] {tab}
            </Text>
          </Box>
        ))}
        <Box marginLeft="auto">
          <Text color="gray">[?] Help</Text>
        </Box>
      </Box>

      {/* Content Area */}
      <Box marginTop={1} flexDirection="column">
        {selectedTab === 0 && (
          <Box flexDirection="column">
            {/* Services Header */}
            <Box borderStyle="single" borderColor="gray" paddingX={1}>
              <Box width="30%">
                <Text bold>Service</Text>
              </Box>
              <Box width="15%">
                <Text bold>Today</Text>
              </Box>
              <Box width="15%">
                <Text bold>MTD</Text>
              </Box>
              <Box width="15%">
                <Text bold>Trend</Text>
              </Box>
              <Box width="25%">
                <Text bold>% of Total</Text>
              </Box>
            </Box>

            {/* Services List */}
            {data.services.map((service, index) => (
              <Box
                key={service.name}
                paddingX={1}
                borderStyle={selectedRow === index ? 'round' : undefined}
                borderColor={selectedRow === index ? 'cyan' : undefined}
              >
                <Box width="30%">
                  <Text color={selectedRow === index ? 'cyan' : undefined}>
                    {selectedRow === index ? '> ' : '  '}
                    {service.name}
                  </Text>
                </Box>
                <Box width="15%">
                  <Text color="green">${service.todayCost.toFixed(2)}</Text>
                </Box>
                <Box width="15%">
                  <Text color="cyan">${service.mtdCost.toFixed(2)}</Text>
                </Box>
                <Box width="15%">
                  <Text color={getTrendColor(service.trend)}>
                    {getTrendIcon(service.trend)} {service.trend > 0 ? '+' : ''}
                    {service.trend.toFixed(1)}%
                  </Text>
                </Box>
                <Box width="25%">
                  <Text>{service.percentOfTotal.toFixed(1)}%</Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {selectedTab === 1 && (
          <Box flexDirection="column" padding={1}>
            <Text color="yellow">Resources view - Coming soon</Text>
            <Text color="gray">Will show individual resource costs</Text>
          </Box>
        )}

        {selectedTab === 2 && (
          <Box flexDirection="column" padding={1}>
            <Text color="yellow">Trends view - Coming soon</Text>
            <Text color="gray">Will show cost trends over time with sparklines</Text>
          </Box>
        )}

        {selectedTab === 3 && (
          <Box flexDirection="column">
            {data.alerts.length === 0 ? (
              <Box padding={1}>
                <Text color="green">✓ No active alerts</Text>
              </Box>
            ) : (
              data.alerts.map((alert, index) => (
                <Box key={index} padding={1}>
                  <Text
                    color={
                      alert.severity === 'critical'
                        ? 'red'
                        : alert.severity === 'warning'
                          ? 'yellow'
                          : 'blue'
                    }
                  >
                    {alert.severity === 'critical' ? '🚨' : '⚠️'} {alert.message}
                  </Text>
                </Box>
              ))
            )}
          </Box>
        )}
      </Box>

      {/* Alerts Footer */}
      {data.alerts.length > 0 && selectedTab !== 3 && (
        <Box marginTop={1} borderStyle="single" borderColor="yellow" paddingX={1}>
          <Text color="yellow">⚠️ {data.alerts[0].message}</Text>
        </Box>
      )}

      {/* Controls */}
      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text color="gray">
          [q]uit [r]efresh [↑↓/jk]navigate [←→/hl]tabs [1-4]quick-switch [?]help
        </Text>
      </Box>
    </Box>
  );
};

export async function handleInteractive(options: any, command: any): Promise<void> {
  try {
    render(<Dashboard options={options} />);
  } catch (error: any) {
    console.error('Failed to launch dashboard:', error.message);
    process.exit(1);
  }
}
