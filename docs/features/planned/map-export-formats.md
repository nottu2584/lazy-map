# Map Export Formats

## Status & Metadata
- **Status**: Planned
- **Priority**: Medium
- **Effort**: 2 weeks
- **Architecture Impact**: Infrastructure Layer
- **Owner**: TBD
- **Last Updated**: November 2024

## Problem & Goals

### Problem Statement
The map export functionality is currently non-functional or incomplete:

1. **PNG Export Returns Text** - Instead of generating actual images, returns placeholder text
2. **PDF Export Not Implemented** - Shown in UI but throws "not implemented" alert
3. **SVG Export Partially Done** - Basic implementation exists but incomplete
4. **CSV Format Missing from Enum** - Export works but format not in ExportFormat enum
5. **No Resolution Options** - Cannot specify image quality or size
6. **No Batch Export** - Cannot export multiple maps at once

### Current Implementation
```typescript
// Current PNG "implementation" - just returns text
async exportToPng(map: MapGrid, options: ExportOptions): Promise<ExportResult> {
  const placeholder = `PNG Export Placeholder for "${map.name}"`;
  const buffer = Buffer.from(placeholder, 'utf8');
  return {
    success: true,
    data: buffer,
    mimeType: 'image/png',
    error: 'PNG export is not fully implemented - returning placeholder'
  };
}
```

### Goals
- Implement actual image generation for PNG/JPEG formats
- Complete PDF export with proper formatting
- Finish SVG export implementation
- Add resolution and quality options
- Support batch export functionality
- Add export presets (print, web, VTT)

## Proposed Solution

### Phase 1: Image Export (Week 1)

#### PNG Export Implementation
```typescript
import { createCanvas, Canvas } from 'canvas';
import sharp from 'sharp';

class MapImageRenderer {
  private readonly TILE_COLORS = {
    grass: '#7CB342',
    dirt: '#8D6E63',
    stone: '#757575',
    water: '#1976D2',
    marsh: '#4E342E',
    sand: '#FFD54F',
    snow: '#ECEFF1'
  };

  async renderToPNG(map: MapGrid, options: ExportOptions): Promise<Buffer> {
    const tileSize = options.tileSize || 32;
    const width = map.dimensions.width * tileSize;
    const height = map.dimensions.height * tileSize;

    // Create canvas
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Render background
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    // Render tiles
    for (let y = 0; y < map.dimensions.height; y++) {
      for (let x = 0; x < map.dimensions.width; x++) {
        const tile = map.getTileAt(x, y);
        if (tile) {
          this.renderTile(ctx, tile, x * tileSize, y * tileSize, tileSize);
        }
      }
    }

    // Render features if enabled
    if (options.includeFeatures) {
      this.renderFeatures(ctx, map, tileSize);
    }

    // Add grid overlay if requested
    if (options.showGrid) {
      this.renderGrid(ctx, width, height, tileSize);
    }

    // Convert to buffer with quality settings
    const buffer = canvas.toBuffer('image/png', {
      compressionLevel: options.compressionLevel || 6,
      filters: canvas.PNG_ALL_FILTERS
    });

    // Optionally resize with sharp for better quality
    if (options.scale && options.scale !== 1) {
      return sharp(buffer)
        .resize(Math.round(width * options.scale))
        .png({ quality: options.quality || 90 })
        .toBuffer();
    }

    return buffer;
  }

  private renderTile(ctx: CanvasRenderingContext2D, tile: Tile, x: number, y: number, size: number) {
    // Base terrain color
    ctx.fillStyle = this.TILE_COLORS[tile.terrain.type] || '#999999';
    ctx.fillRect(x, y, size, size);

    // Add elevation shading
    if (tile.elevation > 0) {
      const shade = Math.min(tile.elevation * 0.1, 0.3);
      ctx.fillStyle = `rgba(0, 0, 0, ${shade})`;
      ctx.fillRect(x, y, size, size);
    }

    // Add tile border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.strokeRect(x, y, size, size);
  }
}
```

#### JPEG Export
```typescript
async renderToJPEG(map: MapGrid, options: ExportOptions): Promise<Buffer> {
  const pngBuffer = await this.renderToPNG(map, options);

  return sharp(pngBuffer)
    .jpeg({
      quality: options.quality || 85,
      progressive: true
    })
    .toBuffer();
}
```

### Phase 2: Vector Export (Week 1)

#### Complete SVG Export
```typescript
class MapSVGRenderer {
  async renderToSVG(map: MapGrid, options: ExportOptions): Promise<string> {
    const tileSize = options.tileSize || 10;
    const width = map.dimensions.width * tileSize;
    const height = map.dimensions.height * tileSize;

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
    <svg xmlns="http://www.w3.org/2000/svg"
         width="${width}"
         height="${height}"
         viewBox="0 0 ${width} ${height}">
      <defs>
        ${this.generatePatterns()}
        ${this.generateFilters()}
      </defs>
      <g id="terrain">`;

    // Render terrain tiles
    for (let y = 0; y < map.dimensions.height; y++) {
      for (let x = 0; x < map.dimensions.width; x++) {
        const tile = map.getTileAt(x, y);
        if (tile) {
          svg += this.renderTileSVG(tile, x * tileSize, y * tileSize, tileSize);
        }
      }
    }

    svg += '</g>';

    // Add features layer
    if (options.includeFeatures) {
      svg += '<g id="features">';
      svg += this.renderFeaturesSVG(map, tileSize);
      svg += '</g>';
    }

    // Add grid overlay
    if (options.showGrid) {
      svg += this.renderGridSVG(width, height, tileSize);
    }

    svg += '</svg>';
    return svg;
  }

  private renderTileSVG(tile: Tile, x: number, y: number, size: number): string {
    const color = this.TILE_COLORS[tile.terrain.type];
    return `<rect x="${x}" y="${y}" width="${size}" height="${size}"
            fill="${color}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>`;
  }
}
```

### Phase 3: Document Export (Week 2)

#### PDF Export Implementation
```typescript
import PDFDocument from 'pdfkit';

