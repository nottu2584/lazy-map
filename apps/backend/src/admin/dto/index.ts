import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsBoolean, Min, Max, Length } from 'class-validator';
import { Type } from 'class-transformer';

export class ListUsersDto {
  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false, minimum: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;

  @ApiProperty({ required: false, enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiProperty({ required: false, enum: ['ACTIVE', 'SUSPENDED', 'PENDING', 'DEACTIVATED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false, description: 'Search term for email/username' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  searchTerm?: string;
}

export class UpdateUserDto {
  @ApiProperty({ required: false, description: 'New email address' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false, description: 'New username' })
  @IsOptional()
  @IsString()
  @Length(3, 30)
  username?: string;
}

export class SuspendUserDto {
  @ApiProperty({ description: 'Reason for suspension' })
  @IsString()
  @Length(5, 500)
  reason: string;
}

export class ReactivateUserDto {
  // No additional fields needed - only adminId and userId required
}

export class PromoteUserDto {
  @ApiProperty({ description: 'New role for the user', enum: ['USER', 'ADMIN', 'SUPER_ADMIN'] })
  @IsString()
  newRole: string;
}

export class DeleteUserDto {
  @ApiProperty({ description: 'Explicit confirmation of deletion' })
  @IsBoolean()
  confirmDeletion: boolean;
}

// Response DTOs
export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ required: false })
  lastLoginAt: Date | null;

  @ApiProperty({ required: false })
  suspendedAt: Date | null;

  @ApiProperty({ required: false })
  suspensionReason: string | null;
}

export class UserListDataDto {
  @ApiProperty({ type: [UserDto] })
  users: UserDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  hasMore: boolean;
}

export class UserListResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: UserListDataDto })
  data: UserListDataDto;
}

export class UserResponseDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  updatedAt: Date;
}

export class UserResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: UserResponseDataDto })
  data: UserResponseDataDto;
}

export class AdminActionDataDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ required: false })
  status?: string;

  @ApiProperty({ required: false })
  previousRole?: string;

  @ApiProperty({ required: false })
  newRole?: string;

  @ApiProperty({ required: false })
  suspendedAt?: Date;

  @ApiProperty({ required: false })
  reactivatedAt?: Date;

  @ApiProperty({ required: false })
  promotedAt?: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ required: false })
  suspensionReason?: string;
}

export class AdminActionResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: AdminActionDataDto })
  data: AdminActionDataDto;
}

export class UserStatsDataDto {
  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  suspendedUsers: number;

  @ApiProperty()
  pendingUsers: number;

  @ApiProperty()
  deactivatedUsers: number;

  @ApiProperty()
  adminUsers: number;

  @ApiProperty()
  superAdminUsers: number;

  @ApiProperty()
  regularUsers: number;

  @ApiProperty()
  generatedAt: Date;
}

export class UserStatsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: UserStatsDataDto })
  data: UserStatsDataDto;
}