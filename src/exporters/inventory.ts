import { writeFileSync } from 'fs';
import { ResourceInventory, InventoryExportOptions, ResourceBase } from '../types/providers';
import { exportToXlsx, ExportData } from './xlsx-exporter';

export class InventoryExporter {
  static async exportInventory(
    inventory: ResourceInventory,
    options: InventoryExportOptions,
    filename?: string
  ): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = filename || `inventory-${inventory.provider}-${timestamp}`;

    switch (options.format) {
      case 'json':
        return this.exportToJSON(inventory, options, baseFilename);
      case 'csv':
        return this.exportToCSV(inventory, options, baseFilename);
      case 'xlsx':
        return this.exportToXLSX(inventory, options, baseFilename);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private static exportToJSON(
    inventory: ResourceInventory,
    options: InventoryExportOptions,
    baseFilename: string
  ): string {
    const filename = `${baseFilename}.json`;

    let exportData: any = {
      summary: {
        provider: inventory.provider,
        region: inventory.region,
        totalResources: inventory.totalResources,
        totalCost: inventory.totalCost,
        lastUpdated: inventory.lastUpdated,
        resourcesByType: inventory.resourcesByType
      }
    };

    if (options.includeMetadata) {
      exportData.resources = inventory.resources;
    } else {
      // Include only basic resource information
      exportData.resources = {};
      Object.entries(inventory.resources).forEach(([type, resources]) => {
        exportData.resources[type] = resources.map(resource => ({
          id: resource.id,
          name: resource.name,
          state: resource.state,
          region: resource.region,
          ...(options.includeCosts && { costToDate: resource.costToDate })
        }));
      });
    }

    if (options.groupByProvider || options.groupByRegion) {
      exportData = this.groupExportData(exportData, options);
    }

    writeFileSync(filename, JSON.stringify(exportData, null, 2));
    return filename;
  }

  private static exportToCSV(
    inventory: ResourceInventory,
    options: InventoryExportOptions,
    baseFilename: string
  ): string {
    const filename = `${baseFilename}.csv`;

    // Flatten all resources into a single array
    const allResources: Array<ResourceBase & { resourceType: string }> = [];

    Object.entries(inventory.resources).forEach(([type, resources]) => {
      resources.forEach(resource => {
        allResources.push({
          ...resource,
          resourceType: type
        });
      });
    });

    if (allResources.length === 0) {
      writeFileSync(filename, 'No resources found\\n');
      return filename;
    }

    // Define CSV headers
    const baseHeaders = [
      'resourceType',
      'id',
      'name',
      'state',
      'region',
      'provider',
      'createdAt'
    ];

    const costHeaders = options.includeCosts ? ['costToDate'] : [];
    const metadataHeaders = options.includeMetadata ? ['tags'] : [];

    const headers = [...baseHeaders, ...costHeaders, ...metadataHeaders];

    // Generate CSV content
    const csvLines = [headers.join(',')];

    allResources.forEach(resource => {
      const row = [
        resource.resourceType,
        `"${resource.id}"`,
        `"${resource.name}"`,
        `"${resource.state}"`,
        `"${resource.region}"`,
        resource.provider,
        resource.createdAt.toISOString()
      ];

      if (options.includeCosts) {
        row.push((resource.costToDate || 0).toString());
      }

      if (options.includeMetadata) {
        const tagsStr = resource.tags ? JSON.stringify(resource.tags).replace(/"/g, '""') : '';
        row.push(`"${tagsStr}"`);
      }

      csvLines.push(row.join(','));
    });

    writeFileSync(filename, csvLines.join('\\n'));
    return filename;
  }

  private static async exportToXLSX(
    inventory: ResourceInventory,
    options: InventoryExportOptions,
    baseFilename: string
  ): Promise<string> {
    const exportData: ExportData = {
      provider: inventory.provider,
      accountInfo: {
        id: 'inventory-export',
        name: `${inventory.provider.toUpperCase()} Inventory`
      },
      inventory
    };

    const xlsxOptions = {
      filename: `${baseFilename}.xlsx`,
      includeCharts: true,
      includeFormatting: true,
      includeTrendAnalysis: false,
      includeCrossCloudComparison: false
    };

    return await exportToXlsx(exportData, xlsxOptions);
  }

  private static groupExportData(data: any, options: InventoryExportOptions): any {
    if (options.groupByProvider) {
      return {
        [data.summary.provider]: data
      };
    }

    if (options.groupByRegion) {
      // Since we might have multiple regions, we'd need to split by region
      // This is a simplified implementation
      return {
        [data.summary.region]: data
      };
    }

    return data;
  }
}

export function createInventoryReport(
  inventory: ResourceInventory,
  includeCosts: boolean = false
): string {
  const lines: string[] = [];

  lines.push('# Cloud Resource Inventory Report');
  lines.push('');
  lines.push(`**Provider:** ${inventory.provider.toUpperCase()}`);
  lines.push(`**Region(s):** ${inventory.region}`);
  lines.push(`**Generated:** ${inventory.lastUpdated.toLocaleString()}`);
  lines.push(`**Total Resources:** ${inventory.totalResources}`);

  if (includeCosts && inventory.totalCost > 0) {
    lines.push(`**Total Cost:** $${inventory.totalCost.toFixed(2)}`);
  }

  lines.push('');
  lines.push('## Resource Summary');
  lines.push('');

  Object.entries(inventory.resourcesByType).forEach(([type, count]) => {
    if (count > 0) {
      lines.push(`- **${type.charAt(0).toUpperCase() + type.slice(1)}:** ${count} resources`);
    }
  });

  lines.push('');
  lines.push('## Resource Details');
  lines.push('');

  Object.entries(inventory.resources).forEach(([category, resources]) => {
    if (resources.length > 0) {
      lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)} (${resources.length})`);
      lines.push('');
      lines.push('| Name | State | Region | Created |' + (includeCosts ? ' Cost |' : ' |'));
      lines.push('|------|-------|--------|---------|' + (includeCosts ? '------|' : ''));

      resources.forEach(resource => {
        const name = resource.name || resource.id;
        const state = resource.state;
        const region = resource.region;
        const created = resource.createdAt.toLocaleDateString();
        const cost = includeCosts && resource.costToDate ? ` $${resource.costToDate.toFixed(2)} |` : ' |';

        lines.push(`| ${name} | ${state} | ${region} | ${created} |${cost}`);
      });

      lines.push('');
    }
  });

  return lines.join('\\n');
}