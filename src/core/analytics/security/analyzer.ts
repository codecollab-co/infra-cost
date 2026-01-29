import { EventEmitter } from 'events';
import { CloudProvider, ResourceInventory } from '../types/providers';
import { AuditLogger, ComplianceFramework } from '../audit/audit-logger';

export interface SecurityCostData {
  resourceId: string;
  resourceType: string;
  region: string;
  provider: CloudProvider;
  securityFeatures: SecurityFeature[];
  securityCost: number;          // Monthly cost for security features
  riskScore: number;             // 0-100 (higher = more risky)
  complianceLevel: ComplianceLevel;
  vulnerabilities: SecurityVulnerability[];
  recommendations: SecurityCostRecommendation[];
}

export interface SecurityFeature {
  name: string;
  category: SecurityCategory;
  enabled: boolean;
  monthlyCost: number;
  coverage: number;              // 0-100 percentage coverage
  effectiveness: number;         // 0-100 effectiveness score
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface SecurityVulnerability {
  id: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: SecurityCategory;
  description: string;
  cvssScore: number;
  exploitability: number;
  remediationCost: number;       // Estimated monthly cost to fix
  businessImpact: number;        // Potential cost if exploited
  recommendation: string;
}

export interface SecurityCostRecommendation {
  id: string;
  type: SecurityRecommendationType;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  impact: {
    riskReduction: number;       // Risk score improvement
    costChange: number;          // Monthly cost change (negative = savings)
    complianceImprovement: number; // Compliance score improvement
    roi: number;                 // Return on investment (annual)
  };
  effort: 'LOW' | 'MEDIUM' | 'HIGH';
  timeline: string;
  implementation: {
    steps: string[];
    tools: string[];
    prerequisites: string[];
    risks: string[];
  };
  compliance: {
    frameworks: ComplianceFramework[];
    requirements: string[];
  };
}

export enum SecurityCategory {
  IDENTITY_ACCESS = 'IDENTITY_ACCESS',
  NETWORK_SECURITY = 'NETWORK_SECURITY',
  DATA_PROTECTION = 'DATA_PROTECTION',
  THREAT_DETECTION = 'THREAT_DETECTION',
  VULNERABILITY_MANAGEMENT = 'VULNERABILITY_MANAGEMENT',
  COMPLIANCE_MONITORING = 'COMPLIANCE_MONITORING',
  INCIDENT_RESPONSE = 'INCIDENT_RESPONSE',
  BACKUP_RECOVERY = 'BACKUP_RECOVERY'
}

export enum SecurityRecommendationType {
  COST_OPTIMIZATION = 'COST_OPTIMIZATION',
  SECURITY_ENHANCEMENT = 'SECURITY_ENHANCEMENT',
  COMPLIANCE_IMPROVEMENT = 'COMPLIANCE_IMPROVEMENT',
  RIGHTSIZING = 'RIGHTSIZING',
  AUTOMATION = 'AUTOMATION',
  CONSOLIDATION = 'CONSOLIDATION',
  ALTERNATIVE_SOLUTION = 'ALTERNATIVE_SOLUTION'
}

export enum ComplianceLevel {
  NON_COMPLIANT = 'NON_COMPLIANT',
  PARTIALLY_COMPLIANT = 'PARTIALLY_COMPLIANT',
  MOSTLY_COMPLIANT = 'MOSTLY_COMPLIANT',
  FULLY_COMPLIANT = 'FULLY_COMPLIANT'
}

export interface SecurityCostMetrics {
  totalSecuritySpend: number;
  securitySpendPercentage: number;    // % of total infrastructure cost
  riskAdjustedCost: number;           // Security cost adjusted for risk
  averageRiskScore: number;
  complianceScore: number;            // 0-100 overall compliance
  securityROI: number;                // Return on security investment
  categoryBreakdown: Map<SecurityCategory, SecurityCostData[]>;
  complianceBreakdown: Map<ComplianceFramework, ComplianceMetrics>;
  recommendations: SecurityCostRecommendation[];
  trends: SecurityTrendData;
}

export interface ComplianceMetrics {
  framework: ComplianceFramework;
  overallScore: number;               // 0-100 compliance score
  requirements: ComplianceRequirement[];
  gaps: ComplianceGap[];
  estimatedCostToComply: number;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  status: 'COMPLIANT' | 'PARTIAL' | 'NON_COMPLIANT';
  resources: string[];               // Resource IDs affected
  remediationCost: number;
}

export interface ComplianceGap {
  requirement: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  affectedResources: number;
  estimatedCost: number;
  timeline: string;
}

export interface SecurityTrendData {
  costTrend: Array<{ month: string; cost: number; }>;
  riskTrend: Array<{ month: string; riskScore: number; }>;
  complianceTrend: Array<{ month: string; score: number; }>;
  incidentCostTrend: Array<{ month: string; cost: number; incidents: number; }>;
}

export interface SecurityCostConfiguration {
  includeComplianceCosts: boolean;
  riskTolerance: 'LOW' | 'MEDIUM' | 'HIGH';
  primaryFrameworks: ComplianceFramework[];
  costThresholds: {
    highRiskResource: number;        // Monthly cost threshold for high-risk resources
    complianceGap: number;           // Cost threshold for compliance gaps
    securityFeature: number;        // Minimum cost for security feature analysis
  };
  analysisDepth: 'BASIC' | 'DETAILED' | 'COMPREHENSIVE';
  includeIncidentCosts: boolean;
  industryVertical?: 'FINANCE' | 'HEALTHCARE' | 'RETAIL' | 'TECHNOLOGY' | 'GOVERNMENT';
}

export class SecurityCostAnalyzer extends EventEmitter {
  private configuration: SecurityCostConfiguration;
  private auditLogger: AuditLogger;
  private securityPricingData: Map<string, SecurityFeaturePricing> = new Map();

