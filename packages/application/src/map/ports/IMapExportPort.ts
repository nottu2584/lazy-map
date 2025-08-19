import { GridMap } from '@lazy-map/domain';

/**
 * Export format options
 */
export enum ExportFormat {
  JSON = 'json',
  PNG = 'png',
  SVG = 'svg',
  PDF = 'pdf',
}

/**
 * Export options for customizing output
 */
export interface ExportOptions {
  format: ExportFormat;
  includeGrid?: boolean;
  includeCoordinates?: boolean;
  includeFeatures?: boolean;
  includeTerrain?: boolean;
  scale?: number;
  backgroundColor?: string;
  
  // Image-specific options
  width?: number;
  height?: number;
  dpi?: number;
  
  // Feature-specific options
  showTreeDetails?: boolean;
  showElevation?: boolean;
  colorScheme?: 'realistic' | 'topographic' | 'fantasy';
}

/**
 * Export result
 */
export interface ExportResult {
  success: boolean;
  data?: Buffer | string;
  mimeType?: string;
  filename?: string;
  error?: string;
  metadata?: {
    format: ExportFormat;
    size: number;
    generatedAt: Date;
    mapId: string;
    mapName: string;
  };
}

/**
 * Output port for exporting maps to various formats
 */
export interface IMapExportPort {
  /**
   * Exports a map to the specified format
   */
  exportMap(map: GridMap, options: ExportOptions): Promise<ExportResult>;

  /**
   * Gets supported export formats
   */
  getSupportedFormats(): ExportFormat[];

  /**
   * Gets default export options for a format
   */
  getDefaultOptions(format: ExportFormat): ExportOptions;

  /**
   * Validates export options
   */
  validateOptions(options: ExportOptions): string[];

  /**
   * Gets estimated export file size
   */
  estimateFileSize(map: GridMap, options: ExportOptions): Promise<number>;

  /**
   * Exports map data only (without visual rendering)
   */
  exportMapData(map: GridMap): Promise<ExportResult>;
}