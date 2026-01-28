import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface VisualizationConfiguration {
  enableInteractiveDashboards: boolean;
  enableRealTimeCharts: boolean;
  enableCustomThemes: boolean;
  enableExportOptions: boolean;
  defaultChartType: ChartType;
  dashboardLayout: LayoutType;
  colorScheme: ColorScheme;
  animation: AnimationConfig;
  responsive: ResponsiveConfig;
}

export interface AnimationConfig {
  enabled: boolean;
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  stagger: number;
}

export interface ResponsiveConfig {
  enabled: boolean;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  mobileFirst: boolean;
}

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'area'
  | 'scatter'
  | 'heatmap'
  | 'treemap'
  | 'sankey'
  | 'gauge'
  | 'waterfall'
  | 'candlestick'
  | 'radar'
  | 'funnel';

export type LayoutType = 'grid' | 'masonry' | 'flex' | 'custom';

export type ColorScheme = 'default' | 'dark' | 'light' | 'corporate' | 'vibrant' | 'pastel' | 'custom';

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
  metadata?: ChartMetadata;
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointStyle?: string;
  showLine?: boolean;
  stack?: string;
}

export interface ChartMetadata {
  title: string;
  subtitle?: string;
  description?: string;
  dataSource: string;
  lastUpdated: Date;
  currency?: string;
  unit?: string;
  aggregationType?: 'sum' | 'average' | 'count' | 'max' | 'min';
  timeRange?: {
    start: Date;
    end: Date;
    granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  };
}

export interface ChartConfiguration {
  id: string;
  type: ChartType;
  title: string;
  width?: number | string;
  height?: number | string;
  data: ChartData;
  options: ChartOptions;
  interactive?: boolean;
  realTime?: boolean;
  exportable?: boolean;
  drillDown?: DrillDownConfig;
  theme?: ColorScheme;
  createdAt?: Date;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: AnimationConfig;
  interaction?: {
    intersect?: boolean;
    mode?: 'point' | 'nearest' | 'index' | 'dataset' | 'x' | 'y';
  };
  legend?: LegendConfig;
  tooltip?: TooltipConfig;
  scales?: ScalesConfig;
  plugins?: PluginConfig;
  theme?: ColorScheme;
  customStyles?: Record<string, unknown>;
}

export interface LegendConfig {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  align?: 'start' | 'center' | 'end';
  labels?: {
    usePointStyle?: boolean;
    padding?: number;
    font?: FontConfig;
  };
}

export interface TooltipConfig {
  enabled: boolean;
  mode?: 'point' | 'nearest' | 'index' | 'dataset';
  position?: 'average' | 'nearest';
  backgroundColor?: string;
  titleColor?: string;
  bodyColor?: string;
  borderColor?: string;
  borderWidth?: number;
  displayColors?: boolean;
  callbacks?: {
    title?: (context: { label?: string; dataset?: { label?: string }; dataIndex?: number }) => string;
    label?: (context: { label?: string; parsed?: { y?: number }; dataset?: { label?: string }; dataIndex?: number }) => string;
    footer?: (context: { label?: string; dataset?: { label?: string }; dataIndex?: number }) => string;
  };
}

export interface ScalesConfig {
  x?: AxisConfig;
  y?: AxisConfig;
  r?: AxisConfig; // For radar charts
}

export interface AxisConfig {
  type?: 'linear' | 'logarithmic' | 'category' | 'time' | 'timeseries';
  display?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  title?: {
    display: boolean;
    text: string;
    color?: string;
    font?: FontConfig;
  };
  grid?: {
    display: boolean;
    color?: string;
    lineWidth?: number;
  };
  ticks?: {
    display: boolean;
    color?: string;
    font?: FontConfig;
    callback?: (value: number | string, index: number, values: Array<{ value: number }>) => string;
  };
  min?: number;
  max?: number;
  beginAtZero?: boolean;
}

export interface PluginConfig {
  datalabels?: {
    display: boolean;
    color?: string;
    font?: FontConfig;
    formatter?: (value: number | string, context: { dataIndex?: number; dataset?: { label?: string } }) => string;
  };
  zoom?: {
    zoom: {
      wheel: {
        enabled: boolean;
      };
      pinch: {
        enabled: boolean;
      };
      mode: 'x' | 'y' | 'xy';
    };
    pan: {
      enabled: boolean;
      mode: 'x' | 'y' | 'xy';
    };
  };
  annotation?: {
    annotations: AnnotationConfig[];
  };
}

