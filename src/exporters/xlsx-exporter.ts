import ExcelJS from 'exceljs';
import path from 'path';
import { CloudProvider, ResourceInventory, CostTrendAnalysis, CostBreakdown } from '../types/providers';
import { CrossCloudComparison } from '../optimization/cross-cloud-optimizer';

export interface XlsxExportOptions {
  filename?: string;
  includeCharts?: boolean;
  includeFormatting?: boolean;
  includeTrendAnalysis?: boolean;
  includeCrossCloudComparison?: boolean;
  outputDirectory?: string;
}

export interface ExportData {
  provider: CloudProvider;
  accountInfo: {
    id: string;
    name?: string;
  };
  inventory?: ResourceInventory;
  costBreakdown?: CostBreakdown;
  trendAnalysis?: CostTrendAnalysis;
  crossCloudComparison?: CrossCloudComparison;
}

export class XlsxExporter {
  private workbook: ExcelJS.Workbook;
  private options: XlsxExportOptions;

  constructor(options: XlsxExportOptions = {}) {
    this.workbook = new ExcelJS.Workbook();
    this.options = {
      filename: options.filename || `infra-cost-report-${new Date().toISOString().split('T')[0]}.xlsx`,
      includeCharts: options.includeCharts !== false,
      includeFormatting: options.includeFormatting !== false,
      includeTrendAnalysis: options.includeTrendAnalysis !== false,
      includeCrossCloudComparison: options.includeCrossCloudComparison !== false,
      outputDirectory: options.outputDirectory || process.cwd()
    };

    this.setupWorkbookProperties();
  }

  private setupWorkbookProperties(): void {
    this.workbook.creator = 'Infra-Cost CLI';
    this.workbook.lastModifiedBy = 'Infra-Cost CLI';
    this.workbook.created = new Date();
    this.workbook.modified = new Date();
    this.workbook.lastPrinted = new Date();

    // Set calculation properties
    this.workbook.calcProperties.fullCalcOnLoad = true;
  }

  public async exportReport(data: ExportData): Promise<string> {
    // Create summary sheet
    await this.createSummarySheet(data);

    // Create cost breakdown sheet
    if (data.costBreakdown) {
      await this.createCostBreakdownSheet(data.costBreakdown, data.provider);
    }

    // Create inventory sheet
    if (data.inventory) {
      await this.createInventorySheet(data.inventory);
    }

    // Create trend analysis sheet
    if (data.trendAnalysis && this.options.includeTrendAnalysis) {
      await this.createTrendAnalysisSheet(data.trendAnalysis);
    }

    // Create cross-cloud comparison sheet
    if (data.crossCloudComparison && this.options.includeCrossCloudComparison) {
      await this.createCrossCloudComparisonSheet(data.crossCloudComparison);
    }

    // Save the workbook
    const outputPath = path.join(this.options.outputDirectory!, this.options.filename!);
    await this.workbook.xlsx.writeFile(outputPath);

    return outputPath;
  }

