# Lazy Map Documentation

Deterministic tactical battlemap generator for tabletop RPGs.

## Quick Links

- **[Getting Started](./getting-started/installation.md)** - Setup and run your first map
- **[Architecture](./architecture/overview.md)** - How the system works
- **[Conventions](./architecture/conventions.md)** - Code style and naming guidelines

## Documentation Structure

### Getting Started
- [Installation](./getting-started/installation.md) - Setup the project
- [Configuration](./getting-started/configuration.md) - Environment setup
- [First Map](./getting-started/first-map.md) - Generate your first tactical map

### Architecture
- [Overview](./architecture/overview.md) - Clean Architecture principles
- [Map Generation](./architecture/map-generation.md) - The 6-layer system
- [Conventions](./architecture/conventions.md) - Code style and naming
- [Security](./architecture/security.md) - Security practices and considerations
- [Conventional Commits](./architecture/conventional-commits.md) - Commit message format

### Guides
- [Geological Formations](./guides/geological-formations.md) - Rock types and terrain features
- [Database Setup](./guides/database-setup.md) - PostgreSQL configuration
- [OAuth Setup](./guides/oauth-setup.md) - Google and Discord authentication
- [Commit Message Generation](./guides/commit-message-generation.md) - AI-powered conventional commits
- [Typography Standards](./guides/typography-standards.md) - Font system and design tokens

## Key Concepts

**Tactical Maps**: 50x50 to 100x100 tile battlemaps at 5ft/tile scale for D&D combat.

**Deterministic**: Same seed always produces the same map.

**6-Layer System**: Geology → Topography → Hydrology → Vegetation → Structures → Features

## Contributing

See [conventions](./architecture/conventions.md) for code style guidelines.