  constructor(config: Partial<SecurityCostConfiguration> = {}) {
    super();
    this.configuration = {
      includeComplianceCosts: true,
      riskTolerance: 'MEDIUM',
      primaryFrameworks: [ComplianceFramework.SOC2, ComplianceFramework.ISO27001],
      costThresholds: {
        highRiskResource: 500,
        complianceGap: 1000,
        securityFeature: 50
      },
      analysisDepth: 'COMPREHENSIVE',
      includeIncidentCosts: true,
      ...config
    };
    this.auditLogger = new AuditLogger();
    this.initializeSecurityPricing();
  }

  async analyzeSecurityCosts(resources: any[]): Promise<SecurityCostMetrics> {
    this.emit('analysis_started', { resourceCount: resources.length });

    const securityCostData: SecurityCostData[] = [];

    for (const resource of resources) {
      const resourceAnalysis = await this.analyzeResourceSecurity(resource);
      securityCostData.push(resourceAnalysis);

      this.emit('resource_analyzed', {
        resourceId: resource.id,
        securityCost: resourceAnalysis.securityCost,
        riskScore: resourceAnalysis.riskScore,
        progress: (securityCostData.length / resources.length) * 100
      });
    }

    const metrics = this.calculateSecurityMetrics(securityCostData);
    const recommendations = await this.generateSecurityRecommendations(securityCostData, metrics);
    const complianceAnalysis = await this.analyzeCompliance(securityCostData);
    const trendData = this.generateMockTrendData(); // In production, this would fetch historical data

    const result: SecurityCostMetrics = {
      ...metrics,
      recommendations,
      complianceBreakdown: complianceAnalysis,
      trends: trendData
    };

    await this.auditLogger.log('security_cost_analysis', {
      resourcesAnalyzed: resources.length,
      totalSecuritySpend: result.totalSecuritySpend,
      averageRiskScore: result.averageRiskScore,
      recommendationsGenerated: recommendations.length
    });

    this.emit('analysis_completed', result);
    return result;
  }

  private async analyzeResourceSecurity(resource: any): Promise<SecurityCostData> {
    const securityFeatures = this.identifySecurityFeatures(resource);
    const vulnerabilities = this.assessVulnerabilities(resource);
    const riskScore = this.calculateRiskScore(resource, vulnerabilities, securityFeatures);
    const complianceLevel = this.assessComplianceLevel(resource, securityFeatures);
    const securityCost = securityFeatures.reduce((sum, feature) => sum + feature.monthlyCost, 0);

    return {
      resourceId: resource.id,
      resourceType: resource.type,
      region: resource.region,
      provider: resource.provider,
      securityFeatures,
      securityCost,
      riskScore,
      complianceLevel,
      vulnerabilities,
      recommendations: [] // Will be populated by generateSecurityRecommendations
    };
  }

