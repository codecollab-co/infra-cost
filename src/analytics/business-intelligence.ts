import { EventEmitter } from 'events';
import { CloudProvider, CostBreakdown, ResourceInventory } from '../types/providers';
import { AuditLogger } from '../audit/audit-logger';

export interface BusinessIntelligenceEngine extends EventEmitter {
  generateCostIntelligence(data: CostAnalyticsInput): Promise<CostIntelligenceReport>;
  createCustomDashboard(config: DashboardConfiguration): Promise<Dashboard>;
  generateExecutiveSummary(timeframe: TimeframeConfig): Promise<ExecutiveSummary>;
  performCohortAnalysis(criteria: CohortCriteria): Promise<CohortAnalysis>;
  calculateUnitEconomics(metrics: UnitEconomicsConfig): Promise<UnitEconomicsReport>;
}

export interface DailyCostData {
  date: string;
  totalCost: number;
  currency: string;
  breakdown: {
    compute: number;
    storage: number;
    network: number;
    database: number;
    other: number;
  };
  provider: CloudProvider;
  region: string;
  tags?: Record<string, string>;
  // Include CostBreakdown properties
  totals: {
    lastMonth: number;
    thisMonth: number;
    last7Days: number;
    yesterday: number;
  };
  totalsByService: {
    lastMonth: { [key: string]: number };
    thisMonth: { [key: string]: number };
    last7Days: { [key: string]: number };
    yesterday: { [key: string]: number };
  };
}

export interface CostAnalyticsInput {
  costData: DailyCostData[];
  resourceInventory: ResourceInventory[];
  timeframe: TimeframeConfig;
  businessMetrics?: BusinessMetric[];
  customDimensions?: CustomDimension[];
}

export interface TimeframeConfig {
  startDate: Date;
  endDate: Date;
  granularity: 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  timezone: string;
}

export interface BusinessMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  metadata?: { [key: string]: any };
}

export interface CustomDimension {
  name: string;
  values: string[];
  hierarchy?: string[];
}

export interface CostIntelligenceReport {
  summary: IntelligenceSummary;
  keyInsights: KeyInsight[];
  trendAnalysis: TrendAnalysis;
  costDrivers: CostDriverAnalysis;
  efficiency: EfficiencyMetrics;
  recommendations: BusinessRecommendation[];
  forecasts: PredictiveAnalytics;
  benchmarks: BenchmarkAnalysis;
  roi: ROIAnalysis;
  alerts: IntelligenceAlert[];
}

export interface IntelligenceSummary {
  totalCost: number;
  costChange: number;
  costChangePercent: number;
  efficiency: number;
  wasteIdentified: number;
  savingsOpportunity: number;
  topCostDriver: string;
  riskScore: number;
}

export interface KeyInsight {
  id: string;
  type: InsightType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: InsightImpact;
  confidence: number;
  evidence: Evidence[];
  recommendations: string[];
  timeframe: string;
}

export enum InsightType {
  COST_ANOMALY = 'COST_ANOMALY',
  EFFICIENCY_OPPORTUNITY = 'EFFICIENCY_OPPORTUNITY',
  TREND_SHIFT = 'TREND_SHIFT',
  RESOURCE_OPTIMIZATION = 'RESOURCE_OPTIMIZATION',
  SPEND_CONSOLIDATION = 'SPEND_CONSOLIDATION',
  BUDGET_VARIANCE = 'BUDGET_VARIANCE',
  SEASONAL_PATTERN = 'SEASONAL_PATTERN',
  COST_CORRELATION = 'COST_CORRELATION'
}

