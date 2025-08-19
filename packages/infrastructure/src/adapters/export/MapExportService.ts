import { GridMap } from '@lazy-map/domain';
import { 
  IMapExportPort, 
  ExportFormat, 
  ExportOptions, 
  ExportResult 
} from '@lazy-map/application';

/**
 * Map export service implementation
 * Supports multiple export formats for maps
 */
export class MapExportService implements IMapExportPort {
  async exportMap(
    map: GridMap, 
    format: ExportFormat, 
    options: ExportOptions = {}
  ): Promise<ExportResult> {
    try {
      switch (format) {
        case 'json':
          return await this.exportToJson(map, options);
        case 'csv':
          return await this.exportToCsv(map, options);
        case 'png':
          return await this.exportToPng(map, options);
        case 'svg':
          return await this.exportToSvg(map, options);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  async exportToJson(map: GridMap, options: ExportOptions): Promise<ExportResult> {
    const includeMetadata = options.includeMetadata !== false;
    const includeFeatures = options.includeFeatures !== false;

    const exportData: any = {
      id: map.id.value,
      name: map.name,
      dimensions: {
        width: map.dimensions.width,
        height: map.dimensions.height
      },
      cellSize: map.cellSize
    };

    if (includeMetadata) {
      exportData.metadata = {
        createdAt: map.metadata.createdAt,
        updatedAt: map.metadata.updatedAt,
        author: map.metadata.author,
        description: map.metadata.description,
        tags: map.metadata.tags
      };
    }

    // Export tiles
    exportData.tiles = [];
    for (let y = 0; y < map.dimensions.height; y++) {
      const row = [];
      for (let x = 0; x < map.dimensions.width; x++) {
        const position = { x, y };
        const tile = map.getTile(position as any); // Position conversion needed
        
        if (tile) {
          row.push({
            position: { x, y },
            terrainType: tile.terrainType.name,
            heightMultiplier: tile.heightMultiplier,
            movementCost: tile.movementCost,
            isBlocked: tile.isBlocked,
            ...(options.includeCustomProperties && tile.customProperties ? 
               { customProperties: tile.customProperties } : {})
          });
        } else {
          row.push(null);
        }
      }
      exportData.tiles.push(row);
    }

    // Features would be exported here if includeFeatures is true
    if (includeFeatures) {
      exportData.features = []; // Placeholder - would need feature loading
    }

    const jsonString = JSON.stringify(exportData, null, options.prettify ? 2 : 0);
    const buffer = Buffer.from(jsonString, 'utf8');

    return {
      success: true,
      data: buffer,
      mimeType: 'application/json',
      filename: `${this.sanitizeFilename(map.name)}.json`,
      size: buffer.length
    };
  }

  async exportToCsv(map: GridMap, options: ExportOptions): Promise<ExportResult> {
    const delimiter = options.csvDelimiter || ',';
    const includeHeaders = options.includeHeaders !== false;

    const rows: string[] = [];

    // Headers
    if (includeHeaders) {
      const headers = ['x', 'y', 'terrainType', 'heightMultiplier', 'movementCost', 'isBlocked'];
      if (options.includeCustomProperties) {
        headers.push('customProperties');
      }
      rows.push(headers.join(delimiter));
    }

    // Data rows
    for (let y = 0; y < map.dimensions.height; y++) {
      for (let x = 0; x < map.dimensions.width; x++) {
        const position = { x, y };
        const tile = map.getTile(position as any);
        
        if (tile) {
          const row = [
            x.toString(),
            y.toString(),
            this.escapeCsvField(tile.terrainType.name, delimiter),
            tile.heightMultiplier.toString(),
            tile.movementCost.toString(),
            tile.isBlocked.toString()
          ];

          if (options.includeCustomProperties && tile.customProperties) {
            row.push(this.escapeCsvField(JSON.stringify(tile.customProperties), delimiter));
          }

          rows.push(row.join(delimiter));
        }
      }
    }

    const csvString = rows.join('\n');
    const buffer = Buffer.from(csvString, 'utf8');

    return {
      success: true,
      data: buffer,
      mimeType: 'text/csv',
      filename: `${this.sanitizeFilename(map.name)}.csv`,
      size: buffer.length
    };
  }

  async exportToPng(map: GridMap, options: ExportOptions): Promise<ExportResult> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like 'canvas' or 'sharp'
    // to generate actual PNG images
    
    const width = options.imageWidth || map.dimensions.width * (map.cellSize || 32);
    const height = options.imageHeight || map.dimensions.height * (map.cellSize || 32);

    // Create a simple text-based representation for now
    const placeholder = `PNG Export Placeholder for "${map.name}" (${width}x${height})`;
    const buffer = Buffer.from(placeholder, 'utf8');

    return {
      success: true,
      data: buffer,
      mimeType: 'image/png',
      filename: `${this.sanitizeFilename(map.name)}.png`,
      size: buffer.length,
      warnings: ['PNG export is not fully implemented - returning placeholder']
    };
  }

  async exportToSvg(map: GridMap, options: ExportOptions): Promise<ExportResult> {
    const cellSize = options.cellSize || 10;
    const width = map.dimensions.width * cellSize;
    const height = map.dimensions.height * cellSize;

    const svgElements: string[] = [];
    
    // SVG header
    svgElements.push(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`);
    
    // Title
    svgElements.push(`<title>${this.escapeXml(map.name)}</title>`);
    
    // Grid
    for (let y = 0; y < map.dimensions.height; y++) {
      for (let x = 0; x < map.dimensions.width; x++) {
        const position = { x, y };
        const tile = map.getTile(position as any);
        
        if (tile) {
          const rectX = x * cellSize;
          const rectY = y * cellSize;
          const color = this.getTerrainColor(tile.terrainType.name);
          const opacity = tile.isBlocked ? 0.5 : 1.0;
          
          svgElements.push(
            `<rect x="${rectX}" y="${rectY}" width="${cellSize}" height="${cellSize}" ` +
            `fill="${color}" opacity="${opacity}" title="${tile.terrainType.name}"/>`
          );
        }
      }
    }

    // Grid lines (optional)
    if (options.showGrid) {
      svgElements.push(`<defs><pattern id="grid" width="${cellSize}" height="${cellSize}" patternUnits="userSpaceOnUse">`);
      svgElements.push(`<path d="M ${cellSize} 0 L 0 0 0 ${cellSize}" fill="none" stroke="gray" stroke-width="0.5"/>`);
      svgElements.push('</pattern></defs>');
      svgElements.push(`<rect width="100%" height="100%" fill="url(#grid)"/>`);
    }

    svgElements.push('</svg>');

    const svgString = svgElements.join('\n');
    const buffer = Buffer.from(svgString, 'utf8');

    return {
      success: true,
      data: buffer,
      mimeType: 'image/svg+xml',
      filename: `${this.sanitizeFilename(map.name)}.svg`,
      size: buffer.length
    };
  }

  async getSupportedFormats(): Promise<ExportFormat[]> {
    return ['json', 'csv', 'png', 'svg'];
  }

  async validateExportOptions(format: ExportFormat, options: ExportOptions): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Format-specific validation
    switch (format) {
      case 'csv':
        if (options.csvDelimiter && options.csvDelimiter.length !== 1) {
          errors.push('CSV delimiter must be a single character');
        }
        break;
      
      case 'png':
        if (options.imageWidth && options.imageWidth <= 0) {
          errors.push('Image width must be positive');
        }
        if (options.imageHeight && options.imageHeight <= 0) {
          errors.push('Image height must be positive');
        }
        if (options.imageWidth && options.imageWidth > 10000) {
          warnings.push('Very large image width may cause performance issues');
        }
        break;

      case 'svg':
        if (options.cellSize && options.cellSize <= 0) {
          errors.push('Cell size must be positive');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Utility methods
  private sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  }

  private escapeCsvField(field: string, delimiter: string): string {
    if (field.includes(delimiter) || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  }

  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private getTerrainColor(terrainType: string): string {
    // Simple color mapping for terrain types
    const colorMap: Record<string, string> = {
      'grassland': '#90EE90',
      'forest': '#228B22',
      'mountain': '#8B7355',
      'water': '#4169E1',
      'desert': '#F4A460',
      'swamp': '#556B2F',
      'ice': '#E0FFFF',
      'lava': '#FF4500'
    };

    return colorMap[terrainType.toLowerCase()] || '#CCCCCC';
  }
}