  private identifySecurityFeatures(resource: any): SecurityFeature[] {
    const features: SecurityFeature[] = [];

    // Mock security feature detection based on resource type and configuration
    const resourceTypeFeatures = this.getSecurityFeaturesForResourceType(resource.type);

    resourceTypeFeatures.forEach(featureTemplate => {
      const enabled = Math.random() > 0.3; // 70% chance of being enabled
      const effectiveness = enabled ? Math.random() * 40 + 60 : 0; // 60-100 if enabled

      features.push({
        ...featureTemplate,
        enabled,
        effectiveness,
        coverage: enabled ? Math.random() * 30 + 70 : 0, // 70-100% if enabled
        monthlyCost: enabled ? featureTemplate.monthlyCost : 0
      });
    });

    return features;
  }

  private getSecurityFeaturesForResourceType(resourceType: string): SecurityFeature[] {
    const featureMap: { [key: string]: SecurityFeature[] } = {
      'compute': [
        {
          name: 'Security Groups/NSGs',
          category: SecurityCategory.NETWORK_SECURITY,
          enabled: true,
          monthlyCost: 0,
          coverage: 90,
          effectiveness: 85,
          criticality: 'HIGH'
        },
        {
          name: 'IAM Role-based Access',
          category: SecurityCategory.IDENTITY_ACCESS,
          enabled: true,
          monthlyCost: 25,
          coverage: 80,
          effectiveness: 90,
          criticality: 'CRITICAL'
        },
        {
          name: 'Vulnerability Scanning',
          category: SecurityCategory.VULNERABILITY_MANAGEMENT,
          enabled: false,
          monthlyCost: 45,
          coverage: 95,
          effectiveness: 85,
          criticality: 'HIGH'
        },
        {
          name: 'Threat Detection',
          category: SecurityCategory.THREAT_DETECTION,
          enabled: false,
          monthlyCost: 120,
          coverage: 88,
          effectiveness: 92,
          criticality: 'HIGH'
        }
      ],
      'storage': [
        {
          name: 'Encryption at Rest',
          category: SecurityCategory.DATA_PROTECTION,
          enabled: true,
          monthlyCost: 15,
          coverage: 100,
          effectiveness: 95,
          criticality: 'CRITICAL'
        },
        {
          name: 'Access Logging',
          category: SecurityCategory.COMPLIANCE_MONITORING,
          enabled: false,
          monthlyCost: 30,
          coverage: 90,
          effectiveness: 80,
          criticality: 'MEDIUM'
        },
        {
          name: 'Backup Encryption',
          category: SecurityCategory.BACKUP_RECOVERY,
          enabled: false,
          monthlyCost: 25,
          coverage: 85,
          effectiveness: 88,
          criticality: 'HIGH'
        }
      ],
      'database': [
        {
          name: 'Database Encryption',
          category: SecurityCategory.DATA_PROTECTION,
          enabled: true,
          monthlyCost: 50,
          coverage: 100,
          effectiveness: 98,
          criticality: 'CRITICAL'
        },
        {
          name: 'Database Activity Monitoring',
          category: SecurityCategory.THREAT_DETECTION,
          enabled: false,
          monthlyCost: 200,
          coverage: 95,
          effectiveness: 90,
          criticality: 'HIGH'
        },
        {
          name: 'Automated Patching',
          category: SecurityCategory.VULNERABILITY_MANAGEMENT,
          enabled: false,
          monthlyCost: 40,
          coverage: 92,
          effectiveness: 85,
          criticality: 'HIGH'
        }
      ],
      'network': [
        {
          name: 'Web Application Firewall',
          category: SecurityCategory.NETWORK_SECURITY,
          enabled: false,
          monthlyCost: 180,
          coverage: 85,
          effectiveness: 88,
          criticality: 'HIGH'
        },
        {
          name: 'DDoS Protection',
          category: SecurityCategory.NETWORK_SECURITY,
          enabled: false,
          monthlyCost: 300,
          coverage: 95,
          effectiveness: 92,
          criticality: 'MEDIUM'
        },
        {
          name: 'Network Flow Logs',
          category: SecurityCategory.COMPLIANCE_MONITORING,
          enabled: false,
          monthlyCost: 60,
          coverage: 100,
          effectiveness: 75,
          criticality: 'MEDIUM'
        }
      ]
    };

    return featureMap[resourceType] || featureMap['compute'];
  }

