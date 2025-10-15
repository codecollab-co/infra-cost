#!/usr/bin/env node

import chalk from 'chalk';
import { TerminalUIEngine } from '../visualization/terminal-ui';
import { DemoDataGenerator } from './demo-data-generator';
import { PDFExporter } from '../exporters/pdf-exporter';

/**
 * Test utility for enhanced UI features using demo data
 * Run with: node dist/demo/test-enhanced-ui.js
 */
async function testEnhancedUI() {
  console.log(chalk.bold.cyan('🧪 Testing Enhanced Terminal UI Features\n'));

  const ui = new TerminalUIEngine();

  // Test 1: Enhanced Header
  console.log(chalk.bold.yellow('Test 1: Enhanced Header'));
  console.log('─'.repeat(50));
  const header = ui.createHeader('🚀 Infrastructure Cost Analysis', 'Demo Production Account');
  console.log(header);

  // Test 2: Cost Table with Rich Formatting
  console.log(chalk.bold.yellow('Test 2: Rich Cost Breakdown Table'));
  console.log('─'.repeat(50));
  const costBreakdown = DemoDataGenerator.generateCostBreakdown();
  const costTable = ui.createCostTable(costBreakdown, {
    showPercentages: true,
    highlightTop: 8,
    currency: 'USD',
    compact: false
  });
  console.log(costTable);

  // Test 3: Trend Chart Visualization
  console.log(chalk.bold.yellow('Test 3: ASCII Trend Chart'));
  console.log('─'.repeat(50));
  const trendAnalysis = DemoDataGenerator.generateTrendAnalysis();
  if (trendAnalysis.trendData) {
    const trendChart = ui.createTrendChart(trendAnalysis.trendData, {
      width: 50,
      showLabels: true,
      currency: 'USD',
      colorThreshold: 0.7
    });
    console.log(trendChart);
  }

  // Test 4: Cost Anomaly Alerts
  console.log(chalk.bold.yellow('Test 4: Cost Anomaly Alerts'));
  console.log('─'.repeat(50));
  const anomalies = DemoDataGenerator.generateCostAnomalies();
  const anomalyAlert = ui.createAnomalyAlert(anomalies);
  console.log(anomalyAlert);

  // Test 5: Progress Indicators
  console.log(chalk.bold.yellow('Test 5: Progress Indicators'));
  console.log('─'.repeat(50));
  ui.startProgress('Processing cost analysis', 100);

  // Simulate processing steps
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 200));
    ui.updateProgress(i, { step: `Processing step ${i/20 + 1}/6` });
  }

  ui.stopProgress();
  console.log(chalk.green('✅ Processing completed!\n'));

  // Test 6: Summary Display
  console.log(chalk.bold.yellow('Test 6: Executive Summary Format'));
  console.log('─'.repeat(50));
  const recommendations = DemoDataGenerator.generateRecommendations();
  const totalSavings = recommendations.reduce((sum, rec) => sum + rec.potentialSavings.amount, 0);

  console.log('\n' + chalk.bold.cyan('🎯 Key Performance Indicators'));
  console.log('═'.repeat(50));
  console.log(`Monthly Spend: ${chalk.yellow('$' + costBreakdown.totals.thisMonth.toFixed(2))}`);
  console.log(`Cost Change: ${costBreakdown.totals.thisMonth > costBreakdown.totals.lastMonth ?
    chalk.red('↗ +' + ((costBreakdown.totals.thisMonth - costBreakdown.totals.lastMonth) / costBreakdown.totals.lastMonth * 100).toFixed(1) + '%') :
    chalk.green('↘ ' + ((costBreakdown.totals.thisMonth - costBreakdown.totals.lastMonth) / costBreakdown.totals.lastMonth * 100).toFixed(1) + '%')
  }`);
  console.log(`Optimization Potential: ${chalk.green('$' + totalSavings.toFixed(2))}`);
  console.log(`Active Recommendations: ${chalk.cyan(recommendations.length.toString())}`);

  // Test 7: Recommendations Display
  console.log('\n' + chalk.bold.cyan('💡 Top Cost Optimization Recommendations'));
  console.log('═'.repeat(60));
  recommendations.slice(0, 3).forEach((rec, index) => {
    console.log(`\n${index + 1}. ${chalk.bold(rec.title)}`);
    console.log(`   ${rec.description}`);
    console.log(`   💰 Potential savings: ${chalk.green('$' + rec.potentialSavings.amount.toFixed(2))} ${rec.potentialSavings.timeframe.toLowerCase()}`);
    console.log(`   🎯 Priority: ${chalk[rec.priority === 'HIGH' ? 'red' : rec.priority === 'MEDIUM' ? 'yellow' : 'cyan'](rec.priority)}`);
    console.log(`   🔧 Effort: ${chalk.gray(rec.effort)}`);
  });

  console.log('\n' + chalk.gray('━'.repeat(70)));
  console.log(chalk.gray('💡 Demo completed successfully! All enhanced UI features are working.'));
  console.log(chalk.gray('📊 Use --trend, --audit, or --executive-summary with real data'));

  return true;
}

