import { ResourceInventory, ResourceBase, CloudProvider } from '../types/providers';

export interface ResourceDependency {
  sourceResourceId: string;
  targetResourceId: string;
  dependencyType: 'NETWORK' | 'SECURITY' | 'STORAGE' | 'COMPUTE' | 'CONFIGURATION' | 'DATA_FLOW';
  relationship: 'PARENT_CHILD' | 'PEER_TO_PEER' | 'DEPENDS_ON' | 'PROVIDES_TO';
  strength: 'WEAK' | 'MODERATE' | 'STRONG' | 'CRITICAL';
  bidirectional: boolean;
  description?: string;
}

export interface DependencyGraph {
  nodes: ResourceNode[];
  edges: ResourceEdge[];
  clusters: ResourceCluster[];
  isolatedResources: string[];
  criticalPaths: CriticalPath[];
}

export interface ResourceNode {
  id: string;
  name: string;
  type: string;
  provider: CloudProvider;
  tags: Record<string, string>;
  costImpact: number;
  dependencyCount: number;
  dependentCount: number;
  criticalityScore: number;
}

export interface ResourceEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  weight: number;
  metadata: Record<string, any>;
}

export interface ResourceCluster {
  id: string;
  name: string;
  resources: string[];
  totalCost: number;
  purpose: string;
  tags: Record<string, string>;
}

export interface CriticalPath {
  id: string;
  resources: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impactScope: string[];
  description: string;
  recommendations: string[];
}

export interface TaggingStandard {
  key: string;
  required: boolean;
  description: string;
  validValues?: string[];
  pattern?: string;
  category: 'BUSINESS' | 'TECHNICAL' | 'FINANCIAL' | 'OPERATIONAL';
  examples: string[];
}

export interface TagComplianceReport {
  overallComplianceScore: number;
  resourceCompliance: ResourceTagCompliance[];
  missingTags: MissingTagReport[];
  invalidTags: InvalidTagReport[];
  recommendations: TaggingRecommendation[];
  standardsViolations: StandardViolation[];
}

export interface ResourceTagCompliance {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  complianceScore: number;
  presentTags: string[];
  missingTags: string[];
  invalidTags: string[];
}

export interface MissingTagReport {
  tagKey: string;
  affectedResources: string[];
  impactLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  businessJustification: string;
}

export interface InvalidTagReport {
  resourceId: string;
  tagKey: string;
  currentValue: string;
  expectedPattern?: string;
  validValues?: string[];
  suggestion?: string;
}

export interface TaggingRecommendation {
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  category: string;
  title: string;
  description: string;
  affectedResources: string[];
  implementation: string[];
  benefits: string[];
}

export interface StandardViolation {
  standard: string;
  violationType: 'MISSING_REQUIRED' | 'INVALID_VALUE' | 'PATTERN_MISMATCH' | 'INCONSISTENT_NAMING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resourceId: string;
  details: string;
  remediation: string;
}

export class DependencyMapper {
  private inventory: ResourceInventory;
  private dependencies: ResourceDependency[] = [];

  constructor(inventory: ResourceInventory) {
    this.inventory = inventory;
  }

  public async mapDependencies(): Promise<DependencyGraph> {
    // Analyze different types of dependencies
    await this.analyzeNetworkDependencies();
    await this.analyzeSecurityDependencies();
    await this.analyzeStorageDependencies();
    await this.analyzeComputeDependencies();
    await this.analyzeConfigurationDependencies();

    // Build dependency graph
    const graph = this.buildDependencyGraph();

    // Identify clusters and critical paths
    graph.clusters = this.identifyClusters(graph);
    graph.criticalPaths = this.identifyCriticalPaths(graph);
    graph.isolatedResources = this.findIsolatedResources(graph);

    return graph;
  }

