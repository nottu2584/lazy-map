import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Max, Min, ValidateNested } from 'class-validator';

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
