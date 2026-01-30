/**
 * Oracle Cloud Infrastructure (OCI) Provider Export
 *
 * Main entry point for OCI provider.
 * Exports the complete OracleCloudProvider implementation.
 */

export { OracleCloudProvider } from './oracle/provider';
export { createOracleClientConfig, validateOracleConfig } from './oracle/config';
export { listCompartments, getTenancyInfo } from './oracle/compartment';
export { getCompartmentCostBreakdown } from './oracle/cost';
export {
  discoverComputeInstances,
  discoverBlockVolumes,
  discoverAutonomousDatabases,
  discoverOKEClusters,
  discoverAllResources,
} from './oracle/inventory';
export { getBudgets, getBudgetAlerts } from './oracle/budget';
export {
  getMultiCompartmentCostBreakdown,
  getTenancyCostBreakdown,
} from './oracle/multi-compartment';