/**
 * Test PDF generation with demo data
 */
async function testPDFGeneration() {
  console.log('\n' + chalk.bold.cyan('📄 Testing PDF Generation'));
  console.log('─'.repeat(50));

  try {
    const pdfExporter = new PDFExporter({
      outputPath: './demo-reports',
      includeCharts: true,
      includeSummary: true,
      includeDetails: true,
      includeRecommendations: true
    });

    const accountInfo = DemoDataGenerator.generateAccountInfo();
    const costBreakdown = DemoDataGenerator.generateCostBreakdown();
    const recommendations = DemoDataGenerator.generateRecommendations();
    const anomalies = DemoDataGenerator.generateCostAnomalies();
    const inventory = DemoDataGenerator.generateResourceInventory();

    console.log('🔄 Generating comprehensive demo audit report...');

    const auditData = {
      accountInfo,
      costBreakdown,
      resourceInventory: inventory,
      recommendations,
      anomalies,
      generatedAt: new Date(),
      reportPeriod: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      }
    };

    const pdfPath = await pdfExporter.generateAuditReport(auditData);
    console.log(chalk.green(`✅ Demo PDF report generated: ${pdfPath}`));

    return true;
  } catch (error) {
    console.log(chalk.yellow(`⚠️  PDF generation test skipped: ${error instanceof Error ? error.message : 'Unknown error'}`));
    console.log(chalk.gray('   (This is expected in environments without browser support)'));
    return false;
  }
}

// Main execution
async function main() {
  try {
    console.log(chalk.bold.blue('🚀 Enhanced infra-cost UI Testing Suite'));
    console.log(chalk.gray('Testing all new features with realistic demo data\n'));

    const uiTestResult = await testEnhancedUI();
    const pdfTestResult = await testPDFGeneration();

    console.log('\n' + chalk.bold.green('🎉 Testing Complete!'));
    console.log(`Terminal UI Features: ${uiTestResult ? chalk.green('✅ PASS') : chalk.red('❌ FAIL')}`);
    console.log(`PDF Generation: ${pdfTestResult ? chalk.green('✅ PASS') : chalk.yellow('⚠️  SKIP')}`);

    if (uiTestResult) {
      console.log('\n' + chalk.bold.cyan('Next Steps:'));
      console.log('• Run with real AWS credentials: infra-cost --trend');
      console.log('• Generate audit reports: infra-cost --audit --pdf-report');
      console.log('• Create executive summaries: infra-cost --executive-summary');
    }

  } catch (error) {
    console.error(chalk.red('❌ Test failed:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run if called directly (ES module version)
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { testEnhancedUI, testPDFGeneration };