# Lazy Map Frontend

React + TypeScript application for creating and visualizing battlemaps.

## Overview

This frontend application serves as the **Interface layer** in our Clean Architecture setup, providing:

- **Interactive Map Builder** - Visual tools for creating custom battlemaps
- **Real-time Canvas Rendering** - High-performance map visualization using Konva.js
- **Map Management** - Save, load, and organize generated maps
- **Export Tools** - Download maps in various formats (PNG, PDF, SVG)

## Architecture Role

```
┌─────────────────┐
│   Frontend      │ ◄── YOU ARE HERE
│   (React)       │
└─────────────────┘
         │ HTTP/REST API
         ▼
┌─────────────────┐
│   Backend       │ (NestJS API)
│   (Port 3000)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Packages      │ (Business Logic)
└─────────────────┘
```

## Key Features

### Map Generation Interface
- **Seed-based Generation** - Create reproducible maps with custom or random seeds
- **Terrain Customization** - Adjust elevation, terrain distribution, and biome settings
- **Feature Controls** - Toggle forests, rivers, roads, and buildings
- **Real-time Preview** - See changes instantly as you adjust settings

### Canvas Visualization
- **Interactive Grid** - Click and drag to explore large maps
- **Zoom Controls** - Scale from overview to tile-level detail
- **Layer Management** - Toggle visibility of terrain, features, and grid overlay
- **Selection Tools** - Select and inspect individual tiles and features

### Export & Sharing
- **Multiple Formats** - PNG for Roll20, PDF for printing, SVG for editing
- **Grid Options** - Include/exclude coordinate labels and grid lines
- **Scale Control** - Adjust output resolution and print size
- **Quick Share** - Generate shareable links with map seeds

## Quick Start

```bash
# Install dependencies (from project root)
pnpm install

# Start in development mode
pnpm --filter frontend dev

# Or from this directory  
cd apps/frontend
pnpm dev
```

The application will be available at `http://localhost:5173`.

**Note**: Make sure the backend is running at `http://localhost:3000` for full functionality.

## Technology Stack

### Core Framework
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool with SWC

### Rendering & Canvas
- **Konva.js** - 2D canvas library for high-performance rendering
- **react-konva** - React wrapper for Konva
- **Canvas API** - Hardware-accelerated graphics

### State Management
- **Zustand** - Lightweight state management
- **TanStack Query** - Server state synchronization
- **React Context** - UI state and theming

### Styling & UI
- **Tailwind CSS v4** - Utility-first CSS framework
- **Headless UI** - Unstyled accessible components
- **Lucide Icons** - Modern icon library

## Project Structure

```
apps/frontend/src/
├── components/           # Reusable UI components
│   ├── map/             # Map-specific components
│   ├── forms/           # Form controls and inputs
│   └── ui/              # Base UI components
├── pages/               # Route-level components
├── hooks/               # Custom React hooks
├── stores/              # Zustand state stores
├── services/            # API communication
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## Development

### Running the App
```bash
# Development mode (with hot reload)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Code Quality
```bash
# Type checking
pnpm tsc --noEmit

# Linting
pnpm lint

# Format code
pnpm format
```

### Testing
```bash
# Unit tests with Vitest
pnpm test

# Component tests
pnpm test:components

# E2E tests with Playwright
pnpm test:e2e
```

## Configuration

### Environment Variables
```env
# API Configuration
VITE_API_URL=http://localhost:3000

# Feature Flags
VITE_ENABLE_CLOUD_SAVE=true
VITE_ENABLE_ANALYTICS=false

# External Services
VITE_SENTRY_DSN=your-sentry-dsn
```

### Build Configuration
The app uses Vite with SWC for fast compilation and hot module replacement.

Key configuration files:
- `vite.config.ts` - Build configuration
- `tailwind.config.js` - Styling configuration  
- `tsconfig.json` - TypeScript configuration

## Key Components

### MapCanvas
The core rendering component that displays the generated map using Konva.js:

```typescript
import { MapCanvas } from '@/components/map/MapCanvas';

<MapCanvas 
  map={generatedMap}
  showGrid={true}
  allowZoom={true}
  onTileClick={handleTileClick}
/>
```

### MapGenerator
Form component for configuring map generation settings:

```typescript
import { MapGenerator } from '@/components/map/MapGenerator';

<MapGenerator 
  onGenerate={handleMapGeneration}
  initialSettings={defaultSettings}
/>
```

### ExportPanel
Tools for downloading and sharing maps:

```typescript
import { ExportPanel } from '@/components/map/ExportPanel';

<ExportPanel 
  map={currentMap}
  formats={['png', 'pdf', 'svg']}
  onExport={handleExport}
/>
```

## API Integration

The frontend communicates with the backend through a typed API client:

```typescript
import { mapApi } from '@/services/api';

// Generate new map
const result = await mapApi.generateMap({
  name: "Forest Battle",
  seed: "my-custom-seed",
  width: 20,
  height: 15,
  generateForests: true
});

// Load existing map
const map = await mapApi.getMap(mapId);
```

## Performance Considerations

### Canvas Rendering
- **Virtualization** - Only render visible tiles for large maps
- **Object Pooling** - Reuse Konva objects to reduce GC pressure
- **RAF Scheduling** - Batch updates using requestAnimationFrame

### State Management
- **Selective Updates** - Only re-render components when relevant state changes
- **Memoization** - Cache expensive calculations and derived state
- **Lazy Loading** - Load map data on-demand

## Related Documentation

- [Main Project Documentation](../../CLAUDE.md) - Architecture overview
- [Backend Documentation](../backend/README.md) - API server
- [Domain Package](../../packages/domain/) - Business logic
- [Konva.js Documentation](https://konvajs.org/) - Canvas rendering library