export interface AnnotationConfig {
  type: 'line' | 'box' | 'ellipse' | 'point' | 'polygon';
  xMin?: number | string;
  xMax?: number | string;
  yMin?: number;
  yMax?: number;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  label?: {
    content: string;
    enabled: boolean;
    position?: string;
  };
}

export interface FontConfig {
  family?: string;
  size?: number;
  style?: 'normal' | 'italic' | 'oblique';
  weight?: 'normal' | 'bold' | 'lighter' | 'bolder' | number;
}

export interface DrillDownConfig {
  enabled: boolean;
  levels: DrillDownLevel[];
  onDrillDown?: (level: number, data: { label?: string; value?: number; index?: number }) => ChartData;
}

export interface DrillDownLevel {
  name: string;
  groupBy: string;
  title: string;
  chartType?: ChartType;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  charts: ChartConfiguration[];
  filters: DashboardFilter[];
  theme: ColorScheme;
  settings: DashboardSettings;
  createdAt: Date;
  updatedAt: Date;
  owner?: string;
  shared?: boolean;
  tags: string[];
}

export interface DashboardLayout {
  type: LayoutType;
  columns?: number;
  rows?: number;
  gap?: number;
  padding?: number;
  responsive?: boolean;
  positions?: ChartPosition[];
}

export interface ChartPosition {
  chartId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'date' | 'select' | 'multiselect' | 'range' | 'search';
  options?: FilterOption[];
  defaultValue?: string | number | Date | string[] | number[];
  affectedCharts: string[];
}

export interface FilterOption {
  value: string | number | boolean;
  label: string;
  group?: string;
}

export interface DashboardSettings {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showFilters?: boolean;
  showExport?: boolean;
  showFullscreen?: boolean;
  allowEditing?: boolean;
  showLastUpdated?: boolean;
}

export interface VisualizationOutput {
  format: OutputFormat;
  content: string;
  metadata: OutputMetadata;
}

export interface OutputMetadata {
  generatedAt: Date;
  size: number;
  dimensions?: { width: number; height: number };
  chartCount?: number;
  dataPoints?: number;
}

export type OutputFormat = 'html' | 'svg' | 'png' | 'pdf' | 'json' | 'csv' | 'excel';

export interface ThemeDefinition {
  name: string;
  colors: {
    primary: string[];
    secondary: string[];
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
    grid: string;
    axis: string;
  };
  fonts: {
    title: FontConfig;
    subtitle: FontConfig;
    body: FontConfig;
    caption: FontConfig;
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  borderRadius: number;
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
}

export class AdvancedVisualizationEngine extends EventEmitter {
  private config: VisualizationConfiguration;
  private themes: Map<ColorScheme | string, ThemeDefinition> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private charts: Map<string, ChartConfiguration> = new Map();
  private templates: Map<string, DashboardTemplate> = new Map();

  constructor(config: Partial<VisualizationConfiguration> = {}) {
    super();

    this.config = {
      enableInteractiveDashboards: true,
      enableRealTimeCharts: true,
      enableCustomThemes: true,
      enableExportOptions: true,
      defaultChartType: 'line',
      dashboardLayout: 'grid',
      colorScheme: 'default',
      animation: {
        enabled: true,
        duration: 1000,
        easing: 'ease-in-out',
        stagger: 100
      },
      responsive: {
        enabled: true,
        breakpoints: {
          mobile: 768,
          tablet: 1024,
          desktop: 1440
        },
        mobileFirst: true
      },
      ...config
    };

    this.initializeThemes();
    this.initializeTemplates();
  }

