import { IsNumber, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class TerrainDistributionDto {
  @ApiProperty({
    description: 'Grassland terrain percentage',
    example: 0.4,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  grassland?: number;

  @ApiProperty({
    description: 'Forest terrain percentage',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  forest?: number;

  @ApiProperty({
    description: 'Mountain terrain percentage',
    example: 0.2,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  mountain?: number;

  @ApiProperty({
    description: 'Water terrain percentage',
    example: 0.1,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  water?: number;

  @ApiProperty({
    description: 'Desert terrain percentage',
    example: 0,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  desert?: number;

  @ApiProperty({
    description: 'Swamp terrain percentage',
    example: 0,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  swamp?: number;
}