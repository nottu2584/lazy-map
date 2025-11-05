import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class ValidateSeedDto {
  @ApiProperty({ description: 'Seed value to validate' })
  @IsNotEmpty()
  seed: string | number;
}