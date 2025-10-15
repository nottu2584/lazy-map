import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateSeedDto {
  @ApiProperty({
    description: 'The seed to validate',
    example: 'epic-mountain-valley',
    minLength: 1,
    maxLength: 100
  })
  @IsString()
  @Length(1, 100)
  seed: string;

  @ApiProperty({
    description: 'Whether to normalize the seed during validation',
    example: true,
    required: false
  })
  @IsOptional()
  normalize?: boolean = true;
}

export class SeedValidationResult {
  @ApiProperty({
    description: 'Whether the seed is valid',
    example: true
  })
  isValid: boolean;

  @ApiProperty({
    description: 'The normalized seed (if normalization was requested)',
    example: 'epic-mountain-valley',
    required: false
  })
  normalizedSeed?: string;

  @ApiProperty({
    description: 'List of validation errors',
    example: [],
    type: [String],
    required: false
  })
  errors?: string[];

  @ApiProperty({
    description: 'List of warnings about the seed',
    example: ['Seed contains special characters that were normalized'],
    type: [String],
    required: false
  })
  warnings?: string[];

  @ApiProperty({
    description: 'Metadata about the seed',
    example: {
      length: 18,
      complexity: 'medium',
      estimatedUniqueness: 'high'
    },
    required: false
  })
  metadata?: {
    length: number;
    complexity: 'low' | 'medium' | 'high';
    estimatedUniqueness: 'low' | 'medium' | 'high';
  };
}