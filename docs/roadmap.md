# Roadmap

Focused roadmap for making Lazy Map usable and performant.

## Phase 1: Frontend Connection (Critical)

### Fix Frontend to Work with New Backend
- Remove old forest/river/road generation controls
- Add tactical map context controls (biome, elevation, season)
- Connect to `/api/maps/generate` endpoint properly
- Parse and display the 6-layer response data

### Basic Map Visualization
- Render geology layer (rock types, soil depth)
- Display topography (elevation with color gradients)
- Show hydrology (water in blue, moisture levels)
- Render vegetation (trees, shrubs, grass sprites)
- Display structures and features
- Add a map legend/key

### Tile Rendering System
- Create tile component for 5ft squares
- Color coding by terrain type
- Elevation shading
- Moisture visualization
- Basic sprite system for features

## Phase 2: Performance Optimization

### Meet Performance Targets
- **Current**: 50×50 maps ~630ms, 100×100 maps ~2.5s
- **Target**: 50×50 < 500ms, 100×100 < 2s
- Profile bottlenecks (vegetation and structures layers)
- Implement spatial indexing for plant placement
- Add pre-calculation phase for suitability maps

### Caching Strategy
- Cache geological calculations (most expensive)
- Implement layer-level caching
- Add request-level cache with TTL
- Consider Redis for production

### Parallel Processing
- Identify independent calculations
- Implement worker threads for parallel generation
- Maintain determinism with proper seed handling

## Phase 3: Biome Expansion

### Add Missing Biomes
- **TUNDRA**: Permafrost, frost-shattered rock, periglacial features
- **JUNGLE**: Deep weathering, laterite soils, dense canopy
- **VOLCANIC**: Active lava, obsidian fields, ash layers
- **GLACIER**: Ice sheets, moraines, glacial valleys

### Enhance Existing Biomes
- Add biome-specific vegetation patterns
- Climate-appropriate structure types
- Seasonal variations per biome
- Biome transition zones

## Phase 4: Essential Features

### Grid & Measurement
- Square grid overlay (5ft squares)
- Hex grid option
- Distance measurement tool
- Area selection

### Export Capabilities
- PNG export with configurable resolution
- Include/exclude grid in export
- Basic print-friendly PDF
- JSON data export

### Map Storage
- Save generated maps to database
- User map collections
- Shareable map links
- Basic versioning

## Success Metrics

**Phase 1**: Users can generate and VIEW tactical maps
**Phase 2**: 50×50 maps generate in < 500ms
**Phase 3**: Support for 10+ distinct biomes
**Phase 4**: Complete workflow from generation to table use

## Current Geological Capabilities

### Available Formations (11)
- **Carbonate**: Limestone karst, Dolomite towers
- **Granitic**: Granite dome, Weathered granodiorite
- **Volcanic**: Basalt columns, Volcanic tuff
- **Clastic**: Sandstone fins, Cross-bedded sandstone
- **Metamorphic**: Foliated schist, Slate beds
- **Evaporite**: Gypsum badlands

### Supported Biomes (7)
- Mountain (6 formation options)
- Desert (4 formation options)
- Forest (4 formation options)
- Plains (3 formation options)
- Coastal (3 formation options)
- Swamp (2 formation options)
- Underground (3 formation options)