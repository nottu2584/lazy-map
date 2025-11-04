# Frontend - Lazy Map UI

React application for visualizing tactical battlemaps.

## What This Does

Provides the user interface for generating and viewing tactical-scale maps. Uses Konva.js for high-performance canvas rendering.

## Quick Start

```bash
# From project root
pnpm dev:frontend

# Or standalone
cd apps/frontend
pnpm dev
```

**Access:** http://localhost:5173

**Note:** Backend must be running at port 3000 for map generation.

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Konva.js** - Canvas rendering
- **Tailwind CSS v4** - Styling
- **Zustand** - State management

## Project Structure

```
src/
├── components/       # UI components
│   ├── map/         # Map canvas & controls
│   ├── forms/       # Input forms
│   └── ui/          # Reusable components
├── pages/           # Route pages
├── services/        # API client
├── stores/          # Zustand stores
└── types/           # TypeScript types
```

## Key Features

- **Map Canvas** - Interactive grid-based map display
- **Generation Controls** - Configure terrain, biome, development
- **Seed Input** - Use memorable strings or numbers
- **Export** - Download as PNG/PDF/SVG

## Environment Setup

Copy `.env.example` to `.env`:

```env
VITE_API_URL=http://localhost:3000
```

## Development

```bash
# Build
pnpm build

# Preview build
pnpm preview

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint
```

## Current Status

⚠️ **Frontend needs updates for new tactical map system:**
- Remove old regional map controls
- Add tactical context controls (biome, elevation, development)
- Update API integration for new endpoints
- Fix map rendering for new data structure

See [Roadmap](../../docs/roadmap.md) for priorities.

## Related Docs

- [Project Overview](../../README.md)
- [Backend API](../backend/README.md)
- [Architecture Guide](../../CLAUDE.md)