  private initializeThemes(): void {
    // Default theme
    this.themes.set('default', {
      name: 'Default',
      colors: {
        primary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
        secondary: ['#93C5FD', '#FCA5A5', '#6EE7B7', '#FCD34D', '#C4B5FD', '#F9A8D4', '#67E8F9', '#BEF264'],
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
          disabled: '#9CA3AF'
        },
        grid: '#E5E7EB',
        axis: '#374151'
      },
      fonts: {
        title: { family: 'Inter, sans-serif', size: 24, weight: 'bold' },
        subtitle: { family: 'Inter, sans-serif', size: 18, weight: 'normal' },
        body: { family: 'Inter, sans-serif', size: 14, weight: 'normal' },
        caption: { family: 'Inter, sans-serif', size: 12, weight: 'normal' }
      },
      spacing: { small: 8, medium: 16, large: 24 },
      borderRadius: 8,
      shadows: {
        small: '0 1px 3px rgba(0, 0, 0, 0.12)',
        medium: '0 4px 6px rgba(0, 0, 0, 0.12)',
        large: '0 10px 25px rgba(0, 0, 0, 0.12)'
      }
    });

    // Dark theme
    this.themes.set('dark', {
      name: 'Dark',
      colors: {
        primary: ['#60A5FA', '#F87171', '#34D399', '#FBBF24', '#A78BFA', '#F472B6', '#22D3EE', '#A3E635'],
        secondary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
        background: '#111827',
        surface: '#1F2937',
        text: {
          primary: '#ffffff',
          secondary: '#ffffff',
          disabled: '#6B7280'
        },
        grid: '#374151',
        axis: '#D1D5DB'
      },
      fonts: {
        title: { family: 'Inter, sans-serif', size: 24, weight: 'bold' },
        subtitle: { family: 'Inter, sans-serif', size: 18, weight: 'normal' },
        body: { family: 'Inter, sans-serif', size: 14, weight: 'normal' },
        caption: { family: 'Inter, sans-serif', size: 12, weight: 'normal' }
      },
      spacing: { small: 8, medium: 16, large: 24 },
      borderRadius: 8,
      shadows: {
        small: '0 1px 3px rgba(0, 0, 0, 0.3)',
        medium: '0 4px 6px rgba(0, 0, 0, 0.3)',
        large: '0 10px 25px rgba(0, 0, 0, 0.3)'
      }
    });

