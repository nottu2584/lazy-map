import { 
  IsString, 
  IsNumber, 
  IsArray, 
  IsBoolean, 
  ValidateNested,
  IsOptional,
  Min,
  Max
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { DimensionsDto } from './dimensions.dto';
import { TerrainDistributionDto } from './terrain-distribution.dto';
import { ForestSettingsDto } from './forest-settings.dto';

export class GenerateMapDto {
  @ApiProperty({
    description: 'Name of the map',
    example: 'Forest Battleground',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Description of the map',
    example: 'A dense forest with a small clearing',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Width of the map in tiles',
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  width?: number;

  @ApiProperty({
    description: 'Height of the map in tiles',
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  height?: number;

  @ApiProperty({
    description: 'Dimensions of the map',
    type: DimensionsDto,
  })
  @ValidateNested()
  @Type(() => DimensionsDto)
  @IsOptional()
  dimensions?: DimensionsDto;

  @ApiProperty({
    description: 'Size of each cell in pixels',
    example: 32,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  cellSize?: number;

  @ApiProperty({
    description: 'Random seed for reproducible generation',
    example: 12345,
  })
  @IsNumber()
  @IsOptional()
  seed?: number;

  @ApiProperty({
    description: 'Tags for the map',
    example: ['forest', 'small'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'Author of the map',
    example: 'DM Steve',
  })
  @IsString()
  @IsOptional()
  author?: string;

  @ApiProperty({
    description: 'Distribution of terrain types',
    type: TerrainDistributionDto,
  })
  @ValidateNested()
  @Type(() => TerrainDistributionDto)
  @IsOptional()
  terrainDistribution?: TerrainDistributionDto;

  @ApiProperty({
    description: 'Amount of elevation variance',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  elevationVariance?: number;

  @ApiProperty({
    description: 'Elevation multiplier',
    example: 1.0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  elevationMultiplier?: number;

  @ApiProperty({
    description: 'Whether to add noise to height values',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  addHeightNoise?: boolean;

  @ApiProperty({
    description: 'Height variance amount',
    example: 0.2,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  heightVariance?: number;

  @ApiProperty({
    description: 'Chance of inclination between tiles',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  inclinationChance?: number;

  @ApiProperty({
    description: 'Whether to generate rivers',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  generateRivers?: boolean;

  @ApiProperty({
    description: 'Whether to generate roads',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  generateRoads?: boolean;

  @ApiProperty({
    description: 'Whether to generate buildings',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  generateBuildings?: boolean;

  @ApiProperty({
    description: 'Whether to generate forests',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  generateForests?: boolean;

  @ApiProperty({
    description: 'Forest generation settings',
    type: ForestSettingsDto,
  })
  @ValidateNested()
  @Type(() => ForestSettingsDto)
  @IsOptional()
  forestSettings?: ForestSettingsDto;

  @ApiProperty({
    description: 'Biome type',
    example: 'temperate',
  })
  @IsString()
  @IsOptional()
  biomeType?: string;
}