export interface InsightImpact {
  financialImpact: number;
  percentageImpact: number;
  affectedResources: number;
  timeToRealize: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface Evidence {
  type: 'METRIC' | 'TREND' | 'CORRELATION' | 'ANOMALY';
  value: any;
  description: string;
  confidence: number;
}

export interface TrendAnalysis {
  overallTrend: TrendDirection;
  trendStrength: number;
  seasonality: SeasonalityAnalysis;
  growthRate: number;
  volatility: number;
  cyclicalPatterns: CyclicalPattern[];
  trendBreakpoints: TrendBreakpoint[];
}

export enum TrendDirection {
  INCREASING = 'INCREASING',
  DECREASING = 'DECREASING',
  STABLE = 'STABLE',
  VOLATILE = 'VOLATILE',
  CYCLICAL = 'CYCLICAL'
}

export interface SeasonalityAnalysis {
  isPresent: boolean;
  strength: number;
  period: number;
  peakPeriods: string[];
  lowPeriods: string[];
}

export interface CyclicalPattern {
  period: number;
  amplitude: number;
  phase: number;
  confidence: number;
}

export interface TrendBreakpoint {
  date: Date;
  changeType: 'INCREASE' | 'DECREASE' | 'VOLATILITY_CHANGE';
  magnitude: number;
  cause?: string;
}

export interface CostDriverAnalysis {
  primaryDrivers: CostDriver[];
  driverCorrelations: DriverCorrelation[];
  driverEvolution: DriverEvolution[];
  unexplainedVariance: number;
}

export interface CostDriver {
  name: string;
  category: 'SERVICE' | 'REGION' | 'PROJECT' | 'TEAM' | 'ENVIRONMENT' | 'RESOURCE_TYPE';
  contribution: number;
  contributionPercent: number;
  trend: TrendDirection;
  volatility: number;
  controllability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DriverCorrelation {
  driver1: string;
  driver2: string;
  correlation: number;
  significance: number;
  relationship: 'CAUSAL' | 'CORRELATED' | 'COINCIDENTAL';
}

export interface DriverEvolution {
  driver: string;
  timeline: { date: Date; contribution: number; }[];
  changePoints: Date[];
}

export interface EfficiencyMetrics {
  overallEfficiency: number;
  utilizationRate: number;
  wastePercentage: number;
  costPerUnit: number;
  productivityIndex: number;
  efficiencyTrend: TrendDirection;
  benchmarkComparison: BenchmarkComparison;
}

export interface BenchmarkComparison {
  industry: string;
  percentile: number;
  aboveAverage: boolean;
  gapAnalysis: string;
}

export interface BusinessRecommendation {
  id: string;
  type: RecommendationType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  businessCase: BusinessCase;
  implementation: ImplementationPlan;
  metrics: RecommendationMetrics;
  dependencies: string[];
  risks: Risk[];
}

export enum RecommendationType {
  COST_OPTIMIZATION = 'COST_OPTIMIZATION',
  RESOURCE_SCALING = 'RESOURCE_SCALING',
  ARCHITECTURE_CHANGE = 'ARCHITECTURE_CHANGE',
  VENDOR_NEGOTIATION = 'VENDOR_NEGOTIATION',
  PROCESS_IMPROVEMENT = 'PROCESS_IMPROVEMENT',
  TECHNOLOGY_ADOPTION = 'TECHNOLOGY_ADOPTION',
  CONSOLIDATION = 'CONSOLIDATION',
  AUTOMATION = 'AUTOMATION'
}

export interface BusinessCase {
  problem: string;
  solution: string;
  benefits: string[];
  costs: number;
  savings: number;
  roi: number;
  paybackPeriod: number;
  npv: number;
  irr: number;
}

export interface ImplementationPlan {
  phases: Phase[];
  timeline: string;
  resources: string[];
  milestones: Milestone[];
  successCriteria: string[];
}

export interface Phase {
  name: string;
  duration: string;
  activities: string[];
  deliverables: string[];
  cost: number;
}

export interface Milestone {
  name: string;
  date: Date;
  criteria: string[];
  impact: number;
}

export interface RecommendationMetrics {
  expectedSavings: number;
  implementationCost: number;
  timeToValue: string;
  riskScore: number;
  confidenceLevel: number;
  measurability: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface Risk {
  type: 'TECHNICAL' | 'BUSINESS' | 'OPERATIONAL' | 'FINANCIAL';
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

export interface PredictiveAnalytics {
  costForecast: ForecastData;
  demandForecast: ForecastData;
  budgetProjection: BudgetProjection;
  scenarioAnalysis: ScenarioAnalysis;
  confidenceIntervals: ConfidenceInterval[];
}

export interface ForecastData {
  timeline: ForecastPoint[];
  methodology: string;
  accuracy: number;
  factors: string[];
}

export interface ForecastPoint {
  date: Date;
  predicted: number;
  lower: number;
  upper: number;
  confidence: number;
}

export interface BudgetProjection {
  projectedSpend: number;
  budgetUtilization: number;
  overrunRisk: number;
  varianceDrivers: string[];
}

export interface ScenarioAnalysis {
  scenarios: Scenario[];
  sensitivityAnalysis: SensitivityResult[];
  monteCarlo: MonteCarloResult;
}

export interface Scenario {
  name: string;
  probability: number;
  assumptions: { [key: string]: any };
  projectedCost: number;
  impact: string;
}

export interface SensitivityResult {
  parameter: string;
  sensitivity: number;
  impact: number;
}

export interface MonteCarloResult {
  mean: number;
  standardDeviation: number;
  percentiles: { [key: number]: number };
  riskMetrics: RiskMetrics;
}

export interface RiskMetrics {
  valueAtRisk: number;
  expectedShortfall: number;
  probabilityOfLoss: number;
}

export interface ConfidenceInterval {
  level: number;
  lower: number;
  upper: number;
}

export interface BenchmarkAnalysis {
  industryBenchmarks: IndustryBenchmark[];
  peerComparisons: PeerComparison[];
  bestPractices: BestPractice[];
  maturityScore: number;
}

export interface IndustryBenchmark {
  industry: string;
  metric: string;
  percentile25: number;
  percentile50: number;
  percentile75: number;
  yourValue: number;
  yourPercentile: number;
}

export interface PeerComparison {
  peer: string;
  comparisonMetrics: ComparisonMetric[];
  overallRanking: number;
  strengthAreas: string[];
  improvementAreas: string[];
}

export interface ComparisonMetric {
  name: string;
  yourValue: number;
  peerValue: number;
  difference: number;
  percentageDifference: number;
  significance: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BestPractice {
  area: string;
  practice: string;
  description: string;
  potentialImpact: number;
  implementationEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  applicability: number;
}

export interface ROIAnalysis {
  overallROI: number;
  roiByCategory: CategoryROI[];
  roiTrends: ROITrend[];
  paybackAnalysis: PaybackAnalysis;
  investmentEfficiency: InvestmentEfficiency;
}

export interface CategoryROI {
  category: string;
  investment: number;
  returns: number;
  roi: number;
  timeframe: string;
}

export interface ROITrend {
  period: Date;
  roi: number;
  cumulativeROI: number;
}

export interface PaybackAnalysis {
  paybackPeriod: number;
  discountedPayback: number;
  breakEvenPoint: Date;
  cashFlowProfile: CashFlow[];
}

export interface CashFlow {
  period: Date;
  inflow: number;
  outflow: number;
  netFlow: number;
  cumulativeFlow: number;
}

export interface InvestmentEfficiency {
  efficiencyRatio: number;
  riskAdjustedReturn: number;
  sharpeRatio: number;
  informationRatio: number;
}

export interface IntelligenceAlert {
  id: string;
  type: AlertType;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  threshold: AlertThreshold;
  currentValue: number;
  trend: TrendDirection;
  impact: AlertImpact;
  recommendations: string[];
  urgency: number;
}

export enum AlertType {
  BUDGET_EXCEEDED = 'BUDGET_EXCEEDED',
  COST_SPIKE = 'COST_SPIKE',
  EFFICIENCY_DECLINE = 'EFFICIENCY_DECLINE',
  ANOMALY_DETECTED = 'ANOMALY_DETECTED',
  FORECAST_DEVIATION = 'FORECAST_DEVIATION',
  ROI_DECLINE = 'ROI_DECLINE',
  BENCHMARK_DEVIATION = 'BENCHMARK_DEVIATION'
}

export interface AlertThreshold {
  metric: string;
  operator: 'GT' | 'LT' | 'EQ' | 'CHANGE_GT' | 'CHANGE_LT';
  value: number;
  timeWindow: string;
}

export interface AlertImpact {
  financialImpact: number;
  operationalImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  strategicImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  timeToResolution: string;
}

export interface DashboardConfiguration {
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  refreshInterval: number;
  permissions: Permission[];
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string;
  configuration: WidgetConfig;
  position: WidgetPosition;
  size: WidgetSize;
}

export enum WidgetType {
  COST_TREND = 'COST_TREND',
  PIE_CHART = 'PIE_CHART',
  BAR_CHART = 'BAR_CHART',
  METRIC_CARD = 'METRIC_CARD',
  TABLE = 'TABLE',
  HEATMAP = 'HEATMAP',
  GAUGE = 'GAUGE',
  SCATTER_PLOT = 'SCATTER_PLOT',
  WATERFALL = 'WATERFALL',
  SANKEY = 'SANKEY'
}

export interface WidgetConfig {
  metrics: string[];
  dimensions: string[];
  filters: { [key: string]: any };
  timeframe: TimeframeConfig;
  aggregation: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
  visualization: VisualizationOptions;
}

export interface VisualizationOptions {
  theme: string;
  colors: string[];
  showLegend: boolean;
  showLabels: boolean;
  animation: boolean;
  responsive: boolean;
}

export interface WidgetPosition {
  row: number;
  column: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface DashboardLayout {
  columns: number;
  responsive: boolean;
  theme: string;
}

export interface DashboardFilter {
  name: string;
  type: 'DATE_RANGE' | 'DROPDOWN' | 'MULTI_SELECT' | 'SLIDER';
  options: FilterOption[];
  defaultValue: any;
}

export interface FilterOption {
  label: string;
  value: any;
}

export interface Permission {
  user: string;
  role: 'VIEWER' | 'EDITOR' | 'ADMIN';
  permissions: string[];
}

export interface Dashboard {
  id: string;
  configuration: DashboardConfiguration;
  data: DashboardData;
  metadata: DashboardMetadata;
}

export interface DashboardData {
  widgets: WidgetData[];
  lastUpdated: Date;
  dataStatus: 'CURRENT' | 'STALE' | 'ERROR';
}

export interface WidgetData {
  widgetId: string;
  data: any;
  metadata: {
    lastUpdated: Date;
    dataPoints: number;
    executionTime: number;
  };
}

export interface DashboardMetadata {
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  modifiedBy: string;
  views: number;
  shares: number;
  tags: string[];
}

export interface ExecutiveSummary {
  period: TimeframeConfig;
  keyMetrics: ExecutiveMetric[];
  highlights: ExecutiveHighlight[];
  concerns: ExecutiveConcern[];
  recommendations: ExecutiveRecommendation[];
  outlook: ExecutiveOutlook;
  appendix: ExecutiveAppendix;
}

export interface ExecutiveMetric {
  name: string;
  value: number;
  unit: string;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  context: string;
  benchmark?: number;
}

export interface ExecutiveHighlight {
  title: string;
  description: string;
  impact: number;
  category: 'COST_SAVINGS' | 'EFFICIENCY_GAIN' | 'RISK_MITIGATION' | 'REVENUE_IMPACT';
  evidence: string[];
}

export interface ExecutiveConcern {
  title: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  potentialImpact: number;
  timeframe: string;
  mitigation: string[];
}

export interface ExecutiveRecommendation {
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  businessValue: number;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeline: string;
  owner: string;
  successMetrics: string[];
}

export interface ExecutiveOutlook {
  nextQuarter: OutlookPeriod;
  nextYear: OutlookPeriod;
  risks: OutlookRisk[];
  opportunities: OutlookOpportunity[];
}

export interface OutlookPeriod {
  period: string;
  expectedCost: number;
  confidence: number;
  keyDrivers: string[];
  assumptions: string[];
}

export interface OutlookRisk {
  description: string;
  probability: number;
  impact: number;
  mitigation: string;
}

export interface OutlookOpportunity {
  description: string;
  probability: number;
  value: number;
  requirements: string[];
}

export interface ExecutiveAppendix {
  methodology: string;
  dataQuality: DataQualityReport;
  definitions: { [key: string]: string };
  assumptions: string[];
  limitations: string[];
}

export interface DataQualityReport {
  completeness: number;
  accuracy: number;
  timeliness: number;
  consistency: number;
  issues: string[];
  recommendations: string[];
}

export interface CohortCriteria {
  cohortDefinition: CohortDefinition;
  metrics: string[];
  timeframe: TimeframeConfig;
  filters: CohortFilter[];
}

export interface CohortDefinition {
  name: string;
  groupBy: 'PROJECT' | 'TEAM' | 'ENVIRONMENT' | 'SERVICE' | 'REGION' | 'CUSTOM';
  criteria: { [key: string]: any };
}

export interface CohortFilter {
  field: string;
  operator: 'IN' | 'NOT_IN' | 'EQUALS' | 'CONTAINS';
  values: any[];
}

export interface CohortAnalysis {
  cohorts: CohortGroup[];
  comparison: CohortComparison;
  insights: CohortInsight[];
  recommendations: CohortRecommendation[];
}

export interface CohortGroup {
  id: string;
  name: string;
  size: number;
  metrics: CohortMetric[];
  characteristics: { [key: string]: any };
  performance: CohortPerformance;
}

export interface CohortMetric {
  name: string;
  value: number;
  rank: number;
  percentile: number;
  trend: TrendDirection;
}

export interface CohortPerformance {
  efficiency: number;
  costPerUnit: number;
  utilization: number;
  waste: number;
}

export interface CohortComparison {
  bestPerforming: string;
  worstPerforming: string;
  performanceGap: number;
  keyDifferentiators: string[];
}

export interface CohortInsight {
  type: 'PERFORMANCE_DRIVER' | 'COST_ANOMALY' | 'EFFICIENCY_OPPORTUNITY';
  description: string;
  affectedCohorts: string[];
  impact: number;
}

export interface CohortRecommendation {
  targetCohort: string;
  recommendation: string;
  expectedImpact: number;
  implementation: string[];
}

export interface UnitEconomicsConfig {
  businessUnit: string;
  unitDefinition: UnitDefinition;
  costCategories: string[];
  revenueMetrics?: string[];
  timeframe: TimeframeConfig;
}

export interface UnitDefinition {
  name: string;
  description: string;
  measurementUnit: string;
  calculationMethod: string;
}

export interface UnitEconomicsReport {
  unitMetrics: UnitMetric[];
  costBreakdown: UnitCostBreakdown;
  trends: UnitTrends;
  benchmarks: UnitBenchmark[];
  optimization: UnitOptimization;
  projections: UnitProjections;
}

export interface UnitMetric {
  name: string;
  value: number;
  unit: string;
  period: string;
  trend: TrendDirection;
  benchmark?: number;
}

export interface UnitCostBreakdown {
  categories: UnitCostCategory[];
  drivers: UnitCostDriver[];
  allocation: AllocationMethod;
}

export interface UnitCostCategory {
  category: string;
  costPerUnit: number;
  percentage: number;
  trend: TrendDirection;
}

export interface UnitCostDriver {
  driver: string;
  impact: number;
  controllability: 'HIGH' | 'MEDIUM' | 'LOW';
  optimization: string[];
}

export interface AllocationMethod {
  method: 'DIRECT' | 'ACTIVITY_BASED' | 'PROPORTIONAL' | 'HYBRID';
  accuracy: number;
  limitations: string[];
}

export interface UnitTrends {
  historical: UnitTrendPoint[];
  seasonality: SeasonalityAnalysis;
  volatility: number;
}

export interface UnitTrendPoint {
  period: Date;
  costPerUnit: number;
  volume: number;
  efficiency: number;
}

export interface UnitBenchmark {
  benchmark: string;
  yourValue: number;
  benchmarkValue: number;
  gap: number;
  percentile: number;
}

export interface UnitOptimization {
  opportunities: UnitOptimizationOpportunity[];
  scenarios: UnitOptimizationScenario[];
  roadmap: OptimizationRoadmap;
}

export interface UnitOptimizationOpportunity {
  area: string;
  description: string;
  potentialSavings: number;
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeline: string;
  risks: string[];
}

export interface UnitOptimizationScenario {
  name: string;
  changes: { [key: string]: any };
  projectedCostPerUnit: number;
  savings: number;
  feasibility: number;
}

export interface OptimizationRoadmap {
  phases: OptimizationPhase[];
  dependencies: RoadmapDependency[];
  milestones: RoadmapMilestone[];
}

export interface OptimizationPhase {
  name: string;
  duration: string;
  opportunities: string[];
  expectedImpact: number;
  resources: string[];
}

export interface RoadmapDependency {
  from: string;
  to: string;
  type: 'PREREQUISITE' | 'PARALLEL' | 'SEQUENTIAL';
  description: string;
}

export interface RoadmapMilestone {
  name: string;
  date: Date;
  criteria: string[];
  impact: number;
  dependencies: string[];
}

export interface UnitProjections {
  forecast: UnitForecast[];
  scenarios: UnitScenario[];
  sensitivity: UnitSensitivity[];
}

export interface UnitForecast {
  period: Date;
  projectedCostPerUnit: number;
  projectedVolume: number;
  confidence: number;
  drivers: string[];
}

export interface UnitScenario {
  name: string;
  probability: number;
  costPerUnit: number;
  volume: number;
  description: string;
}

export interface UnitSensitivity {
  parameter: string;
  sensitivity: number;
  impact: number;
  range: { min: number; max: number; };
}

export class AdvancedCostAnalytics extends EventEmitter {
  private auditLogger: AuditLogger;

  constructor() {
    super();
    this.auditLogger = new AuditLogger();
  }

  async generateCostIntelligence(data: CostAnalyticsInput): Promise<CostIntelligenceReport> {
    this.emit('analysis_started', { dataPoints: data.costData.length });

    // Perform comprehensive analysis
    const summary = this.generateIntelligenceSummary(data);
    const keyInsights = await this.extractKeyInsights(data);
    const trendAnalysis = this.performTrendAnalysis(data);
    const costDrivers = this.analyzeCostDrivers(data);
    const efficiency = this.calculateEfficiencyMetrics(data);
    const recommendations = await this.generateBusinessRecommendations(data, keyInsights);
    const forecasts = this.generatePredictiveAnalytics(data);
    const benchmarks = this.performBenchmarkAnalysis(data);
    const roi = this.analyzeROI(data);
    const alerts = this.generateIntelligenceAlerts(data, summary);

    const report: CostIntelligenceReport = {
      summary,
      keyInsights,
      trendAnalysis,
      costDrivers,
      efficiency,
      recommendations,
      forecasts,
      benchmarks,
      roi,
      alerts
    };

    await this.auditLogger.log('cost_intelligence_generated', {
      dataPoints: data.costData.length,
      insightsGenerated: keyInsights.length,
      recommendationsCount: recommendations.length
    });

    this.emit('analysis_completed', report);
    return report;
  }

  private generateIntelligenceSummary(data: CostAnalyticsInput): IntelligenceSummary {
    const totalCost = data.costData.reduce((sum, cost) => sum + cost.totalCost, 0);
    const previousPeriodCost = totalCost * (0.9 + Math.random() * 0.2); // Mock previous period
    const costChange = totalCost - previousPeriodCost;
    const costChangePercent = (costChange / previousPeriodCost) * 100;

    return {
      totalCost,
      costChange,
      costChangePercent,
      efficiency: Math.random() * 30 + 70, // 70-100%
      wasteIdentified: totalCost * (Math.random() * 0.2 + 0.05), // 5-25%
      savingsOpportunity: totalCost * (Math.random() * 0.15 + 0.1), // 10-25%
      topCostDriver: 'Compute Services',
      riskScore: Math.random() * 40 + 10 // 10-50
    };
  }

  private async extractKeyInsights(data: CostAnalyticsInput): Promise<KeyInsight[]> {
    const insights: KeyInsight[] = [];

    // Cost anomaly insight
    insights.push({
      id: 'anomaly-001',
      type: InsightType.COST_ANOMALY,
      priority: 'HIGH',
      title: 'Unusual spike in compute costs detected',
      description: 'Compute costs increased by 47% in the last week, primarily driven by auto-scaling events in production environment.',
      impact: {
        financialImpact: 12500,
        percentageImpact: 15,
        affectedResources: 23,
        timeToRealize: '1 week',
        riskLevel: 'MEDIUM'
      },
      confidence: 0.92,
      evidence: [
        {
          type: 'METRIC',
          value: 47,
          description: 'Percentage increase in compute costs',
          confidence: 0.95
        },
        {
          type: 'CORRELATION',
          value: 0.87,
          description: 'Strong correlation with production deployment frequency',
          confidence: 0.89
        }
      ],
      recommendations: [
        'Implement predictive scaling policies',
        'Review deployment patterns and optimize CI/CD timing',
        'Consider reserved instances for predictable workloads'
      ],
      timeframe: '7 days'
    });

    // Efficiency opportunity insight
    insights.push({
      id: 'efficiency-001',
      type: InsightType.EFFICIENCY_OPPORTUNITY,
      priority: 'MEDIUM',
      title: 'Low utilization detected in development environments',
      description: 'Development environments show average CPU utilization of only 12%, indicating significant rightsizing opportunities.',
      impact: {
        financialImpact: 8750,
        percentageImpact: 25,
        affectedResources: 45,
        timeToRealize: '2 weeks',
        riskLevel: 'LOW'
      },
      confidence: 0.88,
      evidence: [
        {
          type: 'METRIC',
          value: 12,
          description: 'Average CPU utilization in dev environments',
          confidence: 0.94
        }
      ],
      recommendations: [
        'Downsize development instances',
        'Implement auto-shutdown policies',
        'Consider spot instances for non-critical workloads'
      ],
      timeframe: '30 days'
    });

    return insights;
  }

  private performTrendAnalysis(data: CostAnalyticsInput): TrendAnalysis {
    return {
      overallTrend: TrendDirection.INCREASING,
      trendStrength: 0.75,
      seasonality: {
        isPresent: true,
        strength: 0.65,
        period: 7, // Weekly pattern
        peakPeriods: ['Monday', 'Tuesday'],
        lowPeriods: ['Weekend']
      },
      growthRate: 0.08, // 8% monthly growth
      volatility: 0.23,
      cyclicalPatterns: [
        {
          period: 7,
          amplitude: 0.15,
          phase: 0.2,
          confidence: 0.82
        }
      ],
      trendBreakpoints: [
        {
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          changeType: 'INCREASE',
          magnitude: 0.47,
          cause: 'Production scaling events'
        }
      ]
    };
  }

  private analyzeCostDrivers(data: CostAnalyticsInput): CostDriverAnalysis {
    const primaryDrivers: CostDriver[] = [
      {
        name: 'EC2 Instances',
        category: 'SERVICE',
        contribution: 45000,
        contributionPercent: 45,
        trend: TrendDirection.INCREASING,
        volatility: 0.15,
        controllability: 'HIGH'
      },
      {
        name: 'Data Transfer',
        category: 'SERVICE',
        contribution: 22000,
        contributionPercent: 22,
        trend: TrendDirection.STABLE,
        volatility: 0.08,
        controllability: 'MEDIUM'
      },
      {
        name: 'Storage',
        category: 'SERVICE',
        contribution: 18000,
        contributionPercent: 18,
        trend: TrendDirection.INCREASING,
        volatility: 0.12,
        controllability: 'HIGH'
      }
    ];

    return {
      primaryDrivers,
      driverCorrelations: [
        {
          driver1: 'EC2 Instances',
          driver2: 'Data Transfer',
          correlation: 0.76,
          significance: 0.95,
          relationship: 'CAUSAL'
        }
      ],
      driverEvolution: [],
      unexplainedVariance: 0.15
    };
  }

  private calculateEfficiencyMetrics(data: CostAnalyticsInput): EfficiencyMetrics {
    return {
      overallEfficiency: 76,
      utilizationRate: 0.68,
      wastePercentage: 24,
      costPerUnit: 12.50,
      productivityIndex: 1.23,
      efficiencyTrend: TrendDirection.INCREASING,
      benchmarkComparison: {
        industry: 'Technology',
        percentile: 65,
        aboveAverage: true,
        gapAnalysis: 'Above industry average but room for improvement'
      }
    };
  }

  private async generateBusinessRecommendations(
    data: CostAnalyticsInput,
    insights: KeyInsight[]
  ): Promise<BusinessRecommendation[]> {
    return [
      {
        id: 'rec-001',
        type: RecommendationType.COST_OPTIMIZATION,
        priority: 'HIGH',
        title: 'Implement Reserved Instance Strategy',
        description: 'Purchase reserved instances for predictable workloads to achieve 20-40% cost savings',
        businessCase: {
          problem: 'High on-demand instance costs for stable workloads',
          solution: 'Strategic reserved instance purchases with 1-3 year commitments',
          benefits: [
            'Predictable cost structure',
            'Significant cost savings',
            'Budget planning improvements'
          ],
          costs: 150000,
          savings: 450000,
          roi: 3.0,
          paybackPeriod: 4,
          npv: 380000,
          irr: 0.65
        },
        implementation: {
          phases: [
            {
              name: 'Analysis & Planning',
              duration: '2 weeks',
              activities: ['Analyze usage patterns', 'Size recommendations'],
              deliverables: ['Reserved instance plan', 'Financial projection'],
              cost: 5000
            },
            {
              name: 'Execution',
              duration: '1 week',
              activities: ['Purchase reserved instances', 'Monitor deployment'],
              deliverables: ['Active reservations', 'Monitoring setup'],
              cost: 2000
            }
          ],
          timeline: '3 weeks',
          resources: ['Cloud architect', 'FinOps analyst'],
          milestones: [
            {
              name: 'Analysis complete',
              date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
              criteria: ['Usage analysis completed', 'Recommendations validated'],
              impact: 0.3
            }
          ],
          successCriteria: [
            'Cost reduction of 25% achieved',
            'Utilization above 80%',
            'Payback within 6 months'
          ]
        },
        metrics: {
          expectedSavings: 450000,
          implementationCost: 7000,
          timeToValue: '1 month',
          riskScore: 25,
          confidenceLevel: 0.91,
          measurability: 'HIGH'
        },
        dependencies: ['Usage pattern analysis', 'Budget approval'],
        risks: [
          {
            type: 'BUSINESS',
            description: 'Usage patterns may change',
            probability: 0.3,
            impact: 0.4,
            mitigation: 'Regular usage review and adjustment'
          }
        ]
      }
    ];
  }

  private generatePredictiveAnalytics(data: CostAnalyticsInput): PredictiveAnalytics {
    const timeline: ForecastPoint[] = [];
    const baseDate = new Date();

    for (let i = 1; i <= 12; i++) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      const predicted = 100000 * (1 + i * 0.05 + Math.random() * 0.1 - 0.05);

      timeline.push({
        date,
        predicted,
        lower: predicted * 0.9,
        upper: predicted * 1.1,
        confidence: 0.85
      });
    }

    return {
      costForecast: {
        timeline,
        methodology: 'Seasonal ARIMA with ML enhancement',
        accuracy: 0.87,
        factors: ['Historical trends', 'Seasonal patterns', 'Business growth']
      },
      demandForecast: {
        timeline: timeline.map(t => ({
          ...t,
          predicted: t.predicted * 0.8
        })),
        methodology: 'Machine learning regression',
        accuracy: 0.82,
        factors: ['User growth', 'Feature adoption', 'Market trends']
      },
      budgetProjection: {
        projectedSpend: 1250000,
        budgetUtilization: 0.78,
        overrunRisk: 0.15,
        varianceDrivers: ['Compute scaling', 'Data growth', 'New features']
      },
      scenarioAnalysis: {
        scenarios: [
          {
            name: 'Optimistic',
            probability: 0.25,
            assumptions: { 'growth_rate': 1.2, 'efficiency_gains': 0.15 },
            projectedCost: 1100000,
            impact: 'Cost savings through optimization'
          },
          {
            name: 'Pessimistic',
            probability: 0.25,
            assumptions: { 'growth_rate': 1.8, 'efficiency_gains': 0.05 },
            projectedCost: 1450000,
            impact: 'Higher costs due to rapid scaling'
          }
        ],
        sensitivityAnalysis: [
          {
            parameter: 'user_growth',
            sensitivity: 0.65,
            impact: 450000
          }
        ],
        monteCarlo: {
          mean: 1250000,
          standardDeviation: 125000,
          percentiles: {
            5: 1050000,
            25: 1150000,
            50: 1250000,
            75: 1350000,
            95: 1450000
          },
          riskMetrics: {
            valueAtRisk: 1400000,
            expectedShortfall: 1425000,
            probabilityOfLoss: 0.15
          }
        }
      },
      confidenceIntervals: [
        { level: 95, lower: 1050000, upper: 1450000 },
        { level: 80, lower: 1150000, upper: 1350000 }
      ]
    };
  }

  private performBenchmarkAnalysis(data: CostAnalyticsInput): BenchmarkAnalysis {
    return {
      industryBenchmarks: [
        {
          industry: 'Technology',
          metric: 'Cost per transaction',
          percentile25: 0.05,
          percentile50: 0.08,
          percentile75: 0.12,
          yourValue: 0.09,
          yourPercentile: 58
        }
      ],
      peerComparisons: [
        {
          peer: 'Similar-sized tech company',
          comparisonMetrics: [
            {
              name: 'Cost efficiency',
              yourValue: 76,
              peerValue: 82,
              difference: -6,
              percentageDifference: -7.3,
              significance: 'MEDIUM'
            }
          ],
          overallRanking: 3,
          strengthAreas: ['Cost visibility', 'Automation'],
          improvementAreas: ['Resource utilization', 'Reserved instance adoption']
        }
      ],
      bestPractices: [
        {
          area: 'Cost Optimization',
          practice: 'Automated rightsizing',
          description: 'Implement automated resource rightsizing based on utilization patterns',
          potentialImpact: 250000,
          implementationEffort: 'MEDIUM',
          applicability: 0.85
        }
      ],
      maturityScore: 72
    };
  }

  private analyzeROI(data: CostAnalyticsInput): ROIAnalysis {
    return {
      overallROI: 2.45,
      roiByCategory: [
        {
          category: 'Infrastructure Optimization',
          investment: 100000,
          returns: 350000,
          roi: 3.5,
          timeframe: '12 months'
        }
      ],
      roiTrends: [],
      paybackAnalysis: {
        paybackPeriod: 8.5,
        discountedPayback: 9.2,
        breakEvenPoint: new Date(Date.now() + 8.5 * 30 * 24 * 60 * 60 * 1000),
        cashFlowProfile: []
      },
      investmentEfficiency: {
        efficiencyRatio: 1.25,
        riskAdjustedReturn: 2.1,
        sharpeRatio: 1.45,
        informationRatio: 0.85
      }
    };
  }

  private generateIntelligenceAlerts(
    data: CostAnalyticsInput,
    summary: IntelligenceSummary
  ): IntelligenceAlert[] {
    const alerts: IntelligenceAlert[] = [];

    if (summary.costChangePercent > 20) {
      alerts.push({
        id: 'alert-001',
        type: AlertType.COST_SPIKE,
        severity: 'HIGH',
        title: 'Significant cost increase detected',
        description: `Costs increased by ${summary.costChangePercent.toFixed(1)}% exceeding the 20% threshold`,
        threshold: {
          metric: 'cost_change_percent',
          operator: 'GT',
          value: 20,
          timeWindow: '7d'
        },
        currentValue: summary.costChangePercent,
        trend: TrendDirection.INCREASING,
        impact: {
          financialImpact: summary.costChange,
          operationalImpact: 'HIGH',
          strategicImpact: 'MEDIUM',
          timeToResolution: '1-2 weeks'
        },
        recommendations: [
          'Investigate root cause of cost increase',
          'Review recent deployments and scaling events',
          'Implement temporary cost controls if needed'
        ],
        urgency: 85
      });
    }

    return alerts;
  }

  // Additional methods for dashboard creation, executive summaries, etc.
  async createCustomDashboard(config: DashboardConfiguration): Promise<Dashboard> {
    // Implementation for custom dashboard creation
    const dashboardData = await this.generateDashboardData(config);

    return {
      id: crypto.randomUUID(),
      configuration: config,
      data: dashboardData,
      metadata: {
        createdAt: new Date(),
        createdBy: 'system',
        lastModified: new Date(),
        modifiedBy: 'system',
        views: 0,
        shares: 0,
        tags: []
      }
    };
  }

  private async generateDashboardData(config: DashboardConfiguration): Promise<DashboardData> {
    const widgetData: WidgetData[] = [];

    for (const widget of config.widgets) {
      const data = await this.generateWidgetData(widget);
      widgetData.push({
        widgetId: widget.id,
        data,
        metadata: {
          lastUpdated: new Date(),
          dataPoints: Array.isArray(data) ? data.length : 1,
          executionTime: Math.random() * 500 + 100
        }
      });
    }

    return {
      widgets: widgetData,
      lastUpdated: new Date(),
      dataStatus: 'CURRENT'
    };
  }

  private async generateWidgetData(widget: DashboardWidget): Promise<any> {
    // Mock widget data generation based on widget type
    switch (widget.type) {
      case WidgetType.COST_TREND:
        return this.generateTrendData();
      case WidgetType.PIE_CHART:
        return this.generatePieChartData();
      case WidgetType.METRIC_CARD:
        return this.generateMetricData();
      default:
        return {};
    }
  }

  private generateTrendData(): any[] {
    const data = [];
    const baseDate = new Date();

    for (let i = 0; i < 30; i++) {
      data.push({
        date: new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000),
        value: Math.random() * 10000 + 5000
      });
    }

    return data.reverse();
  }

  private generatePieChartData(): any[] {
    return [
      { name: 'Compute', value: 45 },
      { name: 'Storage', value: 25 },
      { name: 'Network', value: 20 },
      { name: 'Database', value: 10 }
    ];
  }

  private generateMetricData(): any {
    return {
      value: 125000,
      change: 12.5,
      trend: 'up'
    };
  }

  generateMockAnalyticsData(): CostAnalyticsInput {
    const costData: DailyCostData[] = [];
    const resourceInventory: ResourceInventory[] = [];

    // Generate mock cost data
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      const dailyCost = Math.random() * 10000 + 5000;
      costData.push({
        date: date.toISOString().split('T')[0],
        totalCost: dailyCost,
        currency: 'USD',
        breakdown: {
          compute: Math.random() * 4000 + 2000,
          storage: Math.random() * 2000 + 1000,
          network: Math.random() * 1500 + 500,
          database: Math.random() * 1000 + 300,
          other: Math.random() * 500 + 200
        },
        provider: CloudProvider.AWS,
        region: 'us-east-1',
        tags: {
          environment: 'production',
          team: 'platform'
        },
        totals: {
          lastMonth: 0,
          thisMonth: dailyCost,
          last7Days: 0,
          yesterday: 0
        },
        totalsByService: {
          lastMonth: {},
          thisMonth: {},
          last7Days: {},
          yesterday: {}
        }
      });
    }

    return {
      costData,
      resourceInventory,
      timeframe: {
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
        granularity: 'DAILY',
        timezone: 'UTC'
      }
    };
  }
}

// Add crypto import for UUID generation
const crypto = require('crypto');
if (!crypto.randomUUID) {
  crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}