class MapPDFRenderer {
  async renderToPDF(map: MapGrid, options: ExportOptions): Promise<Buffer> {
    const doc = new PDFDocument({
      size: options.pageSize || 'LETTER',
      layout: options.orientation || 'landscape',
      margin: 50
    });

    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));

    // Add title page
    doc.fontSize(24)
       .text(map.name || 'Tactical Map', { align: 'center' });

    doc.fontSize(12)
       .text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });

    if (map.context) {
      doc.moveDown()
         .text(`Biome: ${map.context.biome}`)
         .text(`Elevation: ${map.context.elevation}`)
         .text(`Development: ${map.context.development}`);
    }

    // Add map image
    doc.addPage();
    const imageBuffer = await this.renderToPNG(map, {
      ...options,
      tileSize: this.calculateOptimalTileSize(map, doc)
    });

    doc.image(imageBuffer, {
      fit: [doc.page.width - 100, doc.page.height - 100],
      align: 'center',
      valign: 'center'
    });

    // Add legend page
    if (options.includeLegend) {
      doc.addPage();
      this.renderLegend(doc, map);
    }

    // Add grid reference if requested
    if (options.includeGridReference) {
      doc.addPage();
      this.renderGridReference(doc, map);
    }

    doc.end();

    return new Promise((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }

  private renderLegend(doc: PDFDocument, map: MapGrid) {
    doc.fontSize(16).text('Map Legend', { underline: true });
    doc.moveDown();

    // Terrain types
    doc.fontSize(12).text('Terrain Types:');
    Object.entries(this.TERRAIN_COLORS).forEach(([type, color]) => {
      doc.fillColor(color)
         .rect(doc.x, doc.y, 20, 10)
         .fill()
         .fillColor('black')
         .text(`  ${type}`, doc.x + 25, doc.y - 2);
      doc.moveDown(0.5);
    });
  }
}
```

### Export Options Interface
```typescript
interface ExportOptions {
  format: ExportFormat;

  // Image options
  tileSize?: number;        // Pixels per tile
  scale?: number;           // Scale factor (0.5 = half size, 2 = double)
  quality?: number;         // JPEG/PNG quality (0-100)
  compressionLevel?: number; // PNG compression (0-9)

  // Content options
  includeFeatures?: boolean;
  includeGrid?: boolean;
  includeLegend?: boolean;
  includeMetadata?: boolean;

  // PDF options
  pageSize?: 'LETTER' | 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
  includeGridReference?: boolean;

  // Batch options
  maps?: MapGrid[];         // For batch export
  zipOutput?: boolean;      // Zip multiple files

  // Presets
  preset?: 'print' | 'web' | 'vtt' | 'thumbnail';
}

// Export presets
const EXPORT_PRESETS = {
  print: {
    format: ExportFormat.PDF,
    tileSize: 50,
    quality: 100,
    includeGrid: true,
    includeLegend: true,
    pageSize: 'LETTER'
  },
  web: {
    format: ExportFormat.PNG,
    tileSize: 32,
    quality: 85,
    scale: 1
  },
  vtt: {
    format: ExportFormat.PNG,
    tileSize: 70,  // Roll20 standard
    includeGrid: false,
    quality: 90
  },
  thumbnail: {
    format: ExportFormat.JPEG,
    tileSize: 8,
    quality: 70,
    scale: 0.25
  }
};
```

### API Endpoints
```typescript
@Controller('maps')
export class MapsExportController {
  @Get(':id/export/:format')
  async exportMap(
    @Param('id') id: string,
    @Param('format') format: string,
    @Query() options: ExportOptionsDto
  ): Promise<StreamableFile> {
    const map = await this.mapService.findById(id);
    const result = await this.exportService.export(map, {
      ...options,
      format
    });

    return new StreamableFile(result.data, {
      type: result.mimeType,
      disposition: `attachment; filename="${result.filename}"`
    });
  }

  @Post('export/batch')
  async batchExport(@Body() dto: BatchExportDto): Promise<StreamableFile> {
    const maps = await this.mapService.findByIds(dto.mapIds);
    const result = await this.exportService.batchExport(maps, dto.options);

    return new StreamableFile(result.data, {
      type: 'application/zip',
      disposition: `attachment; filename="maps-export.zip"`
    });
  }
}
```

## Technical Requirements

### Dependencies
```json
{
  "canvas": "^2.11.2",
  "sharp": "^0.33.0",
  "pdfkit": "^0.14.0",
  "archiver": "^6.0.1"
}
```

### Performance Considerations
- Large maps may require streaming for PNG/PDF
- Consider worker threads for CPU-intensive rendering
- Implement caching for frequently exported maps
- Add progress tracking for long exports

## Testing Requirements
- Unit tests for each renderer
- Visual regression tests for rendered output
- Performance tests for large maps
- Format validation tests

## Success Metrics
- [ ] PNG export generates actual images
- [ ] PDF export creates valid documents
- [ ] SVG export produces scalable graphics
- [ ] All formats support quality options
- [ ] Batch export works efficiently
- [ ] Export time < 5 seconds for typical map

## Timeline
- Week 1: Image formats (PNG, JPEG) and SVG
- Week 2: PDF export and batch functionality

## Notes
- Consider WebP format for modern browsers
- May need to implement streaming for very large maps
- Could add watermarking options for free tier
- Consider adding export analytics

---

*This feature enhances user experience but is not critical for core functionality.*