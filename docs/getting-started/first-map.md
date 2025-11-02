# Generate Your First Map

Create your first tactical battlemap with Lazy Map.

## Using the API

The simplest way to generate a map:

```bash
# Generate a 50x50 tactical map
curl -X POST http://localhost:3000/api/maps/generate \
  -H "Content-Type: application/json" \
  -d '{
    "width": 50,
    "height": 50,
    "seed": "my-first-map"
  }'
```

## API Parameters

```json
{
  "width": 50,           // Map width in tiles (25-200)
  "height": 50,          // Map height in tiles (25-200)
  "seed": "string",      // Seed for deterministic generation
  "context": {           // Optional context settings
    "biome": "forest",   // forest, desert, mountain, etc.
    "elevation": "midland",
    "season": "summer"
  }
}
```

## Understanding the Response

The API returns a tactical map with 6 layers:

1. **Geology**: Rock types and soil depth
2. **Topography**: Elevation and slopes
3. **Hydrology**: Water features and moisture
4. **Vegetation**: Trees, shrubs, grass
5. **Structures**: Buildings and roads
6. **Features**: Hazards and resources

## Using the Frontend

Navigate to http://localhost:5173 and:

1. Enter map dimensions (50x50 recommended)
2. Optionally set a seed for reproducibility
3. Click "Generate Map"
4. View the rendered tactical map

## Deterministic Generation

Same seed = same map, always:

```bash
# These will generate identical maps
curl ... -d '{"seed": "goblin-ambush", ...}'
curl ... -d '{"seed": "goblin-ambush", ...}'
```

## Next Steps

- [Understand the architecture](../architecture/overview.md)
- [Learn about map layers](../architecture/map-generation.md)
- [Explore geological formations](../guides/geological-formations.md)