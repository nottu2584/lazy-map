import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class DimensionsDto {
  @ApiProperty({ description: 'Map width in tiles', minimum: 10, maximum: 200 })
  @IsNumber()
  @Min(10)
  @Max(200)
  width: number;

  @ApiProperty({ description: 'Map height in tiles', minimum: 10, maximum: 200 })
  @IsNumber()
  @Min(10)
  @Max(200)
  height: number;
}

export class RequiredFeaturesDto {
  @ApiPropertyOptional({ description: 'Require a road on the map' })
  @IsOptional()
  @IsBoolean()
  hasRoad?: boolean;

  @ApiPropertyOptional({ description: 'Require a bridge on the map' })
  @IsOptional()
  @IsBoolean()
  hasBridge?: boolean;

  @ApiPropertyOptional({ description: 'Require ruins on the map' })
  @IsOptional()
  @IsBoolean()
  hasRuins?: boolean;

  @ApiPropertyOptional({ description: 'Require a cave on the map' })
  @IsOptional()
  @IsBoolean()
  hasCave?: boolean;

  @ApiPropertyOptional({ description: 'Require water features on the map' })
  @IsOptional()
  @IsBoolean()
  hasWater?: boolean;

  @ApiPropertyOptional({ description: 'Require a cliff on the map' })
  @IsOptional()
  @IsBoolean()
  hasCliff?: boolean;
}

export class GenerateMapDto {
  @ApiPropertyOptional({ description: 'Map name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Map width (deprecated, use dimensions)',
    minimum: 10,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  width?: number;

  @ApiPropertyOptional({
    description: 'Map height (deprecated, use dimensions)',
    minimum: 10,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  height?: number;

  @ApiPropertyOptional({ description: 'Map dimensions', type: DimensionsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => DimensionsDto)
  dimensions?: DimensionsDto;

  @ApiPropertyOptional({ description: 'Seed for deterministic generation' })
  @IsOptional()
  seed?: string | number;

  @ApiPropertyOptional({
    description: 'Map biome/climate type. When omitted, derived from seed.',
    enum: ['forest', 'mountain', 'plains', 'swamp', 'desert', 'coastal', 'underground'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['forest', 'mountain', 'plains', 'swamp', 'desert', 'coastal', 'underground'])
  biome?: string;

  @ApiPropertyOptional({
    description: 'Elevation zone. When omitted, derived from seed.',
    enum: ['lowland', 'foothills', 'highland', 'alpine'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['lowland', 'foothills', 'highland', 'alpine'])
  elevation?: string;

  @ApiPropertyOptional({
    description: 'Water/hydrology type. When omitted, derived from seed.',
    enum: ['arid', 'seasonal', 'stream', 'river', 'lake', 'coastal', 'wetland'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['arid', 'seasonal', 'stream', 'river', 'lake', 'coastal', 'wetland'])
  hydrology?: string;

  @ApiPropertyOptional({
    description: 'Development level of the area. When omitted, derived from seed.',
    enum: ['wilderness', 'frontier', 'rural', 'settled', 'urban', 'ruins'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['wilderness', 'frontier', 'rural', 'settled', 'urban', 'ruins'])
  development?: string;

  @ApiPropertyOptional({
    description: 'Season. When omitted, derived from seed.',
    enum: ['spring', 'summer', 'autumn', 'winter'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['spring', 'summer', 'autumn', 'winter'])
  season?: string;

  @ApiPropertyOptional({
    description: 'Features that must appear on the generated map',
    type: RequiredFeaturesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => RequiredFeaturesDto)
  requiredFeatures?: RequiredFeaturesDto;

  @ApiPropertyOptional({
    description:
      'Vegetation density multiplier (0.0-2.0). Controls forest coverage and tree density. 0.0 = no vegetation, 1.0 = normal forest, 2.0 = maximum density jungle',
    minimum: 0.0,
    maximum: 2.0,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.0)
  @Max(2.0)
  vegetationMultiplier?: number;

  @ApiPropertyOptional({
    description:
      'Terrain ruggedness multiplier (0.5-2.0). Controls terrain detail and elevation variance. 0.5 = smooth gentle terrain, 1.0 = normal terrain, 2.0 = highly rugged with extreme elevation changes',
    minimum: 0.5,
    maximum: 2.0,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  terrainRuggedness?: number;

  @ApiPropertyOptional({
    description:
      'Water abundance multiplier (0.5-2.0). Controls frequency of water features including streams, springs, and pools. 0.5 = arid with few water sources, 1.0 = moderate water features, 2.0 = abundant water sources',
    minimum: 0.5,
    maximum: 2.0,
    default: 1.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.5)
  @Max(2.0)
  waterAbundance?: number;
}