  private async createSummarySheet(data: ExportData): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Summary', {
      pageSetup: { orientation: 'landscape', fitToPage: true }
    });

    // Apply formatting
    if (this.options.includeFormatting) {
      this.applyHeaderFormatting(worksheet);
    }

    // Title section
    worksheet.mergeCells('A1:H2');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `Infrastructure Cost Report - ${data.provider.toUpperCase()}`;
    titleCell.font = { size: 18, bold: true, color: { argb: 'FFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '366092' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Account Information
    worksheet.getCell('A4').value = 'Account Information';
    worksheet.getCell('A4').font = { bold: true, size: 14 };
    worksheet.getCell('A5').value = 'Account ID:';
    worksheet.getCell('B5').value = data.accountInfo.id;
    worksheet.getCell('A6').value = 'Account Name:';
    worksheet.getCell('B6').value = data.accountInfo.name || 'N/A';
    worksheet.getCell('A7').value = 'Provider:';
    worksheet.getCell('B7').value = data.provider.toUpperCase();
    worksheet.getCell('A8').value = 'Report Date:';
    worksheet.getCell('B8').value = new Date().toLocaleDateString();

    // Cost Summary
    if (data.costBreakdown) {
      worksheet.getCell('A10').value = 'Cost Summary';
      worksheet.getCell('A10').font = { bold: true, size: 14 };

      const costRows = [
        ['This Month:', data.costBreakdown.totals.thisMonth],
        ['Last Month:', data.costBreakdown.totals.lastMonth],
        ['Last 7 Days:', data.costBreakdown.totals.last7Days],
        ['Yesterday:', data.costBreakdown.totals.yesterday]
      ];

      costRows.forEach(([label, value], index) => {
        const row = 11 + index;
        worksheet.getCell(`A${row}`).value = label;
        const valueCell = worksheet.getCell(`B${row}`);
        valueCell.value = value;
        valueCell.numFmt = '$#,##0.00';
        if (this.options.includeFormatting) {
          valueCell.font = { bold: true };
          if (index === 0) { // Highlight current month
            valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E7F3FF' } };
          }
        }
      });
    }

    // Resource Summary
    if (data.inventory) {
      worksheet.getCell('D10').value = 'Resource Summary';
      worksheet.getCell('D10').font = { bold: true, size: 14 };

      const resourceTypes = [
        ['Compute:', data.inventory.resourcesByType.compute],
        ['Storage:', data.inventory.resourcesByType.storage],
        ['Database:', data.inventory.resourcesByType.database],
        ['Network:', data.inventory.resourcesByType.network],
        ['Serverless:', data.inventory.resourcesByType.serverless],
        ['Container:', data.inventory.resourcesByType.container],
        ['Analytics:', data.inventory.resourcesByType.analytics],
        ['Total:', data.inventory.totalResources]
      ];

      resourceTypes.forEach(([label, count], index) => {
        const row = 11 + index;
        worksheet.getCell(`D${row}`).value = label;
        worksheet.getCell(`E${row}`).value = count;
        if (index === resourceTypes.length - 1) { // Total row
          worksheet.getCell(`D${row}`).font = { bold: true };
          worksheet.getCell(`E${row}`).font = { bold: true };
          if (this.options.includeFormatting) {
            worksheet.getCell(`E${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F8E8' } };
          }
        }
      });
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  private async createCostBreakdownSheet(costBreakdown: CostBreakdown, provider: CloudProvider): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Cost Breakdown');

    // Header
    worksheet.mergeCells('A1:D1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = `${provider.toUpperCase()} Cost Breakdown by Service`;
    headerCell.font = { size: 16, bold: true };
    headerCell.alignment = { horizontal: 'center' };

    // Column headers
    const headers = ['Service', 'This Month ($)', 'Last Month ($)', 'Change (%)'];
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(3, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      if (this.options.includeFormatting) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D9EAD3' } };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      }
    });

    // Service data
    const services = Object.keys(costBreakdown.totalsByService.thisMonth);
    let totalThisMonth = 0;
    let totalLastMonth = 0;

    services.forEach((service, index) => {
      const row = 4 + index;
      const thisMonth = costBreakdown.totalsByService.thisMonth[service] || 0;
      const lastMonth = costBreakdown.totalsByService.lastMonth[service] || 0;
      const change = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

      totalThisMonth += thisMonth;
      totalLastMonth += lastMonth;

      worksheet.getCell(row, 1).value = service;
      worksheet.getCell(row, 2).value = thisMonth;
      worksheet.getCell(row, 2).numFmt = '$#,##0.00';
      worksheet.getCell(row, 3).value = lastMonth;
      worksheet.getCell(row, 3).numFmt = '$#,##0.00';
      worksheet.getCell(row, 4).value = change;
      worksheet.getCell(row, 4).numFmt = '0.00%';

      if (this.options.includeFormatting) {
        // Color-code changes
        const changeCell = worksheet.getCell(row, 4);
        if (change > 20) {
          changeCell.font = { color: { argb: 'CC0000' } }; // Red for high increase
        } else if (change < -20) {
          changeCell.font = { color: { argb: '00AA00' } }; // Green for significant decrease
        }
      }
    });

    // Total row
    const totalRow = 4 + services.length + 1;
    worksheet.getCell(totalRow, 1).value = 'TOTAL';
    worksheet.getCell(totalRow, 1).font = { bold: true };
    worksheet.getCell(totalRow, 2).value = totalThisMonth;
    worksheet.getCell(totalRow, 2).numFmt = '$#,##0.00';
    worksheet.getCell(totalRow, 2).font = { bold: true };
    worksheet.getCell(totalRow, 3).value = totalLastMonth;
    worksheet.getCell(totalRow, 3).numFmt = '$#,##0.00';
    worksheet.getCell(totalRow, 3).font = { bold: true };
    const totalChange = totalLastMonth > 0 ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100 : 0;
    worksheet.getCell(totalRow, 4).value = totalChange;
    worksheet.getCell(totalRow, 4).numFmt = '0.00%';
    worksheet.getCell(totalRow, 4).font = { bold: true };

    if (this.options.includeFormatting) {
      // Highlight total row
      for (let col = 1; col <= 4; col++) {
        worksheet.getCell(totalRow, col).fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0F0F0' }
        };
      }
    }

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  private async createInventorySheet(inventory: ResourceInventory): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Resource Inventory');

    // Header
    worksheet.mergeCells('A1:F1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = `${inventory.provider.toUpperCase()} Resource Inventory - ${inventory.region}`;
    headerCell.font = { size: 16, bold: true };
    headerCell.alignment = { horizontal: 'center' };

    // Summary statistics
    worksheet.getCell('A3').value = 'Summary Statistics';
    worksheet.getCell('A3').font = { bold: true, size: 14 };
    worksheet.getCell('A4').value = 'Total Resources:';
    worksheet.getCell('B4').value = inventory.totalResources;
    worksheet.getCell('A5').value = 'Total Cost:';
    worksheet.getCell('B5').value = inventory.totalCost || 0;
    worksheet.getCell('B5').numFmt = '$#,##0.00';
    worksheet.getCell('A6').value = 'Last Updated:';
    worksheet.getCell('B6').value = inventory.lastUpdated;
    worksheet.getCell('B6').numFmt = 'mm/dd/yyyy hh:mm';

    // Resource breakdown by type
    worksheet.getCell('A8').value = 'Resources by Type';
    worksheet.getCell('A8').font = { bold: true, size: 14 };

    const resourceHeaders = ['Resource Type', 'Count', 'Percentage'];
    resourceHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(9, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      if (this.options.includeFormatting) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E1D5E7' } };
      }
    });

    const resourceTypes = Object.entries(inventory.resourcesByType);
    resourceTypes.forEach(([type, count], index) => {
      const row = 10 + index;
      const percentage = inventory.totalResources > 0 ? (count / inventory.totalResources) * 100 : 0;

      worksheet.getCell(row, 1).value = type.charAt(0).toUpperCase() + type.slice(1);
      worksheet.getCell(row, 2).value = count;
      worksheet.getCell(row, 3).value = percentage;
      worksheet.getCell(row, 3).numFmt = '0.0%';
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
  }

  private async createTrendAnalysisSheet(trendAnalysis: CostTrendAnalysis): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Trend Analysis');

    // Header
    worksheet.mergeCells('A1:E1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = 'Cost Trend Analysis';
    headerCell.font = { size: 16, bold: true };
    headerCell.alignment = { horizontal: 'center' };

    // Key metrics
    worksheet.getCell('A3').value = 'Key Metrics';
    worksheet.getCell('A3').font = { bold: true, size: 14 };

    const metrics = [
      ['Total Cost:', trendAnalysis.totalCost, '$#,##0.00'],
      ['Average Daily Cost:', trendAnalysis.averageDailyCost, '$#,##0.00'],
      ['Projected Monthly Cost:', trendAnalysis.projectedMonthlyCost, '$#,##0.00'],
      ['Avg MoM Growth:', trendAnalysis.avgMonthOverMonthGrowth || 0, '0.00%'],
      ['Forecast Accuracy:', (trendAnalysis.forecastAccuracy || 0) / 100, '0.0%']
    ];

    metrics.forEach(([label, value, format], index) => {
      const row = 4 + index;
      worksheet.getCell(row, 1).value = label;
      worksheet.getCell(row, 1).font = { bold: true };
      worksheet.getCell(row, 2).value = value;
      worksheet.getCell(row, 2).numFmt = format;
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 20;
    });
  }

  private async createCrossCloudComparisonSheet(comparison: CrossCloudComparison): Promise<void> {
    const worksheet = this.workbook.addWorksheet('Cross-Cloud Comparison');

    // Header
    worksheet.mergeCells('A1:F1');
    const headerCell = worksheet.getCell('A1');
    headerCell.value = 'Cross-Cloud Cost & Resource Comparison';
    headerCell.font = { size: 16, bold: true };
    headerCell.alignment = { horizontal: 'center' };

    // Provider comparison table
    worksheet.getCell('A3').value = 'Provider Comparison';
    worksheet.getCell('A3').font = { bold: true, size: 14 };

    const comparisonHeaders = ['Provider', 'Monthly Cost ($)', 'Resource Count', 'Cost per Resource ($)'];
    comparisonHeaders.forEach((header, index) => {
      const cell = worksheet.getCell(4, index + 1);
      cell.value = header;
      cell.font = { bold: true };
      if (this.options.includeFormatting) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D5E8D4' } };
      }
    });

    comparison.providers.forEach((provider, index) => {
      const row = 5 + index;
      const cost = comparison.totalCostComparison[provider] || 0;
      const resourceCount = comparison.resourceCountComparison[provider] || 0;
      const costPerResource = comparison.costPerResourceComparison[provider] || 0;

      worksheet.getCell(row, 1).value = provider.toUpperCase();
      worksheet.getCell(row, 2).value = cost;
      worksheet.getCell(row, 2).numFmt = '$#,##0.00';
      worksheet.getCell(row, 3).value = resourceCount;
      worksheet.getCell(row, 4).value = costPerResource;
      worksheet.getCell(row, 4).numFmt = '$#,##0.00';
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 25;
    });
  }

  private applyHeaderFormatting(worksheet: ExcelJS.Worksheet): void {
    // Set default row height
    worksheet.properties.defaultRowHeight = 20;

    // Apply alternating row colors for better readability
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber > 3 && rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F8F9FA' }
        };
      }
    });
  }
}

// Helper function to export data easily
export async function exportToXlsx(data: ExportData, options?: XlsxExportOptions): Promise<string> {
  const exporter = new XlsxExporter(options);
  return await exporter.exportReport(data);
}