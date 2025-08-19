import { IsNumber, IsString, IsArray, IsBoolean, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForestSettingsDto {
  @ApiProperty({
    description: 'Forest density (percentage of forest coverage)',
    example: 0.3,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  forestDensity?: number;

  @ApiProperty({
    description: 'Tree density within forests',
    example: 0.6,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  treeDensity?: number;

  @ApiProperty({
    description: 'Tendency for trees to group together',
    example: 0.7,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  treeClumping?: number;

  @ApiProperty({
    description: 'Preferred tree species to generate',
    example: ['oak', 'pine'],
    isArray: true,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  preferredSpecies?: string[];

  @ApiProperty({
    description: 'Whether trees can overlap',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  allowTreeOverlap?: boolean;

  @ApiProperty({
    description: 'Enable tree inosculation (grafting)',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  enableInosculation?: boolean;

  @ApiProperty({
    description: 'Density of underbrush',
    example: 0.4,
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  underbrushDensity?: number;
}