  private async analyzeNetworkDependencies(): Promise<void> {
    const networkResources = this.inventory.resources.network;
    const computeResources = [...this.inventory.resources.compute, ...this.inventory.resources.container];

    // VPC/Network to resource dependencies
    networkResources.forEach(network => {
      computeResources.forEach(compute => {
        if (this.isInSameNetwork(network, compute)) {
          this.dependencies.push({
            sourceResourceId: network.id,
            targetResourceId: compute.id,
            dependencyType: 'NETWORK',
            relationship: 'PROVIDES_TO',
            strength: 'CRITICAL',
            bidirectional: false,
            description: `Network ${network.name} provides connectivity to ${compute.name}`
          });
        }
      });
    });

    // Load balancer dependencies
    const loadBalancers = networkResources.filter(r => r.name.toLowerCase().includes('load') || r.name.toLowerCase().includes('lb'));
    loadBalancers.forEach(lb => {
      computeResources.forEach(compute => {
        if (this.isLoadBalancerTarget(lb, compute)) {
          this.dependencies.push({
            sourceResourceId: lb.id,
            targetResourceId: compute.id,
            dependencyType: 'NETWORK',
            relationship: 'DEPENDS_ON',
            strength: 'STRONG',
            bidirectional: false,
            description: `Load balancer ${lb.name} routes traffic to ${compute.name}`
          });
        }
      });
    });
  }

  private async analyzeSecurityDependencies(): Promise<void> {
    const securityResources = this.inventory.resources.security;
    const allResources = this.getAllResources();

    securityResources.forEach(security => {
      allResources.forEach(resource => {
        if (resource.id !== security.id && this.hasSecurityAssociation(security, resource)) {
          this.dependencies.push({
            sourceResourceId: security.id,
            targetResourceId: resource.id,
            dependencyType: 'SECURITY',
            relationship: 'PROVIDES_TO',
            strength: 'STRONG',
            bidirectional: false,
            description: `Security resource ${security.name} protects ${resource.name}`
          });
        }
      });
    });
  }

  private async analyzeStorageDependencies(): Promise<void> {
    const storageResources = this.inventory.resources.storage;
    const computeResources = [...this.inventory.resources.compute, ...this.inventory.resources.container];

    storageResources.forEach(storage => {
      computeResources.forEach(compute => {
        if (this.hasStorageAttachment(storage, compute)) {
          this.dependencies.push({
            sourceResourceId: storage.id,
            targetResourceId: compute.id,
            dependencyType: 'STORAGE',
            relationship: 'PROVIDES_TO',
            strength: 'CRITICAL',
            bidirectional: false,
            description: `Storage ${storage.name} provides data to ${compute.name}`
          });
        }
      });
    });
  }

  private async analyzeComputeDependencies(): Promise<void> {
    const computeResources = this.inventory.resources.compute;

    // Auto-scaling group dependencies
    computeResources.forEach(compute => {
      if (this.isAutoScalingMember(compute)) {
        const asgResources = computeResources.filter(c =>
          c.id !== compute.id && this.isInSameAutoScalingGroup(compute, c)
        );

        asgResources.forEach(peer => {
          this.dependencies.push({
            sourceResourceId: compute.id,
            targetResourceId: peer.id,
            dependencyType: 'COMPUTE',
            relationship: 'PEER_TO_PEER',
            strength: 'MODERATE',
            bidirectional: true,
            description: `${compute.name} and ${peer.name} are in the same auto-scaling group`
          });
        });
      }
    });
  }

  private async analyzeConfigurationDependencies(): Promise<void> {
    const allResources = this.getAllResources();

    // Tag-based dependencies (resources with shared project/environment tags)
    allResources.forEach(resource => {
      allResources.forEach(other => {
        if (resource.id !== other.id && this.hasSharedContext(resource, other)) {
          const strength = this.calculateConfigurationStrength(resource, other);
          this.dependencies.push({
            sourceResourceId: resource.id,
            targetResourceId: other.id,
            dependencyType: 'CONFIGURATION',
            relationship: 'PEER_TO_PEER',
            strength,
            bidirectional: true,
            description: `${resource.name} and ${other.name} share configuration context`
          });
        }
      });
    });
  }

