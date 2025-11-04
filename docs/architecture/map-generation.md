# Map Generation System

The 6-layer tactical map generation system that creates realistic battlemaps.

## Overview

Maps are 50x50 to 100x100 tiles at 5ft/tile scale, representing 250-500 foot areas perfect for tactical combat.

## The 6 Layers

Each layer depends on the previous, creating realistic terrain through geological determinism:

### Layer 0: Geology (Foundation)
- **Creates**: Bedrock type, soil depth, permeability
- **Determines**: Which terrain features are possible
- **Example**: Limestone → karst terrain with caves

### Layer 1: Topography (Terrain)
- **Creates**: Elevation (0-100ft), slopes, cliffs
- **Depends on**: Rock hardness from geology
- **Example**: Hard granite → ridges, soft sandstone → valleys

### Layer 2: Hydrology (Water)
- **Creates**: Streams, springs, moisture levels
- **Depends on**: Elevation flow and rock permeability
- **Example**: Water accumulates in valleys, springs at rock boundaries

### Layer 3: Vegetation (Plants)
- **Creates**: Trees, shrubs, grass placement
- **Depends on**: Moisture from hydrology, soil from geology
- **Example**: Dense trees near water, sparse on cliffs

### Layer 4: Structures (Buildings)
- **Creates**: Buildings with interiors, roads, bridges
- **Buildings**: Multi-floor structures with rooms and shared walls
- **Depends on**: Buildable terrain from topography
- **Example**: Row houses share walls, taverns have common rooms and kitchens

### Layer 5: Features (Tactical)
- **Creates**: Hazards, resources, cover positions
- **Depends on**: All previous layers
- **Example**: Cave entrances in limestone, ore in specific rocks

## Map Context

Each map has a context that influences generation:

```typescript
{
  biome: "forest",        // Terrain type
  elevation: "midland",   // Height zone
  hydrology: "temperate", // Water availability
  development: "rural",   // Human presence
  season: "summer"        // Time of year
}
```

## Deterministic Seeds

Same seed always produces the same map:

```typescript
// String seeds for memorable maps
generate({ seed: "goblin-ambush" })

// Numeric seeds for testing
generate({ seed: 12345 })
```

Each layer gets a deterministic sub-seed to ensure variety while maintaining reproducibility.

## Tactical Properties

Every tile has combat-relevant properties:

- **Movement Cost**: 1.0 normal, 2.0 difficult terrain
- **Cover Level**: None, partial, full
- **Concealment**: 0-100% visibility reduction
- **Elevation**: For advantage calculations
- **Hazards**: Environmental dangers

## Natural Law Validation

The system validates physical laws:
- Water flows downhill
- Plants need moisture and soil
- Buildings need stable ground
- Cliffs can't exceed 90 degrees

## Performance Targets

- 50×50 maps: < 500ms
- 100×100 maps: < 2s
- Complete determinism maintained
- Memory efficient processing