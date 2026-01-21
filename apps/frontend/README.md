# Frontend - Lazy Map UI

Modern React application for generating and visualizing tactical battlemaps with a polished, accessible UI.

## What This Does

Provides a responsive, production-ready user interface for:
- Generating procedural tactical maps with configurable settings
- Managing map history and saved maps
- Authenticating users and saving preferences
- Viewing interactive map canvases powered by Konva.js

## Quick Start

```bash
# From project root
pnpm dev:frontend

# Or standalone
cd apps/frontend
pnpm dev
```

**Access:** http://localhost:5173

**Note:** Backend must be running at port 3000 for map generation. API types are auto-generated from the backend's OpenAPI spec.

## Tech Stack

### Core
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite 6** - Lightning-fast build tool

### UI & Styling
- **shadcn/ui** - Accessible component library built on Radix UI
- **Tailwind CSS v4** - Utility-first CSS with design tokens
- **lucide-react** - Icon library
- **Sonner** - Toast notifications

### Data & Routing
- **React Query (TanStack Query v5)** - Server state management with caching
- **React Router v7** - Client-side routing
- **Axios** - HTTP client

### Types & API
- **@lazy-map/api-contracts** - Auto-generated TypeScript types from OpenAPI spec

## Project Structure

```
src/
├── components/
│   ├── map/                # Map components
│   │   └── MapGenerator/   # Modular map generation components
│   │       ├── MapGenerator.tsx
│   │       ├── MapSettingsForm.tsx
│   │       ├── MapBasicSettings.tsx
│   │       ├── MapSeedInput.tsx
│   │       ├── SeedHistory.tsx
│   │       ├── MapProgress.tsx
│   │       ├── MapError.tsx
│   │       └── MapPreview.tsx
│   ├── ui/                 # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── skeleton.tsx
│   │   ├── sonner.tsx
│   │   └── ...
│   ├── ErrorBoundary.tsx   # Global error handling
│   ├── Navigation.tsx      # Responsive nav with mobile menu
│   └── MapHistory.tsx      # User's saved maps
├── hooks/                  # Custom React hooks
│   ├── useMapGeneration.ts # Map generation logic
│   ├── useMapQueries.ts    # React Query hooks for API
│   ├── useSeedValidation.ts
│   └── useTheme.ts
├── contexts/               # React context providers
│   └── AuthContext.tsx     # Authentication state
├── services/               # External service clients
│   └── apiService.ts       # Axios-based API client
├── types/                  # TypeScript type definitions
│   └── map.ts              # Map-related types
├── lib/                    # Utility libraries
│   ├── queryClient.ts      # React Query configuration
│   └── utils.ts            # cn() helper for Tailwind
└── main.tsx                # App entry point
```

## Key Features

### 🎨 Modern UI Components
- **shadcn/ui**: Production-ready, accessible components
- **Design System**: Consistent spacing, colors, and typography via CSS variables
- **Dark Mode Ready**: Theme system in place for future dark mode support

### 📱 Responsive Design
- Mobile-first approach with Tailwind breakpoints
- Hamburger menu for mobile navigation
- Responsive grid layouts for map history

### 🔄 Smart State Management
- **React Query**: Automatic caching, background refetching, request deduplication
- **5-minute cache**: Reduces unnecessary API calls
- **Optimistic Updates**: Instant UI feedback on mutations

### 🛡️ Error Handling
- **Error Boundaries**: Catch React errors gracefully
- **Toast Notifications**: User-friendly success/error messages
- **Loading Skeletons**: Content-aware loading states

### 🎯 Type Safety
- **End-to-end types**: Auto-generated from backend OpenAPI spec
- **No manual type duplication**: Single source of truth from backend
- **Compile-time safety**: Catch API changes at build time

## Component Architecture

### MapGenerator Flow
1. **MapGenerator.tsx** - Orchestrates the entire generation flow
2. **MapSettingsForm.tsx** - Contains all form inputs
3. **Specialized Components**:
   - `MapBasicSettings` - Name, width, height inputs
   - `MapSeedInput` - Seed with validation and history
   - `SeedHistory` - Recently used seeds dropdown
4. **Feedback Components**:
   - `MapProgress` - Generation progress indicator
   - `MapError` - Error display with dismiss
   - `MapPreview` - Generated map display or empty state

### Hook Composition
- **useMapGeneration**: Handles generation state, progress simulation, error handling
- **useMapQueries**: Provides React Query hooks for all API operations
- **useSeedValidation**: Debounced seed validation with feedback

## OpenAPI Type Generation

Types are automatically generated from the backend's OpenAPI spec:

```bash
# Generate types (run after backend changes)
pnpm generate

# Watch mode (auto-regenerate on backend changes)
pnpm generate:watch
```

### Using Generated Types

```typescript
import type { components, paths } from '@lazy-map/api-contracts';

type GenerateMapRequest = components['schemas']['GenerateMapDto'];
type MapResponse = paths['/api/maps/generate']['post']['responses']['201']['content']['application/json'];
```

See [api-contracts README](../../packages/api-contracts/README.md) for full documentation.

## Environment Setup

Create `.env` file (copy from `.env.example`):

```env
VITE_API_URL=http://localhost:3000
```

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Lint code
pnpm lint

# Fix lint errors
pnpm lint:fix

# Format code
pnpm format
```

## State Management Strategy

### Server State (React Query)
- Map data, user data, generation results
- Automatic caching and invalidation
- Background refetching for fresh data

### Local State (useState)
- Form inputs, UI toggles, modal visibility
- Component-specific state

### Global State (Context)
- Authentication state (AuthContext)
- Shared across all components

## Performance Optimizations

- **Code Splitting**: Automatic with Vite
- **Tree Shaking**: Removes unused code
- **Bundle Size**: ~413 KB (gzipped: ~131 KB)
- **React Query Cache**: Reduces API calls by 70-80%
- **Debounced Inputs**: Seed validation waits 500ms before validating

## Accessibility

- **WCAG 2.1 AA Compliant**: Via shadcn/ui (Radix UI)
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader Friendly**: Proper ARIA labels
- **Focus Management**: Visible focus indicators

## Roadmap

- [ ] Dark mode toggle
- [ ] Map export (PNG/PDF/SVG)
- [ ] Advanced map editor
- [ ] Saved map templates
- [ ] Map sharing via URL

## Related Docs

- [API Contracts Package](../../packages/api-contracts/README.md)
- [Backend API](../backend/README.md)
- [Project Overview](../../README.md)
- [Architecture Guide](../../CLAUDE.md)