  private buildDependencyGraph(): DependencyGraph {
    const nodes: ResourceNode[] = [];
    const edges: ResourceEdge[] = [];

    // Create nodes for all resources
    this.getAllResources().forEach(resource => {
      const dependencyCount = this.dependencies.filter(d => d.sourceResourceId === resource.id).length;
      const dependentCount = this.dependencies.filter(d => d.targetResourceId === resource.id).length;

      nodes.push({
        id: resource.id,
        name: resource.name,
        type: this.getResourceCategory(resource),
        provider: resource.provider,
        tags: resource.tags || {},
        costImpact: resource.costToDate || 0,
        dependencyCount,
        dependentCount,
        criticalityScore: this.calculateCriticalityScore(resource, dependencyCount, dependentCount)
      });
    });

    // Create edges for dependencies
    this.dependencies.forEach((dep, index) => {
      edges.push({
        id: `edge-${index}`,
        source: dep.sourceResourceId,
        target: dep.targetResourceId,
        type: dep.dependencyType,
        weight: this.getDependencyWeight(dep),
        metadata: {
          relationship: dep.relationship,
          strength: dep.strength,
          bidirectional: dep.bidirectional,
          description: dep.description
        }
      });
    });

    return {
      nodes,
      edges,
      clusters: [],
      isolatedResources: [],
      criticalPaths: []
    };
  }

  private identifyClusters(graph: DependencyGraph): ResourceCluster[] {
    const clusters: ResourceCluster[] = [];
    const visited = new Set<string>();

    // Simple clustering based on high interconnectivity
    graph.nodes.forEach(node => {
      if (visited.has(node.id)) return;

      const connectedNodes = this.findConnectedComponents(graph, node.id);
      if (connectedNodes.length > 2) { // Only cluster if more than 2 resources
        const cluster: ResourceCluster = {
          id: `cluster-${clusters.length}`,
          name: this.generateClusterName(connectedNodes, graph),
          resources: connectedNodes,
          totalCost: connectedNodes.reduce((sum, nodeId) => {
            const nodeData = graph.nodes.find(n => n.id === nodeId);
            return sum + (nodeData?.costImpact || 0);
          }, 0),
          purpose: this.inferClusterPurpose(connectedNodes, graph),
          tags: this.extractCommonTags(connectedNodes, graph)
        };

        clusters.push(cluster);
        connectedNodes.forEach(nodeId => visited.add(nodeId));
      }
    });

    return clusters;
  }

  private identifyCriticalPaths(graph: DependencyGraph): CriticalPath[] {
    const criticalPaths: CriticalPath[] = [];

    // Find paths with high-criticality resources
    const criticalNodes = graph.nodes.filter(n => n.criticalityScore > 0.8);

    criticalNodes.forEach(node => {
      const dependentPath = this.traceDependentPath(graph, node.id);
      if (dependentPath.length > 1) {
        const riskLevel = this.assessPathRiskLevel(dependentPath, graph);

        criticalPaths.push({
          id: `path-${criticalPaths.length}`,
          resources: dependentPath,
          riskLevel,
          impactScope: this.calculateImpactScope(dependentPath, graph),
          description: `Critical dependency path starting from ${node.name}`,
          recommendations: this.generatePathRecommendations(dependentPath, graph, riskLevel)
        });
      }
    });

    return criticalPaths;
  }

  private findIsolatedResources(graph: DependencyGraph): string[] {
    return graph.nodes
      .filter(node => node.dependencyCount === 0 && node.dependentCount === 0)
      .map(node => node.id);
  }

  // Helper methods for dependency analysis
  private isInSameNetwork(network: ResourceBase, compute: ResourceBase): boolean {
    // Simplified network association logic
    if (!network.tags || !compute.tags) return false;
    return network.tags['NetworkId'] === compute.tags['NetworkId'] ||
           network.tags['VPC'] === compute.tags['VPC'];
  }

