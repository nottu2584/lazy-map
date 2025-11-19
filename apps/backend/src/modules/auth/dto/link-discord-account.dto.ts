import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for linking Discord account to existing user
 */
export class LinkDiscordAccountDto {
  @ApiProperty({
    description: 'Discord access token received from Discord OAuth',
    example: 'YOUR_DISCORD_ACCESS_TOKEN_HERE'
  })
  @IsString()
  @IsNotEmpty()
  accessToken!: string;
}