  private assessVulnerabilities(resource: any): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Generate mock vulnerabilities based on resource type and security posture
    const vulnCount = Math.floor(Math.random() * 5) + 1; // 1-5 vulnerabilities

    for (let i = 0; i < vulnCount; i++) {
      const severity = this.getRandomSeverity();
      const category = this.getRandomSecurityCategory();

      vulnerabilities.push({
        id: `VULN-${resource.id}-${i + 1}`,
        severity,
        category,
        description: this.generateVulnerabilityDescription(category, severity),
        cvssScore: this.calculateCVSSScore(severity),
        exploitability: Math.random() * 100,
        remediationCost: this.calculateRemediationCost(severity),
        businessImpact: this.calculateBusinessImpact(severity, resource.type),
        recommendation: this.generateRemediationRecommendation(category, severity)
      });
    }

    return vulnerabilities;
  }

  private getRandomSeverity(): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const rand = Math.random();
    if (rand < 0.4) return 'LOW';
    if (rand < 0.7) return 'MEDIUM';
    if (rand < 0.9) return 'HIGH';
    return 'CRITICAL';
  }

  private getRandomSecurityCategory(): SecurityCategory {
    const categories = Object.values(SecurityCategory);
    return categories[Math.floor(Math.random() * categories.length)];
  }

  private generateVulnerabilityDescription(category: SecurityCategory, severity: string): string {
    const descriptions = {
      [SecurityCategory.IDENTITY_ACCESS]: {
        LOW: 'Weak password policy detected',
        MEDIUM: 'Missing MFA on privileged accounts',
        HIGH: 'Overprivileged service accounts',
        CRITICAL: 'Hardcoded credentials in configuration'
      },
      [SecurityCategory.NETWORK_SECURITY]: {
        LOW: 'Unnecessary open ports detected',
        MEDIUM: 'Missing network segmentation',
        HIGH: 'Unrestricted outbound traffic',
        CRITICAL: 'Open access from internet to critical services'
      },
      [SecurityCategory.DATA_PROTECTION]: {
        LOW: 'Unencrypted non-sensitive data',
        MEDIUM: 'Missing data classification',
        HIGH: 'Unencrypted sensitive data in transit',
        CRITICAL: 'Unencrypted PII/PHI data at rest'
      },
      [SecurityCategory.VULNERABILITY_MANAGEMENT]: {
        LOW: 'Outdated non-critical software',
        MEDIUM: 'Missing security patches',
        HIGH: 'Known vulnerabilities with available patches',
        CRITICAL: 'Zero-day vulnerabilities detected'
      }
    };

    return descriptions[category]?.[severity] || 'Generic security vulnerability detected';
  }

  private calculateCVSSScore(severity: string): number {
    const scoreRanges = {
      LOW: [0.1, 3.9],
      MEDIUM: [4.0, 6.9],
      HIGH: [7.0, 8.9],
      CRITICAL: [9.0, 10.0]
    };

    const range = scoreRanges[severity];
    return Math.random() * (range[1] - range[0]) + range[0];
  }

  private calculateRemediationCost(severity: string): number {
    const costRanges = {
      LOW: [50, 200],
      MEDIUM: [200, 800],
      HIGH: [800, 3000],
      CRITICAL: [3000, 10000]
    };

    const range = costRanges[severity];
    return Math.random() * (range[1] - range[0]) + range[0];
  }

  private calculateBusinessImpact(severity: string, resourceType: string): number {
    const baseImpact = {
      LOW: 1000,
      MEDIUM: 10000,
      HIGH: 100000,
      CRITICAL: 1000000
    };

    const typeMultiplier = {
      'database': 2.0,
      'compute': 1.5,
      'storage': 1.3,
      'network': 1.8
    };

    return baseImpact[severity] * (typeMultiplier[resourceType] || 1.0) * (0.5 + Math.random());
  }

  private generateRemediationRecommendation(category: SecurityCategory, severity: string): string {
    const recommendations = {
      [SecurityCategory.IDENTITY_ACCESS]: 'Implement least privilege access and enable MFA',
      [SecurityCategory.NETWORK_SECURITY]: 'Configure proper firewall rules and network segmentation',
      [SecurityCategory.DATA_PROTECTION]: 'Enable encryption and implement data classification',
      [SecurityCategory.VULNERABILITY_MANAGEMENT]: 'Apply security patches and update software'
    };

    return recommendations[category] || 'Review and remediate security configuration';
  }

  private calculateRiskScore(resource: any, vulnerabilities: SecurityVulnerability[], features: SecurityFeature[]): number {
    let riskScore = 50; // Base risk score

    // Increase risk based on vulnerabilities
    vulnerabilities.forEach(vuln => {
      const severityWeight = { LOW: 5, MEDIUM: 15, HIGH: 25, CRITICAL: 40 };
      riskScore += severityWeight[vuln.severity] || 0;
    });

    // Decrease risk based on enabled security features
    const enabledFeatures = features.filter(f => f.enabled);
    const securityCoverage = enabledFeatures.reduce((sum, f) => sum + f.effectiveness, 0) / features.length;
    riskScore -= securityCoverage * 0.4;

    // Apply resource type risk modifier
    const typeRisk = { database: 1.3, storage: 1.2, network: 1.4, compute: 1.0 };
    riskScore *= typeRisk[resource.type] || 1.0;

    return Math.max(0, Math.min(100, riskScore));
  }

  private assessComplianceLevel(resource: any, features: SecurityFeature[]): ComplianceLevel {
    const enabledCriticalFeatures = features.filter(f => f.enabled && f.criticality === 'CRITICAL').length;
    const totalCriticalFeatures = features.filter(f => f.criticality === 'CRITICAL').length;

    if (totalCriticalFeatures === 0) return ComplianceLevel.FULLY_COMPLIANT;

    const compliance = enabledCriticalFeatures / totalCriticalFeatures;

    if (compliance >= 0.9) return ComplianceLevel.FULLY_COMPLIANT;
    if (compliance >= 0.7) return ComplianceLevel.MOSTLY_COMPLIANT;
    if (compliance >= 0.4) return ComplianceLevel.PARTIALLY_COMPLIANT;
    return ComplianceLevel.NON_COMPLIANT;
  }

  private calculateSecurityMetrics(securityData: SecurityCostData[]): Omit<SecurityCostMetrics, 'recommendations' | 'complianceBreakdown' | 'trends'> {
    const totalSecuritySpend = securityData.reduce((sum, data) => sum + data.securityCost, 0);
    const totalInfraSpend = totalSecuritySpend * 5; // Mock total infrastructure cost
    const securitySpendPercentage = (totalSecuritySpend / totalInfraSpend) * 100;

    const averageRiskScore = securityData.reduce((sum, data) => sum + data.riskScore, 0) / securityData.length;

    // Calculate compliance score
    const complianceScores = securityData.map(data => {
      switch (data.complianceLevel) {
        case ComplianceLevel.FULLY_COMPLIANT: return 100;
        case ComplianceLevel.MOSTLY_COMPLIANT: return 75;
        case ComplianceLevel.PARTIALLY_COMPLIANT: return 50;
        default: return 25;
      }
    });
    const complianceScore = complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length;

    // Risk-adjusted cost (higher risk resources cost more to secure)
    const riskAdjustedCost = securityData.reduce((sum, data) => {
      return sum + data.securityCost * (1 + data.riskScore / 100);
    }, 0);

    // Security ROI calculation
    const totalVulnerabilityImpact = securityData.reduce((sum, data) => {
      return sum + data.vulnerabilities.reduce((vulnSum, vuln) => vulnSum + vuln.businessImpact, 0);
    }, 0);
    const securityROI = (totalVulnerabilityImpact - totalSecuritySpend) / totalSecuritySpend;

    // Category breakdown
    const categoryBreakdown = new Map<SecurityCategory, SecurityCostData[]>();
    Object.values(SecurityCategory).forEach(category => {
      const categoryData = securityData.filter(data =>
        data.securityFeatures.some(feature => feature.category === category && feature.enabled)
      );
      if (categoryData.length > 0) {
        categoryBreakdown.set(category, categoryData);
      }
    });

    return {
      totalSecuritySpend,
      securitySpendPercentage,
      riskAdjustedCost,
      averageRiskScore,
      complianceScore,
      securityROI,
      categoryBreakdown
    };
  }

  private async generateSecurityRecommendations(
    securityData: SecurityCostData[],
    metrics: Omit<SecurityCostMetrics, 'recommendations' | 'complianceBreakdown' | 'trends'>
  ): Promise<SecurityCostRecommendation[]> {
    const recommendations: SecurityCostRecommendation[] = [];

    // High-risk resources recommendations
    const highRiskResources = securityData.filter(data => data.riskScore > 70);
    if (highRiskResources.length > 0) {
      recommendations.push(...this.generateHighRiskRecommendations(highRiskResources));
    }

    // Cost optimization recommendations
    recommendations.push(...this.generateCostOptimizationRecommendations(securityData));

    // Compliance improvement recommendations
    const nonCompliantResources = securityData.filter(data =>
      data.complianceLevel === ComplianceLevel.NON_COMPLIANT ||
      data.complianceLevel === ComplianceLevel.PARTIALLY_COMPLIANT
    );
    if (nonCompliantResources.length > 0) {
      recommendations.push(...this.generateComplianceRecommendations(nonCompliantResources));
    }

    // Automation recommendations
    recommendations.push(...this.generateAutomationRecommendations(securityData));

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.impact.roi - a.impact.roi;
    });
  }

  private generateHighRiskRecommendations(highRiskResources: SecurityCostData[]): SecurityCostRecommendation[] {
    const totalRisk = highRiskResources.reduce((sum, r) => sum + r.riskScore, 0);
    const avgRemediationCost = highRiskResources.reduce((sum, r) =>
      sum + r.vulnerabilities.reduce((vSum, v) => vSum + v.remediationCost, 0), 0
    ) / highRiskResources.length;

    return [{
      id: 'high-risk-remediation',
      type: SecurityRecommendationType.SECURITY_ENHANCEMENT,
      priority: 'CRITICAL',
      title: `Remediate ${highRiskResources.length} high-risk resources`,
      description: `${highRiskResources.length} resources have risk scores above 70. Immediate action required to reduce security exposure.`,
      impact: {
        riskReduction: totalRisk * 0.6,
        costChange: avgRemediationCost,
        complianceImprovement: 25,
        roi: 3.5
      },
      effort: 'HIGH',
      timeline: '2-4 weeks',
      implementation: {
        steps: [
          'Prioritize critical vulnerabilities',
          'Apply security patches immediately',
          'Enable missing security features',
          'Implement additional monitoring',
          'Conduct security review'
        ],
        tools: ['Vulnerability scanners', 'Security orchestration', 'SIEM', 'Patch management'],
        prerequisites: ['Security team approval', 'Change management process'],
        risks: ['Service disruption during patching', 'Configuration changes may affect performance']
      },
      compliance: {
        frameworks: [ComplianceFramework.SOC2, ComplianceFramework.ISO27001, ComplianceFramework.NIST],
        requirements: ['Risk assessment', 'Vulnerability management', 'Incident response']
      }
    }];
  }

  private generateCostOptimizationRecommendations(securityData: SecurityCostData[]): SecurityCostRecommendation[] {
    const recommendations: SecurityCostRecommendation[] = [];

    // Find over-provisioned security features
    const overProvisionedFeatures = securityData.flatMap(data =>
      data.securityFeatures.filter(feature =>
        feature.enabled && feature.monthlyCost > 100 && feature.coverage < 60
      )
    );

    if (overProvisionedFeatures.length > 0) {
      const potentialSavings = overProvisionedFeatures.reduce((sum, f) => sum + f.monthlyCost * 0.3, 0);

      recommendations.push({
        id: 'rightsize-security-features',
        type: SecurityRecommendationType.RIGHTSIZING,
        priority: 'MEDIUM',
        title: 'Rightsize underutilized security features',
        description: `${overProvisionedFeatures.length} security features are over-provisioned with low coverage. Consider rightsizing or optimization.`,
        impact: {
          riskReduction: -5, // Slight risk increase
          costChange: -potentialSavings,
          complianceImprovement: 0,
          roi: 2.1
        },
        effort: 'MEDIUM',
        timeline: '2-3 weeks',
        implementation: {
          steps: [
            'Analyze feature usage patterns',
            'Identify optimization opportunities',
            'Test reduced configurations',
            'Implement gradual changes',
            'Monitor impact on security posture'
          ],
          tools: ['Cloud cost management', 'Security analytics', 'Configuration management'],
          prerequisites: ['Usage analysis', 'Security team review'],
          risks: ['Reduced security coverage', 'Compliance impact']
        },
        compliance: {
          frameworks: [ComplianceFramework.SOC2],
          requirements: ['Cost management', 'Security effectiveness']
        }
      });
    }

    return recommendations;
  }

  private generateComplianceRecommendations(nonCompliantResources: SecurityCostData[]): SecurityCostRecommendation[] {
    const totalComplianceCost = nonCompliantResources.reduce((sum, r) =>
      sum + r.securityFeatures.filter(f => !f.enabled && f.criticality === 'CRITICAL').length * 200, 0
    );

    return [{
      id: 'improve-compliance',
      type: SecurityRecommendationType.COMPLIANCE_IMPROVEMENT,
      priority: 'HIGH',
      title: `Improve compliance for ${nonCompliantResources.length} resources`,
      description: `${nonCompliantResources.length} resources are not meeting compliance standards. Enable critical security features to achieve compliance.`,
      impact: {
        riskReduction: 30,
        costChange: totalComplianceCost,
        complianceImprovement: 40,
        roi: 1.8
      },
      effort: 'MEDIUM',
      timeline: '4-6 weeks',
      implementation: {
        steps: [
          'Conduct compliance gap analysis',
          'Enable required security features',
          'Implement monitoring and alerting',
          'Document security procedures',
          'Conduct compliance audit'
        ],
        tools: ['Compliance management', 'Security configuration', 'Audit tools'],
        prerequisites: ['Compliance framework selection', 'Budget approval'],
        risks: ['Implementation complexity', 'Cost increase', 'Process changes required']
      },
      compliance: {
        frameworks: this.configuration.primaryFrameworks,
        requirements: ['Security controls', 'Monitoring', 'Documentation']
      }
    }];
  }

  private generateAutomationRecommendations(securityData: SecurityCostData[]): SecurityCostRecommendation[] {
    const manualProcesses = securityData.filter(data =>
      data.securityFeatures.some(f => f.category === SecurityCategory.VULNERABILITY_MANAGEMENT && !f.enabled)
    );

    if (manualProcesses.length > 0) {
      return [{
        id: 'automate-security-processes',
        type: SecurityRecommendationType.AUTOMATION,
        priority: 'MEDIUM',
        title: 'Automate security management processes',
        description: `Implement automation for vulnerability management, patching, and compliance monitoring to reduce manual effort and improve response time.`,
        impact: {
          riskReduction: 20,
          costChange: -500, // Long-term cost savings through automation
          complianceImprovement: 15,
          roi: 4.2
        },
        effort: 'HIGH',
        timeline: '8-12 weeks',
        implementation: {
          steps: [
            'Assess current manual processes',
            'Select automation tools and platforms',
            'Implement automated workflows',
            'Integrate with existing systems',
            'Train team on new processes'
          ],
          tools: ['Security orchestration', 'Infrastructure as Code', 'CI/CD pipelines', 'SOAR platforms'],
          prerequisites: ['Tool selection', 'Team training', 'Process documentation'],
          risks: ['Initial implementation complexity', 'Integration challenges', 'Learning curve']
        },
        compliance: {
          frameworks: [ComplianceFramework.SOC2, ComplianceFramework.ISO27001, ComplianceFramework.NIST],
          requirements: ['Automated controls', 'Process efficiency', 'Consistency']
        }
      }];
    }

    return [];
  }

  private async analyzeCompliance(securityData: SecurityCostData[]): Promise<Map<ComplianceFramework, ComplianceMetrics>> {
    const complianceMap = new Map<ComplianceFramework, ComplianceMetrics>();

    for (const framework of this.configuration.primaryFrameworks) {
      const metrics = this.analyzeFrameworkCompliance(framework, securityData);
      complianceMap.set(framework, metrics);
    }

    return complianceMap;
  }

  private analyzeFrameworkCompliance(framework: ComplianceFramework, securityData: SecurityCostData[]): ComplianceMetrics {
    const requirements = this.getFrameworkRequirements(framework);
    const gaps = this.identifyComplianceGaps(framework, securityData);

    const compliantRequirements = requirements.filter(req => req.status === 'COMPLIANT').length;
    const overallScore = (compliantRequirements / requirements.length) * 100;

    const estimatedCostToComply = gaps.reduce((sum, gap) => sum + gap.estimatedCost, 0);

    return {
      framework,
      overallScore,
      requirements,
      gaps,
      estimatedCostToComply
    };
  }

  private getFrameworkRequirements(framework: ComplianceFramework): ComplianceRequirement[] {
    const requirementTemplates = {
      [ComplianceFramework.SOC2]: [
        { id: 'CC6.1', description: 'Logical and physical access controls', baseCompliance: 0.7 },
        { id: 'CC6.2', description: 'Authentication and authorization', baseCompliance: 0.8 },
        { id: 'CC6.3', description: 'System access authorization', baseCompliance: 0.6 },
        { id: 'CC7.1', description: 'System monitoring', baseCompliance: 0.5 },
        { id: 'CC7.2', description: 'Change management', baseCompliance: 0.4 }
      ],
      [ComplianceFramework.ISO27001]: [
        { id: 'A.9.1', description: 'Access control policy', baseCompliance: 0.8 },
        { id: 'A.12.1', description: 'Operational procedures', baseCompliance: 0.6 },
        { id: 'A.12.6', description: 'Technical vulnerability management', baseCompliance: 0.5 },
        { id: 'A.14.1', description: 'Security in development', baseCompliance: 0.4 }
      ]
    };

    const templates = requirementTemplates[framework] || requirementTemplates[ComplianceFramework.SOC2];

    return templates.map(template => ({
      id: template.id,
      description: template.description,
      status: Math.random() < template.baseCompliance ? 'COMPLIANT' :
              Math.random() < 0.5 ? 'PARTIAL' : 'NON_COMPLIANT',
      resources: this.getRandomResourceIds(Math.floor(Math.random() * 5) + 1),
      remediationCost: Math.random() * 2000 + 500
    }));
  }

  private getRandomResourceIds(count: number): string[] {
    return Array.from({ length: count }, (_, i) => `resource-${Math.floor(Math.random() * 1000) + i}`);
  }

  private identifyComplianceGaps(framework: ComplianceFramework, securityData: SecurityCostData[]): ComplianceGap[] {
    const gaps: ComplianceGap[] = [];

    // Mock compliance gap generation
    const gapCount = Math.floor(Math.random() * 3) + 1;

    for (let i = 0; i < gapCount; i++) {
      gaps.push({
        requirement: `${framework} requirement ${i + 1}`,
        severity: this.getRandomSeverity(),
        description: `Compliance gap identified in ${framework} framework`,
        affectedResources: Math.floor(Math.random() * 10) + 1,
        estimatedCost: Math.random() * 5000 + 1000,
        timeline: `${Math.floor(Math.random() * 8) + 2} weeks`
      });
    }

    return gaps;
  }

  private generateMockTrendData(): SecurityTrendData {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    return {
      costTrend: months.map(month => ({
        month,
        cost: Math.random() * 2000 + 1000
      })),
      riskTrend: months.map(month => ({
        month,
        riskScore: Math.random() * 30 + 40
      })),
      complianceTrend: months.map(month => ({
        month,
        score: Math.random() * 20 + 70
      })),
      incidentCostTrend: months.map(month => ({
        month,
        cost: Math.random() * 10000 + 5000,
        incidents: Math.floor(Math.random() * 5) + 1
      }))
    };
  }

  private initializeSecurityPricing(): void {
    // Initialize security feature pricing data (mock implementation)
    // In production, this would load from cloud provider APIs or pricing databases
  }

  generateMockSecurityData(resourceCount: number = 50): any[] {
    const providers = [CloudProvider.AWS, CloudProvider.GCP, CloudProvider.AZURE];
    const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-north-1', 'asia-pacific-1'];
    const resourceTypes = ['compute', 'storage', 'database', 'network', 'serverless'];

    return Array.from({ length: resourceCount }, (_, i) => ({
      id: `sec-resource-${i + 1}`,
      type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
      provider: providers[Math.floor(Math.random() * providers.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      tags: {
        environment: ['production', 'staging', 'development'][Math.floor(Math.random() * 3)],
        team: ['security', 'backend', 'frontend', 'data'][Math.floor(Math.random() * 4)],
        criticality: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)]
      },
      cost: Math.random() * 1000 + 100,
      utilization: Math.random() * 0.8 + 0.1
    }));
  }
}

interface SecurityFeaturePricing {
  provider: CloudProvider;
  feature: string;
  pricingModel: 'FIXED' | 'USAGE_BASED' | 'TIERED';
  baseCost: number;
  additionalCosts?: { [key: string]: number };
}