  private isLoadBalancerTarget(lb: ResourceBase, compute: ResourceBase): boolean {
    // Simplified load balancer target logic
    return lb.tags?.['TargetGroup'] === compute.tags?.['TargetGroup'] ||
           (lb.region === compute.region && compute.tags?.['LoadBalancer'] === lb.name);
  }

  private hasSecurityAssociation(security: ResourceBase, resource: ResourceBase): boolean {
    // Simplified security association logic
    return security.tags?.['SecurityGroup'] === resource.tags?.['SecurityGroup'] ||
           resource.tags?.['SecurityPolicy'] === security.name;
  }

  private hasStorageAttachment(storage: ResourceBase, compute: ResourceBase): boolean {
    // Simplified storage attachment logic
    return storage.tags?.['AttachedTo'] === compute.id ||
           compute.tags?.['Storage'] === storage.name;
  }

  private isAutoScalingMember(compute: ResourceBase): boolean {
    return Boolean(compute.tags?.['AutoScalingGroup']);
  }

  private isInSameAutoScalingGroup(compute1: ResourceBase, compute2: ResourceBase): boolean {
    return compute1.tags?.['AutoScalingGroup'] === compute2.tags?.['AutoScalingGroup'];
  }

  private hasSharedContext(resource1: ResourceBase, resource2: ResourceBase): boolean {
    if (!resource1.tags || !resource2.tags) return false;

    const sharedKeys = ['Project', 'Environment', 'Team', 'Application', 'Service'];
    return sharedKeys.some(key =>
      resource1.tags![key] && resource2.tags![key] &&
      resource1.tags![key] === resource2.tags![key]
    );
  }

  private calculateConfigurationStrength(resource1: ResourceBase, resource2: ResourceBase): 'WEAK' | 'MODERATE' | 'STRONG' | 'CRITICAL' {
    const sharedTags = this.countSharedTags(resource1, resource2);
    if (sharedTags >= 3) return 'STRONG';
    if (sharedTags >= 2) return 'MODERATE';
    return 'WEAK';
  }

  private countSharedTags(resource1: ResourceBase, resource2: ResourceBase): number {
    if (!resource1.tags || !resource2.tags) return 0;

    return Object.keys(resource1.tags).filter(key =>
      resource2.tags![key] === resource1.tags![key]
    ).length;
  }

  private getAllResources(): ResourceBase[] {
    return Object.values(this.inventory.resources).flat();
  }

  private getResourceCategory(resource: ResourceBase): string {
    // Determine resource category from type or name patterns
    const name = resource.name.toLowerCase();
    if (name.includes('compute') || name.includes('instance') || name.includes('vm')) return 'compute';
    if (name.includes('storage') || name.includes('bucket') || name.includes('disk')) return 'storage';
    if (name.includes('database') || name.includes('db') || name.includes('sql')) return 'database';
    if (name.includes('network') || name.includes('vpc') || name.includes('subnet')) return 'network';
    return 'other';
  }

  private calculateCriticalityScore(resource: ResourceBase, dependencyCount: number, dependentCount: number): number {
    let score = 0;

    // Cost impact (30%)
    score += Math.min((resource.costToDate || 0) / 1000, 1) * 0.3;

    // Dependency count (35%)
    score += Math.min(dependencyCount / 10, 1) * 0.35;

    // Dependent count (35%)
    score += Math.min(dependentCount / 10, 1) * 0.35;

    return Math.min(score, 1);
  }

  private getDependencyWeight(dep: ResourceDependency): number {
    const strengthWeights = { 'WEAK': 0.25, 'MODERATE': 0.5, 'STRONG': 0.75, 'CRITICAL': 1.0 };
    return strengthWeights[dep.strength];
  }

  private findConnectedComponents(graph: DependencyGraph, startNodeId: string): string[] {
    const visited = new Set<string>();
    const queue = [startNodeId];
    const component: string[] = [];

    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      component.push(nodeId);

      // Find connected nodes
      const connectedEdges = graph.edges.filter(e =>
        e.source === nodeId || e.target === nodeId
      );

      connectedEdges.forEach(edge => {
        const nextNode = edge.source === nodeId ? edge.target : edge.source;
        if (!visited.has(nextNode)) {
          queue.push(nextNode);
        }
      });
    }

