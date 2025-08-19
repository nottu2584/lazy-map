// Core geometric types
export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Map export formats
export enum ExportFormat {
  JSON = 'json',
  PNG = 'png',
  SVG = 'svg',
  PDF = 'pdf',
}

export interface ExportOptions {
  format: ExportFormat;
  includeGrid: boolean;
  includeCoordinates: boolean;
  scale: number;
  backgroundColor?: string;
}

// Map filter and search
export interface MapFilter {
  author?: string;
  tags?: string[];
  minDimensions?: Dimensions;
  maxDimensions?: Dimensions;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface MapSearchQuery {
  query?: string;
  filter?: MapFilter;
  sort?: 'createdAt' | 'updatedAt' | 'name';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Basic metadata interface that other packages can extend
export interface BaseMetadata {
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  description?: string;
  tags?: string[];
}
