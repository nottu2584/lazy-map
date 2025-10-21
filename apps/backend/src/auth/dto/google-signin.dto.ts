import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for Google Sign-In request
 */
export class GoogleSignInDto {
  @ApiProperty({
    description: 'Google ID token received from Google Sign-In',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI4YTQyMWNhZmJlM...'
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;

  @ApiProperty({
    description: 'Optional Google client ID for additional validation',
    example: '123456789012-abcdefghijk.apps.googleusercontent.com',
    required: false
  })
  @IsString()
  @IsOptional()
  clientId?: string;
}