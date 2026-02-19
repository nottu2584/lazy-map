import { MapGrid } from '@lazy-map/domain';
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
    map: MapGrid, 
    options: ExportOptions
  ): Promise<ExportResult> {
    try {
      switch (options.format) {
        case ExportFormat.JSON:
          return await this.exportToJson(map, options);
        case ExportFormat.PNG:
          return await this.exportToPng(map, options);
        case ExportFormat.SVG:
          return await this.exportToSvg(map, options);
        default:
          throw new Error(`Unsupported export format: ${options.format}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown export error'
      };
    }
  }

  async exportToJson(map: MapGrid, options: ExportOptions): Promise<ExportResult> {
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

    // Always include basic metadata
    exportData.metadata = {
      generatedAt: new Date(),
      mapId: map.id.value,
      mapName: map.name || 'Untitled Map'
    };

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
            terrainType: tile.terrainType,
            heightMultiplier: tile.heightMultiplier,
            movementCost: tile.movementCost,
            isBlocked: tile.isBlocked,
            // Include any additional tile data
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

    const jsonString = JSON.stringify(exportData, null, 2);
    const buffer = Buffer.from(jsonString, 'utf8');

    return {
      success: true,
      data: buffer,
      mimeType: 'application/json',
      filename: `${this.sanitizeFilename(map.name)}.json`,
      metadata: {
        format: ExportFormat.JSON,
        size: buffer.length,
        generatedAt: new Date(),
        mapId: map.id.value,
        mapName: map.name || 'Untitled Map'
      }
    };
  }

  async exportToCsv(map: MapGrid, _options: ExportOptions): Promise<ExportResult> {
    const delimiter = ',';
    const includeHeaders = true;

    const rows: string[] = [];

    // Headers
    if (includeHeaders) {
      const headers = ['x', 'y', 'terrainType', 'heightMultiplier', 'movementCost', 'isBlocked'];
      // Headers without custom properties
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
            this.escapeCsvField(tile.terrainType, delimiter),
            tile.heightMultiplier.toString(),
            tile.movementCost.toString(),
            tile.isBlocked.toString()
          ];

          // Custom properties removed for simplicity

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
      metadata: {
        format: ExportFormat.JSON, // Placeholder - no CSV in enum
        size: buffer.length,
        generatedAt: new Date(),
        mapId: map.id.value,
        mapName: map.name || 'Untitled Map'
      }
    };
  }

  async exportToPng(map: MapGrid, options: ExportOptions): Promise<ExportResult> {
    // This is a placeholder implementation
    // In a real implementation, you would use a library like 'canvas' or 'sharp'
    // to generate actual PNG images
    
    const width = options.width || map.dimensions.width * 32;
    const height = options.height || map.dimensions.height * 32;

    // Create a simple text-based representation for now
    const placeholder = `PNG Export Placeholder for "${map.name}" (${width}x${height})`;
    const buffer = Buffer.from(placeholder, 'utf8');

    return {
      success: true,
      data: buffer,
      mimeType: 'image/png',
      filename: `${this.sanitizeFilename(map.name)}.png`,
      metadata: {
        format: ExportFormat.PNG,
        size: buffer.length,
        generatedAt: new Date(),
        mapId: map.id.value,
        mapName: map.name || 'Untitled Map'
      },
      error: 'PNG export is not fully implemented - returning placeholder'
    };
  }

  async exportToSvg(map: MapGrid, options: ExportOptions): Promise<ExportResult> {
    const cellSize = 10; // Fixed cell size for SVG
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
          const color = this.getTerrainColor(tile.terrainType);
          const opacity = tile.isBlocked ? 0.5 : 1.0;
          
          svgElements.push(
            `<rect x="${rectX}" y="${rectY}" width="${cellSize}" height="${cellSize}" ` +
            `fill="${color}" opacity="${opacity}" title="${tile.terrainType}"/>`
          );
        }
      }
    }

    // Grid lines (optional)
    if (options.includeGrid) {
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
      metadata: {
        format: ExportFormat.SVG,
        size: buffer.length,
        generatedAt: new Date(),
        mapId: map.id.value,
        mapName: map.name || 'Untitled Map'
      }
    };
  }

  getSupportedFormats(): ExportFormat[] {
    return [ExportFormat.JSON, ExportFormat.PNG, ExportFormat.SVG];
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

  getDefaultOptions(format: ExportFormat): ExportOptions {
    const baseOptions: ExportOptions = {
      format,
      includeGrid: false,
      includeCoordinates: false,
      includeFeatures: true,
      includeTerrain: true,
      scale: 1,
      backgroundColor: '#FFFFFF'
    };

    switch (format) {
      case ExportFormat.PNG:
        return {
          ...baseOptions,
          width: 800,
          height: 600,
          dpi: 72
        };
      case ExportFormat.SVG:
        return {
          ...baseOptions,
          includeGrid: true
        };
      default:
        return baseOptions;
    }
  }

  validateOptions(options: ExportOptions): string[] {
    const errors: string[] = [];

    if (!options.format) {
      errors.push('Format is required');
    }

    if (options.scale && options.scale <= 0) {
      errors.push('Scale must be positive');
    }

    if (options.width && options.width <= 0) {
      errors.push('Width must be positive');
    }

    if (options.height && options.height <= 0) {
      errors.push('Height must be positive');
    }

    return errors;
  }

  async estimateFileSize(map: MapGrid, options: ExportOptions): Promise<number> {
    const tileCount = map.dimensions.width * map.dimensions.height;
    
    switch (options.format) {
      case ExportFormat.JSON:
        // Estimate ~100 bytes per tile for JSON
        return tileCount * 100;
      case ExportFormat.PNG:
        const width = options.width || 800;
        const height = options.height || 600;
        // Estimate ~3 bytes per pixel (RGB)
        return width * height * 3;
      case ExportFormat.SVG:
        // Estimate ~150 bytes per tile for SVG
        return tileCount * 150;
      default:
        return tileCount * 50;
    }
  }

}