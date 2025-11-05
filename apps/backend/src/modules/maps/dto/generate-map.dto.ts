import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({ description: 'Map width (deprecated, use dimensions)', minimum: 10, maximum: 200 })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(200)
  width?: number;

  @ApiPropertyOptional({ description: 'Map height (deprecated, use dimensions)', minimum: 10, maximum: 200 })
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
}