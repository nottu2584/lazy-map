import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for linking Google account to existing user
 */
export class LinkGoogleAccountDto {
  @ApiProperty({
    description: 'Google ID token received from Google Sign-In',
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI4YTQyMWNhZmJlM...'
  })
  @IsString()
  @IsNotEmpty()
  idToken!: string;
}