    // Corporate theme
    this.themes.set('corporate', {
      name: 'Corporate',
      colors: {
        primary: ['#1E40AF', '#DC2626', '#059669', '#D97706', '#7C3AED', '#C026D3', '#0891B2', '#65A30D'],
        secondary: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
        background: '#FFFFFF',
        surface: '#F1F5F9',
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          disabled: '#94A3B8'
        },
        grid: '#CBD5E1',
        axis: '#334155'
      },
      fonts: {
        title: { family: 'system-ui, sans-serif', size: 24, weight: 'bold' },
        subtitle: { family: 'system-ui, sans-serif', size: 18, weight: 500 },
        body: { family: 'system-ui, sans-serif', size: 14, weight: 'normal' },
        caption: { family: 'system-ui, sans-serif', size: 12, weight: 'normal' }
      },
      spacing: { small: 8, medium: 16, large: 24 },
      borderRadius: 4,
      shadows: {
        small: '0 1px 2px rgba(0, 0, 0, 0.05)',
        medium: '0 2px 4px rgba(0, 0, 0, 0.05)',
        large: '0 4px 8px rgba(0, 0, 0, 0.05)'
      }
    });
  }

  private initializeTemplates(): void {
    // Cost Overview Dashboard Template
    const costOverviewTemplate: DashboardTemplate = {
      id: 'cost-overview',
      name: 'Cost Overview Dashboard',
      description: 'Comprehensive cost analysis dashboard with key metrics and trends',
      category: 'cost-management',
      chartConfigurations: [
        {
          id: 'total-cost-trend',
          type: 'line',
          title: 'Total Cost Trend (30 Days)',
          width: '50%',
          height: '300px',
          position: { x: 0, y: 0, width: 6, height: 3 }
        },
        {
          id: 'cost-by-service',
          type: 'pie',
          title: 'Cost Distribution by Service',
          width: '50%',
          height: '300px',
          position: { x: 6, y: 0, width: 6, height: 3 }
        },
        {
          id: 'monthly-comparison',
          type: 'bar',
          title: 'Monthly Cost Comparison',
          width: '100%',
          height: '250px',
          position: { x: 0, y: 3, width: 12, height: 2 }
        }
      ],
      filters: [
        {
          id: 'date-range',
          name: 'Date Range',
          type: 'date',
          affectedCharts: ['total-cost-trend', 'monthly-comparison']
        },
        {
          id: 'service-filter',
          name: 'Services',
          type: 'multiselect',
          affectedCharts: ['cost-by-service']
        }
      ],
      settings: {
        autoRefresh: true,
        refreshInterval: 300000, // 5 minutes
        showFilters: true,
        showExport: true
      }
    };

    this.templates.set('cost-overview', costOverviewTemplate);

    // Resource Optimization Dashboard Template
    const optimizationTemplate: DashboardTemplate = {
      id: 'resource-optimization',
      name: 'Resource Optimization Dashboard',
      description: 'Resource utilization and optimization opportunities dashboard',
      category: 'optimization',
      chartConfigurations: [
        {
          id: 'utilization-heatmap',
          type: 'heatmap',
          title: 'Resource Utilization Heatmap',
          width: '60%',
          height: '400px',
          position: { x: 0, y: 0, width: 7, height: 4 }
        },
        {
          id: 'optimization-opportunities',
          type: 'bar',
          title: 'Top Optimization Opportunities',
          width: '40%',
          height: '400px',
          position: { x: 7, y: 0, width: 5, height: 4 }
        },
        {
          id: 'savings-potential',
          type: 'gauge',
          title: 'Monthly Savings Potential',
          width: '50%',
          height: '250px',
          position: { x: 0, y: 4, width: 6, height: 2 }
        },
        {
          id: 'resource-efficiency',
          type: 'radar',
          title: 'Resource Efficiency Score',
          width: '50%',
          height: '250px',
          position: { x: 6, y: 4, width: 6, height: 2 }
        }
      ],
      filters: [
        {
          id: 'resource-type',
          name: 'Resource Type',
          type: 'select',
          affectedCharts: ['utilization-heatmap', 'optimization-opportunities']
        },
        {
          id: 'region',
          name: 'Region',
          type: 'multiselect',
          affectedCharts: ['utilization-heatmap', 'savings-potential']
        }
      ],
      settings: {
        autoRefresh: true,
        refreshInterval: 600000, // 10 minutes
        showFilters: true,
        showExport: true
      }
    };

    this.templates.set('resource-optimization', optimizationTemplate);
  }

  public async createChart(config: Partial<ChartConfiguration>, data: ChartData): Promise<ChartConfiguration> {
    const themeToUse = config.theme ?? this.config.colorScheme;
    const isInteractive = config.interactive ?? this.config.enableInteractiveDashboards;
    const hasAnimation = config.options?.animation !== undefined ? config.options.animation : this.config.animation;

    const chart: ChartConfiguration = {
      id: config.id ?? this.generateId('chart'),
      type: config.type ?? this.config.defaultChartType,
      title: config.title ?? 'Untitled Chart',
      width: config.width ?? '100%',
      height: config.height ?? '400px',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: hasAnimation,
        ...config.options,
        // Add interaction options for interactive charts
        ...(isInteractive && {
          interaction: {
            intersect: false,
            mode: 'index' as const,
            ...config.options?.interaction
          }
        })
      },
      interactive: isInteractive,
      realTime: config.realTime ?? this.config.enableRealTimeCharts,
      exportable: config.exportable ?? this.config.enableExportOptions,
      drillDown: config.drillDown,
      theme: themeToUse,
      createdAt: new Date()
    };

    // Apply theme
    chart.options = this.applyTheme(chart.options, themeToUse);

    this.charts.set(chart.id, chart);
    this.emit('chart.created', { id: chart.id, type: chart.type, chart });

    return chart;
  }

  public async createDashboard(
    name: string,
    charts: ChartConfiguration[],
    options: Partial<Dashboard> = {}
  ): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: options.id ?? this.generateId('dashboard'),
      name,
      description: options.description,
      layout: options.layout ?? {
        type: this.config.dashboardLayout,
        columns: 12,
        gap: 16,
        padding: 20,
        responsive: this.config.responsive.enabled
      },
      charts,
      filters: options.filters ?? [],
      theme: options.theme ?? this.config.colorScheme,
      settings: {
        autoRefresh: false,
        refreshInterval: 300000,
        showFilters: true,
        showExport: true,
        showFullscreen: true,
        allowEditing: false,
        showLastUpdated: true,
        ...options.settings
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: options.owner,
      shared: options.shared ?? false,
      tags: options.tags ?? []
    };

    this.dashboards.set(dashboard.id, dashboard);
    this.emit('dashboard.created', { dashboardId: dashboard.id, dashboard });

    return dashboard;
  }

  public async createDashboardFromTemplate(
    templateId: string,
    name: string,
    data: Record<string, ChartData>,
    customization?: Partial<Dashboard>
  ): Promise<Dashboard> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Create charts from template
    const charts: ChartConfiguration[] = [];
    for (const chartConfig of template.chartConfigurations) {
      const chartData = data[chartConfig.id];
      if (chartData) {
        const chart = await this.createChart(chartConfig, chartData);
        charts.push(chart);
      }
    }

    // Create dashboard
    const dashboard = await this.createDashboard(name, charts, {
      description: template.description,
      filters: template.filters,
      settings: template.settings,
      tags: [template.category],
      ...customization
    });

    return dashboard;
  }

  public async renderChart(chartId: string, format: OutputFormat = 'html'): Promise<VisualizationOutput> {
    const chart = this.charts.get(chartId);
    if (!chart) {
      throw new Error(`Chart not found: ${chartId}`);
    }

    this.emit('chart.render.start', { chartId, format });

    try {
      let content: string;
      let metadata: OutputMetadata;

      switch (format) {
        case 'html':
          content = await this.renderChartAsHTML(chart);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            dimensions: { width: 800, height: 600 },
            dataPoints: this.countDataPoints(chart.data)
          };
          break;

        case 'svg':
          content = await this.renderChartAsSVG(chart);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            dimensions: { width: 800, height: 600 },
            dataPoints: this.countDataPoints(chart.data)
          };
          break;

        case 'json':
          content = JSON.stringify(chart, null, 2);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            dataPoints: this.countDataPoints(chart.data)
          };
          break;

        case 'csv':
          content = await this.renderChartAsCSV(chart);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            dataPoints: this.countDataPoints(chart.data)
          };
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const output: VisualizationOutput = { format, content, metadata };

      this.emit('chart.render.complete', { chartId, format, output });
      return output;

    } catch (error) {
      this.emit('chart.render.error', { chartId, format, error: error.message });
      throw new Error(`Failed to render chart: ${error.message}`);
    }
  }

  public async renderDashboard(dashboardId: string, format: OutputFormat = 'html'): Promise<VisualizationOutput> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${dashboardId}`);
    }

    this.emit('dashboard.render.start', { dashboardId, format });

    try {
      let content: string;
      let metadata: OutputMetadata;

      switch (format) {
        case 'html':
          content = await this.renderDashboardAsHTML(dashboard);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            chartCount: dashboard.charts.length,
            dataPoints: dashboard.charts.reduce((sum, chart) => sum + this.countDataPoints(chart.data), 0)
          };
          break;

        case 'json':
          content = JSON.stringify(dashboard, null, 2);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            chartCount: dashboard.charts.length,
            dataPoints: dashboard.charts.reduce((sum, chart) => sum + this.countDataPoints(chart.data), 0)
          };
          break;

        case 'pdf':
          content = await this.renderDashboardAsPDF(dashboard);
          metadata = {
            generatedAt: new Date(),
            size: content.length,
            chartCount: dashboard.charts.length,
            dataPoints: dashboard.charts.reduce((sum, chart) => sum + this.countDataPoints(chart.data), 0)
          };
          break;

        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      const output: VisualizationOutput = { format, content, metadata };

      this.emit('dashboard.render.complete', { dashboardId, format, output });
      return output;

    } catch (error) {
      this.emit('dashboard.render.error', { dashboardId, format, error: error.message });
      throw new Error(`Failed to render dashboard: ${error.message}`);
    }
  }

  private async renderChartAsHTML(chart: ChartConfiguration): Promise<string> {
    const theme = this.themes.get(chart.options.theme ?? this.config.colorScheme) ?? this.themes.get('default')!;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chart.title}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: ${theme.fonts.body.family};
            background-color: ${theme.colors.background};
            color: ${theme.colors.text.primary};
            margin: 0;
            padding: ${theme.spacing.medium}px;
        }
        .chart-container {
            position: relative;
            width: ${typeof chart.width === 'string' ? chart.width : chart.width + 'px'};
            height: ${typeof chart.height === 'string' ? chart.height : chart.height + 'px'};
            background: ${theme.colors.surface};
            border-radius: ${theme.borderRadius}px;
            box-shadow: ${theme.shadows.medium};
            padding: ${theme.spacing.medium}px;
        }
        .chart-title {
            font-size: ${theme.fonts.title.size}px;
            font-weight: ${theme.fonts.title.weight};
            margin-bottom: ${theme.spacing.medium}px;
            text-align: center;
        }
        ${chart.data.metadata?.subtitle ? `
        .chart-subtitle {
            font-size: ${theme.fonts.subtitle.size}px;
            color: ${theme.colors.text.secondary};
            text-align: center;
            margin-bottom: ${theme.spacing.medium}px;
        }` : ''}
    </style>
</head>
<body>
    <div class="chart-container">
        <div class="chart-title">${chart.title}</div>
        ${chart.data.metadata?.subtitle ? `<div class="chart-subtitle">${chart.data.metadata.subtitle}</div>` : ''}
        <canvas id="chart-${chart.id}"></canvas>
    </div>

    <script>
        const ctx = document.getElementById('chart-${chart.id}').getContext('2d');
        const chartData = ${JSON.stringify(chart.data)};
        const chartOptions = ${JSON.stringify(this.processChartOptions(chart.options, theme))};

        new Chart(ctx, {
            type: '${chart.type}',
            data: chartData,
            options: chartOptions
        });
    </script>
</body>
</html>`;
  }

  private async renderChartAsSVG(chart: ChartConfiguration): Promise<string> {
    const theme = this.themes.get(chart.options.theme ?? this.config.colorScheme) ?? this.themes.get('default')!;
    const width = typeof chart.width === 'string' ? 800 : chart.width;
    const height = typeof chart.height === 'string' ? 600 : chart.height;

    // This is a simplified SVG renderer - in a real implementation,
    // you would use a proper chart rendering library
    return `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${theme.colors.background}"/>
    <text x="${width/2}" y="30" text-anchor="middle" font-family="${theme.fonts.title.family}"
          font-size="${theme.fonts.title.size}px" fill="${theme.colors.text.primary}">
        ${chart.title}
    </text>
    <!-- Chart rendering would go here -->
    <text x="${width/2}" y="${height/2}" text-anchor="middle" fill="${theme.colors.text.secondary}">
        Chart data visualization (${chart.type})
    </text>
</svg>`;
  }

  private async renderChartAsCSV(chart: ChartConfiguration): Promise<string> {
    const headers = ['Label', ...chart.data.datasets.map(d => d.label)];
    const rows = [headers.join(',')];

    chart.data.labels.forEach((label, index) => {
      const row = [label];
      chart.data.datasets.forEach(dataset => {
        row.push(dataset.data[index]?.toString() ?? '0');
      });
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  private async renderDashboardAsHTML(dashboard: Dashboard): Promise<string> {
    const theme = this.themes.get(dashboard.theme) || this.themes.get('default')!;

    const chartPromises = dashboard.charts.map(async chart => `
        <div class="chart-item" style="grid-column: span ${chart.width === '100%' ? '12' : '6'};">
            ${await this.renderChartAsHTML(chart)}
        </div>
    `);
    const chartsHTML = (await Promise.all(chartPromises)).join('');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${dashboard.name}</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body {
            font-family: ${theme.fonts.body.family};
            background-color: ${theme.colors.background};
            color: ${theme.colors.text.primary};
            margin: 0;
            padding: ${theme.spacing.medium}px;
        }
        .dashboard {
            max-width: 1400px;
            margin: 0 auto;
        }
        .dashboard-header {
            text-align: center;
            margin-bottom: ${theme.spacing.large}px;
        }
        .dashboard-title {
            font-size: ${theme.fonts.title.size + 8}px;
            font-weight: ${theme.fonts.title.weight};
            margin-bottom: ${theme.spacing.small}px;
        }
        .dashboard-description {
            font-size: ${theme.fonts.subtitle.size}px;
            color: ${theme.colors.text.secondary};
        }
        .charts-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: ${theme.spacing.medium}px;
        }
        .chart-item {
            background: ${theme.colors.surface};
            border-radius: ${theme.borderRadius}px;
            box-shadow: ${theme.shadows.medium};
        }
        @media (max-width: ${this.config.responsive.breakpoints.tablet}px) {
            .charts-grid {
                grid-template-columns: 1fr;
            }
            .chart-item {
                grid-column: span 1 !important;
            }
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <div class="dashboard-header">
            <div class="dashboard-title">${dashboard.name}</div>
            ${dashboard.description ? `<div class="dashboard-description">${dashboard.description}</div>` : ''}
        </div>
        <div class="charts-grid">
            ${chartsHTML}
        </div>
    </div>
</body>
</html>`;
  }

  private async renderDashboardAsPDF(dashboard: Dashboard): Promise<string> {
    // Mock PDF generation - in a real implementation, you would use a library like Puppeteer
    return `PDF content for dashboard: ${dashboard.name} (${dashboard.charts.length} charts)`;
  }

  private applyTheme(options: ChartOptions, colorScheme: ColorScheme): ChartOptions {
    const theme = this.themes.get(colorScheme) || this.themes.get('default')!;

    return {
      ...options,
      plugins: {
        ...options.plugins,
        legend: {
          ...options.legend,
          labels: {
            ...options.legend?.labels,
            font: theme.fonts.body,
            color: theme.colors.text.primary
          }
        }
      },
      scales: {
        ...options.scales,
        x: {
          ...options.scales?.x,
          grid: {
            display: true,
            color: theme.colors.grid
          },
          ticks: {
            display: true,
            color: theme.colors.text.secondary,
            font: theme.fonts.caption
          }
        },
        y: {
          ...options.scales?.y,
          grid: {
            display: true,
            color: theme.colors.grid
          },
          ticks: {
            display: true,
            color: theme.colors.text.secondary,
            font: theme.fonts.caption
          }
        }
      }
    };
  }

  private processChartOptions(options: ChartOptions, theme: ThemeDefinition): ChartOptions & {
    backgroundColor: string;
    borderColor: string;
    color: string;
  } {
    return {
      ...options,
      backgroundColor: theme.colors.background,
      borderColor: theme.colors.primary[0],
      color: theme.colors.text.primary
    };
  }

  private countDataPoints(data: ChartData): number {
    return data.datasets.reduce((sum, dataset) => sum + dataset.data.length, 0);
  }

  private generateId(prefix: string): string {
    const hash = createHash('md5').update(`${prefix}_${Date.now()}_${Math.random()}`).digest('hex');
    return `${prefix}_${hash.substring(0, 8)}`;
  }

  // Management methods
  public getChart(chartId: string): ChartConfiguration | undefined {
    return this.charts.get(chartId);
  }

  public getDashboard(dashboardId: string): Dashboard | undefined {
    return this.dashboards.get(dashboardId);
  }

  public getAllCharts(): ChartConfiguration[] {
    return Array.from(this.charts.values());
  }

  public getAllDashboards(): Dashboard[] {
    return Array.from(this.dashboards.values());
  }

  public getAvailableTemplates(): DashboardTemplate[] {
    return Array.from(this.templates.values());
  }

  public async deleteChart(chartId: string): Promise<void> {
    if (this.charts.delete(chartId)) {
      this.emit('chart.deleted', { chartId });
    }
  }

  public async deleteDashboard(dashboardId: string): Promise<void> {
    if (this.dashboards.delete(dashboardId)) {
      this.emit('dashboard.deleted', { dashboardId });
    }
  }

  public async exportToFile(output: VisualizationOutput, filename: string): Promise<void> {
    const filepath = join(process.cwd(), filename);
    await fs.writeFile(filepath, output.content, 'utf-8');
    this.emit('export.complete', { filepath, format: output.format, size: output.metadata.size });
  }
}

interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  chartConfigurations: Array<Partial<ChartConfiguration> & {
    position: { x: number; y: number; width: number; height: number };
  }>;
  filters: DashboardFilter[];
  settings: DashboardSettings;
}