    return component;
  }

  private generateClusterName(nodeIds: string[], graph: DependencyGraph): string {
    const nodes = nodeIds.map(id => graph.nodes.find(n => n.id === id)!);
    const commonTags = this.findMostCommonTag(nodes);

    if (commonTags.Project) return `${commonTags.Project} Cluster`;
    if (commonTags.Service) return `${commonTags.Service} Service`;
    if (commonTags.Environment) return `${commonTags.Environment} Environment`;

    return `Resource Cluster ${Math.random().toString(36).substr(2, 5)}`;
  }

  private inferClusterPurpose(nodeIds: string[], graph: DependencyGraph): string {
    const nodes = nodeIds.map(id => graph.nodes.find(n => n.id === id)!);
    const types = nodes.map(n => n.type);

    if (types.includes('compute') && types.includes('storage') && types.includes('database')) {
      return 'Full-stack application cluster';
    } else if (types.includes('compute') && types.includes('network')) {
      return 'Compute and networking cluster';
    } else if (types.includes('storage') && types.includes('database')) {
      return 'Data storage cluster';
    }

    return 'Mixed resource cluster';
  }

  private extractCommonTags(nodeIds: string[], graph: DependencyGraph): Record<string, string> {
    const nodes = nodeIds.map(id => graph.nodes.find(n => n.id === id)!);
    return this.findMostCommonTag(nodes);
  }

  private findMostCommonTag(nodes: ResourceNode[]): Record<string, string> {
    const tagCounts: Record<string, Record<string, number>> = {};

    nodes.forEach(node => {
      Object.entries(node.tags).forEach(([key, value]) => {
        if (!tagCounts[key]) tagCounts[key] = {};
        tagCounts[key][value] = (tagCounts[key][value] || 0) + 1;
      });
    });

    const commonTags: Record<string, string> = {};
    Object.entries(tagCounts).forEach(([key, valueCounts]) => {
      const maxCount = Math.max(...Object.values(valueCounts));
      if (maxCount > nodes.length / 2) { // More than half have this tag value
        const mostCommonValue = Object.entries(valueCounts)
          .find(([, count]) => count === maxCount)?.[0];
        if (mostCommonValue) {
          commonTags[key] = mostCommonValue;
        }
      }
    });

    return commonTags;
  }

  private traceDependentPath(graph: DependencyGraph, startNodeId: string): string[] {
    const path = [startNodeId];
    const visited = new Set([startNodeId]);

    let currentNode = startNodeId;
    while (true) {
      const outgoingEdges = graph.edges.filter(e =>
        e.source === currentNode && !visited.has(e.target)
      );

      if (outgoingEdges.length === 0) break;

      // Follow the highest weight edge
      const nextEdge = outgoingEdges.reduce((max, edge) =>
        edge.weight > max.weight ? edge : max
      );

      currentNode = nextEdge.target;
      path.push(currentNode);
      visited.add(currentNode);

      if (path.length > 10) break; // Prevent infinite loops
    }

    return path;
  }

  private assessPathRiskLevel(path: string[], graph: DependencyGraph): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    const nodes = path.map(id => graph.nodes.find(n => n.id === id)!);
    const avgCriticality = nodes.reduce((sum, node) => sum + node.criticalityScore, 0) / nodes.length;
    const totalCost = nodes.reduce((sum, node) => sum + node.costImpact, 0);

    if (avgCriticality > 0.8 || totalCost > 5000) return 'CRITICAL';
    if (avgCriticality > 0.6 || totalCost > 2000) return 'HIGH';
    if (avgCriticality > 0.4 || totalCost > 500) return 'MEDIUM';
    return 'LOW';
  }

  private calculateImpactScope(path: string[], graph: DependencyGraph): string[] {
    const impactedResources = new Set<string>();

    path.forEach(nodeId => {
      // Find all resources that depend on this node
      const dependentEdges = graph.edges.filter(e => e.source === nodeId);
      dependentEdges.forEach(edge => impactedResources.add(edge.target));
    });

    return Array.from(impactedResources);
  }

  private generatePathRecommendations(path: string[], graph: DependencyGraph, riskLevel: string): string[] {
    const recommendations: string[] = [];

    if (riskLevel === 'CRITICAL') {
      recommendations.push('Implement redundancy and failover mechanisms for critical path components');
      recommendations.push('Consider breaking up monolithic dependencies into smaller, more resilient components');
      recommendations.push('Establish comprehensive monitoring and alerting for all resources in this critical path');
    }

    if (path.length > 5) {
      recommendations.push('Consider simplifying the dependency chain to reduce complexity and failure points');
    }

    const highCostNodes = path.filter(nodeId => {
      const node = graph.nodes.find(n => n.id === nodeId);
      return node && node.costImpact > 1000;
    });

    if (highCostNodes.length > 0) {
      recommendations.push('Review high-cost resources in this path for optimization opportunities');
    }

    return recommendations;
  }
}

