import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class TileDto {
  @ApiProperty({ description: 'X coordinate of the tile' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'Y coordinate of the tile' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'Terrain type of the tile' })
  @IsString()
  terrain: string;

  @ApiProperty({ description: 'Elevation of the tile', required: false })
  @IsOptional()
  @IsNumber()
  elevation?: number;

  @ApiProperty({ description: 'Vegetation on the tile', required: false })
  @IsOptional()
  @IsString()
  vegetation?: string;

  @ApiProperty({ description: 'Structure on the tile', required: false })
  @IsOptional()
  @IsString()
  structure?: string;

  @ApiProperty({ description: 'Features on the tile', required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ description: 'Moisture level of the tile', required: false })
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiProperty({ description: 'Temperature of the tile', required: false })
  @IsOptional()
  @IsNumber()
  temperature?: number;
}

export class SaveMapDto {
  @ApiProperty({ description: 'Generated map ID' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'Map width' })
  @IsNumber()
  width: number;

  @ApiProperty({ description: 'Map height' })
  @IsNumber()
  height: number;

  @ApiProperty({ description: 'Seed used for generation' })
  @IsString()
  seed: string;

  @ApiProperty({ description: 'Map tiles', type: [TileDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TileDto)
  tiles: TileDto[];

  @ApiProperty({ description: 'Optional map name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Optional map description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Optional map metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SaveMapResponseDto {
  @ApiProperty({ description: 'Indicates if the save was successful' })
  success: boolean;

  @ApiProperty({ description: 'Saved map ID', required: false })
  mapId?: string;

  @ApiProperty({ description: 'Success message', required: false })
  message?: string;

  @ApiProperty({ description: 'Error message if save failed', required: false })
  error?: string;
}