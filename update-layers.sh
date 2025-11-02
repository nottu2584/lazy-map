#!/bin/bash

# Script to update all layer files with ILogger and error handling

LAYERS_DIR="/Users/xgimenez/Dev/lazy-map/packages/infrastructure/src/map/services/layers"

# Update HydrologyLayer
echo "Updating HydrologyLayer..."
cat > "$LAYERS_DIR/HydrologyLayer.ts.tmp" << 'EOF'
import {
  TacticalMapContext,
  Seed,
  NoiseGenerator,
  MoistureLevel,
  HydrologyType,
  PermeabilityLevel,
  ILogger,
  MapGenerationErrors
} from '@lazy-map/domain';
EOF

# Get the rest of the HydrologyLayer file after line 10
tail -n +11 "$LAYERS_DIR/HydrologyLayer.ts" >> "$LAYERS_DIR/HydrologyLayer.ts.tmp"

# Replace the class definition to add logger
sed -i '' 's/export class HydrologyLayer implements IHydrologyLayerService {/export class HydrologyLayer implements IHydrologyLayerService {\
  private logger?: ILogger;\
\
  constructor(logger?: ILogger) {\
    this.logger = logger;\
  }/' "$LAYERS_DIR/HydrologyLayer.ts.tmp"

mv "$LAYERS_DIR/HydrologyLayer.ts.tmp" "$LAYERS_DIR/HydrologyLayer.ts"

# Update VegetationLayer
echo "Updating VegetationLayer..."
sed -i '' '1s/.*/import {/' "$LAYERS_DIR/VegetationLayer.ts"
sed -i '' '16a\
  ILogger,\
  MapGenerationErrors' "$LAYERS_DIR/VegetationLayer.ts"

sed -i '' 's/export class VegetationLayer implements IVegetationLayerService {/export class VegetationLayer implements IVegetationLayerService {\
  private logger?: ILogger;\
\
  constructor(logger?: ILogger) {\
    this.logger = logger;\
  }/' "$LAYERS_DIR/VegetationLayer.ts"

# Update StructuresLayer
echo "Updating StructuresLayer..."
sed -i '' '10a\
  ILogger,\
  MapGenerationErrors,' "$LAYERS_DIR/StructuresLayer.ts"

sed -i '' 's/export class StructuresLayer implements IStructuresLayerService {/export class StructuresLayer implements IStructuresLayerService {\
  private logger?: ILogger;\
\
  constructor(logger?: ILogger) {\
    this.logger = logger;\
  }/' "$LAYERS_DIR/StructuresLayer.ts"

# Update FeaturesLayer
echo "Updating FeaturesLayer..."
sed -i '' '8a\
  ILogger,\
  MapGenerationErrors,' "$LAYERS_DIR/FeaturesLayer.ts"

sed -i '' 's/export class FeaturesLayer implements IFeaturesLayerService {/export class FeaturesLayer implements IFeaturesLayerService {\
  private logger?: ILogger;\
\
  constructor(logger?: ILogger) {\
    this.logger = logger;\
  }/' "$LAYERS_DIR/FeaturesLayer.ts"

echo "All layers updated!"