// Tagging Standards and Compliance Analyzer
export class TaggingStandardsAnalyzer {
  private inventory: ResourceInventory;
  private standards: TaggingStandard[];

  constructor(inventory: ResourceInventory) {
    this.inventory = inventory;
    this.standards = this.getDefaultTaggingStandards();
  }

  public setCustomStandards(standards: TaggingStandard[]): void {
    this.standards = standards;
  }

  public analyzeCompliance(): TagComplianceReport {
    const resourceCompliance = this.analyzeResourceCompliance();
    const missingTags = this.identifyMissingTags(resourceCompliance);
    const invalidTags = this.identifyInvalidTags();
    const recommendations = this.generateRecommendations(resourceCompliance, missingTags, invalidTags);
    const standardsViolations = this.identifyStandardsViolations(resourceCompliance);

    const overallComplianceScore = this.calculateOverallCompliance(resourceCompliance);

    return {
      overallComplianceScore,
      resourceCompliance,
      missingTags,
      invalidTags,
      recommendations,
      standardsViolations
    };
  }

  private getDefaultTaggingStandards(): TaggingStandard[] {
    return [
      {
        key: 'Environment',
        required: true,
        description: 'Deployment environment (e.g., dev, staging, prod)',
        validValues: ['dev', 'development', 'staging', 'prod', 'production'],
        category: 'OPERATIONAL',
        examples: ['prod', 'staging']
      },
      {
        key: 'Project',
        required: true,
        description: 'Project or application name',
        category: 'BUSINESS',
        examples: ['web-app', 'mobile-api', 'data-pipeline']
      },
      {
        key: 'Owner',
        required: true,
        description: 'Team or person responsible for the resource',
        category: 'OPERATIONAL',
        examples: ['platform-team', 'frontend-team', 'john.doe@company.com']
      },
      {
        key: 'CostCenter',
        required: true,
        description: 'Cost center for billing purposes',
        pattern: '^CC-[0-9]{4}$',
        category: 'FINANCIAL',
        examples: ['CC-1001', 'CC-2002']
      },
      {
        key: 'Service',
        required: false,
        description: 'Service or component name',
        category: 'TECHNICAL',
        examples: ['web-frontend', 'user-api', 'payment-service']
      },
      {
        key: 'Version',
        required: false,
        description: 'Version of the service or application',
        pattern: '^v[0-9]+\\.[0-9]+\\.[0-9]+$',
        category: 'TECHNICAL',
        examples: ['v1.2.3', 'v2.0.1']
      },
      {
        key: 'Backup',
        required: false,
        description: 'Backup requirement level',
        validValues: ['none', 'daily', 'weekly', 'critical'],
        category: 'OPERATIONAL',
        examples: ['daily', 'critical']
      }
    ];
  }

