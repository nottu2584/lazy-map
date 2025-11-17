# Installation

Get Lazy Map up and running on your local machine.

## Prerequisites

- Node.js 18+
- pnpm 8+
- PostgreSQL 14+ (optional, for persistence)

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/lazy-map.git
cd lazy-map

# Install dependencies
pnpm install

# Setup the project (install deps, build packages)
pnpm run setup

# Start development servers
pnpm run dev
```

This starts:
- Backend API on http://localhost:3000
- Frontend on http://localhost:5173

## Development Commands

```bash
# Run just the backend
pnpm run dev:backend

# Run just the frontend
pnpm run dev:frontend

# Run tests
pnpm test

# Build all packages
pnpm build

# Lint code with OxLint
pnpm lint

# Lint and auto-fix issues
pnpm lint:fix
```

## Next Steps

- [Configure environment variables](./configuration.md)
- [Generate your first map](./first-map.md)
- [Setup database](../guides/database-setup.md) (optional)