#!/usr/bin/env node

import { MultiCloudDashboard } from '../visualization/multi-cloud-dashboard';
import { CloudProvider } from '../types/providers';

/**
 * Demo script to test multi-cloud dashboard functionality
 * This will show what the dashboard looks like even without real cloud credentials
 */
async function testMultiCloudDashboard() {
  console.log('🚀 Testing Multi-Cloud Dashboard...\n');

  try {
    const dashboard = new MultiCloudDashboard();

    console.log('📊 Test 1: Full Multi-Cloud Dashboard');
    console.log('─'.repeat(50));

    const fullDashboard = await dashboard.generateMultiCloudInventoryDashboard();
    console.log(fullDashboard);

    console.log('\n📊 Test 2: Specific Providers Dashboard (AWS + GCP)');
    console.log('─'.repeat(50));

    const specificProviders = await dashboard.generateMultiCloudInventoryDashboard([
      CloudProvider.AWS,
      CloudProvider.GOOGLE_CLOUD
    ]);
    console.log(specificProviders);

    console.log('\n✅ Multi-Cloud Dashboard tests completed!');
    console.log('\n💡 Usage Examples:');
    console.log('   infra-cost --multi-cloud-dashboard');
    console.log('   infra-cost --all-clouds-inventory');
    console.log('   infra-cost --multi-cloud-dashboard --compare-clouds aws,gcp,azure');
    console.log('   infra-cost --inventory --all-profiles');

  } catch (error) {
    console.error('❌ Error testing multi-cloud dashboard:', error instanceof Error ? error.message : error);
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testMultiCloudDashboard();
}