  private analyzeResourceCompliance(): ResourceTagCompliance[] {
    const allResources = this.getAllResources();

    return allResources.map(resource => {
      const presentTags = Object.keys(resource.tags || {});
      const requiredTags = this.standards.filter(s => s.required).map(s => s.key);
      const missingTags = requiredTags.filter(tag => !presentTags.includes(tag));
      const invalidTags = this.getInvalidTagsForResource(resource);

      const complianceScore = this.calculateResourceCompliance(presentTags, missingTags, invalidTags);

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: this.getResourceCategory(resource),
        complianceScore,
        presentTags,
        missingTags,
        invalidTags: invalidTags.map(i => i.tagKey)
      };
    });
  }

  private identifyMissingTags(resourceCompliance: ResourceTagCompliance[]): MissingTagReport[] {
    const missingTagsMap: Record<string, string[]> = {};

    resourceCompliance.forEach(rc => {
      rc.missingTags.forEach(tag => {
        if (!missingTagsMap[tag]) missingTagsMap[tag] = [];
        missingTagsMap[tag].push(rc.resourceId);
      });
    });

    return Object.entries(missingTagsMap).map(([tagKey, affectedResources]) => {
      const standard = this.standards.find(s => s.key === tagKey);
      const impactLevel = this.assessMissingTagImpact(tagKey, affectedResources.length);

      return {
        tagKey,
        affectedResources,
        impactLevel,
        businessJustification: standard?.description || 'Important for resource management'
      };
    });
  }

  private identifyInvalidTags(): InvalidTagReport[] {
    const invalidTags: InvalidTagReport[] = [];
    const allResources = this.getAllResources();

    allResources.forEach(resource => {
      const resourceInvalidTags = this.getInvalidTagsForResource(resource);
      invalidTags.push(...resourceInvalidTags);
    });

    return invalidTags;
  }

  private generateRecommendations(
    resourceCompliance: ResourceTagCompliance[],
    missingTags: MissingTagReport[],
    invalidTags: InvalidTagReport[]
  ): TaggingRecommendation[] {
    const recommendations: TaggingRecommendation[] = [];

    // High-impact missing tags
    const criticalMissingTags = missingTags.filter(mt => mt.impactLevel === 'HIGH');
    if (criticalMissingTags.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'COMPLIANCE',
        title: 'Address Critical Missing Tags',
        description: `${criticalMissingTags.length} critical tags are missing across multiple resources`,
        affectedResources: criticalMissingTags.flatMap(mt => mt.affectedResources),
        implementation: [
          'Create tagging automation scripts or policies',
          'Implement resource creation templates with required tags',
          'Set up alerts for resources created without required tags'
        ],
        benefits: [
          'Improved cost allocation and tracking',
          'Better resource management and governance',
          'Enhanced compliance reporting'
        ]
      });
    }

    // Low compliance resources
    const lowComplianceResources = resourceCompliance.filter(rc => rc.complianceScore < 0.5);
    if (lowComplianceResources.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'GOVERNANCE',
        title: 'Improve Low-Compliance Resources',
        description: `${lowComplianceResources.length} resources have poor tagging compliance`,
        affectedResources: lowComplianceResources.map(rc => rc.resourceId),
        implementation: [
          'Audit and update existing resource tags',
          'Implement tagging policies and enforcement',
          'Train teams on tagging best practices'
        ],
        benefits: [
          'Consistent resource identification',
          'Improved operational efficiency',
          'Better cost visibility'
        ]
      });
    }

    // Invalid tag patterns
    if (invalidTags.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'STANDARDIZATION',
        title: 'Fix Invalid Tag Values',
        description: `${invalidTags.length} tags have invalid values that don't match standards`,
        affectedResources: [...new Set(invalidTags.map(it => it.resourceId))],
        implementation: [
          'Update tag values to match defined patterns',
          'Implement validation rules in deployment pipelines',
          'Create tag value documentation and examples'
        ],
        benefits: [
          'Consistent naming conventions',
          'Improved automated processing',
          'Better reporting accuracy'
        ]
      });
    }

    return recommendations;
  }

  private identifyStandardsViolations(resourceCompliance: ResourceTagCompliance[]): StandardViolation[] {
    const violations: StandardViolation[] = [];

    resourceCompliance.forEach(rc => {
      // Missing required tags
      rc.missingTags.forEach(tagKey => {
        const standard = this.standards.find(s => s.key === tagKey && s.required);
        if (standard) {
          violations.push({
            standard: `Required tag: ${tagKey}`,
            violationType: 'MISSING_REQUIRED',
            severity: 'HIGH',
            resourceId: rc.resourceId,
            details: `Resource is missing required tag: ${tagKey}`,
            remediation: `Add the ${tagKey} tag with an appropriate value`
          });
        }
      });
    });

    return violations;
  }

  private calculateResourceCompliance(presentTags: string[], missingTags: string[], invalidTags: InvalidTagReport[]): number {
    const requiredTagsCount = this.standards.filter(s => s.required).length;
    const presentRequiredTags = this.standards.filter(s => s.required && presentTags.includes(s.key)).length;

    let score = presentRequiredTags / requiredTagsCount;

    // Penalty for invalid tags
    const invalidPenalty = invalidTags.length * 0.1;
    score = Math.max(0, score - invalidPenalty);

    return Math.min(1, score);
  }

  private getInvalidTagsForResource(resource: ResourceBase): InvalidTagReport[] {
    const invalidTags: InvalidTagReport[] = [];

    if (!resource.tags) return invalidTags;

    Object.entries(resource.tags).forEach(([key, value]) => {
      const standard = this.standards.find(s => s.key === key);
      if (!standard) return;

      // Check valid values
      if (standard.validValues && !standard.validValues.includes(value)) {
        invalidTags.push({
          resourceId: resource.id,
          tagKey: key,
          currentValue: value,
          validValues: standard.validValues,
          suggestion: this.suggestValidValue(value, standard.validValues)
        });
      }

      // Check pattern
      if (standard.pattern && !new RegExp(standard.pattern).test(value)) {
        invalidTags.push({
          resourceId: resource.id,
          tagKey: key,
          currentValue: value,
          expectedPattern: standard.pattern,
          suggestion: `Value should match pattern: ${standard.pattern}`
        });
      }
    });

    return invalidTags;
  }

  private assessMissingTagImpact(tagKey: string, affectedResourceCount: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    const standard = this.standards.find(s => s.key === tagKey);

    if (standard?.required && affectedResourceCount > 10) return 'HIGH';
    if (standard?.required && affectedResourceCount > 3) return 'MEDIUM';
    if (affectedResourceCount > 20) return 'MEDIUM';

    return 'LOW';
  }

  private suggestValidValue(currentValue: string, validValues: string[]): string {
    // Simple string similarity matching
    const similarities = validValues.map(valid => ({
      value: valid,
      score: this.calculateSimilarity(currentValue.toLowerCase(), valid.toLowerCase())
    }));

    const bestMatch = similarities.reduce((best, current) =>
      current.score > best.score ? current : best
    );

    return bestMatch.score > 0.5 ? bestMatch.value : validValues[0];
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.calculateEditDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private calculateEditDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + substitutionCost // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateOverallCompliance(resourceCompliance: ResourceTagCompliance[]): number {
    if (resourceCompliance.length === 0) return 0;

    const totalScore = resourceCompliance.reduce((sum, rc) => sum + rc.complianceScore, 0);
    return totalScore / resourceCompliance.length;
  }

  private getAllResources(): ResourceBase[] {
    return Object.values(this.inventory.resources).flat();
  }

  private getResourceCategory(resource: ResourceBase): string {
    // Same logic as in DependencyMapper
    const name = resource.name.toLowerCase();
    if (name.includes('compute') || name.includes('instance') || name.includes('vm')) return 'compute';
    if (name.includes('storage') || name.includes('bucket') || name.includes('disk')) return 'storage';
    if (name.includes('database') || name.includes('db') || name.includes('sql')) return 'database';
    if (name.includes('network') || name.includes('vpc') || name.includes('subnet')) return 'network';
    return 'other';
  }
}