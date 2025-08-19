import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DimensionsDto {
  @ApiProperty({
    description: 'Width of the map in tiles',
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  width: number;

  @ApiProperty({
    description: 'Height of the map in tiles',
    example: 20,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  height: number;
}