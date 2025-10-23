import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard as AdminRoleGuard } from '../auth/admin.guard';
import { AuthGuard } from '../auth/auth.guard';
import { AdminService } from './admin.service';
import {
  AdminActionResponseDto,
  DeleteUserDto,
  ListUsersDto,
  PromoteUserDto,
  SuspendUserDto,
  UpdateUserDto,
  UserListResponseDto,
  UserResponseDto,
  UserStatsResponseDto
} from './dto';

@ApiTags('administration')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(AuthGuard, AdminRoleGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({ summary: 'List all users with filtering and pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of users per page' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Number of users to skip' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by user role' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Filter by user status' })
  @ApiQuery({ name: 'searchTerm', required: false, type: String, description: 'Search in email and username' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: UserListResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async listUsers(
    @Query(new ValidationPipe({ transform: true })) query: ListUsersDto,
    @Body('adminId') adminId: string
  ): Promise<UserListResponseDto> {
    const result = await this.adminService.listUsers({
      adminId,
      limit: query.limit || 20,
      offset: query.offset || 0,
      role: query.role,
      status: query.status,
      searchTerm: query.searchTerm
    });

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to list users', HttpStatus.FORBIDDEN);
    }

    return {
      success: true,
      data: result.data!
    };
  }

  @Put(':userId')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'userId', description: 'User ID to update' })
  @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) updateDto: UpdateUserDto,
    @Body('adminId') adminId: string
  ): Promise<UserResponseDto> {
    const result = await this.adminService.updateUser({
      adminId,
      userId,
      email: updateDto.email,
      username: updateDto.username
    });

    if (!result.success) {
      const status = result.error?.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      throw new HttpException(result.error || 'Failed to update user', status);
    }

    return {
      success: true,
      data: result.data!
    };
  }

  @Post(':userId/suspend')
  @ApiOperation({ summary: 'Suspend a user account' })
  @ApiParam({ name: 'userId', description: 'User ID to suspend' })
  @ApiResponse({ status: 200, description: 'User suspended successfully', type: AdminActionResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async suspendUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) suspendDto: SuspendUserDto,
    @Body('adminId') adminId: string
  ): Promise<AdminActionResponseDto> {
    const result = await this.adminService.suspendUser({
      adminId,
      userId,
      reason: suspendDto.reason
    });

    if (!result.success) {
      const status = result.error?.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      throw new HttpException(result.error || 'Failed to suspend user', status);
    }

    return {
      success: true,
      data: result.data!
    };
  }

  @Post(':userId/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended user account' })
  @ApiParam({ name: 'userId', description: 'User ID to reactivate' })
  @ApiResponse({ status: 200, description: 'User reactivated successfully', type: AdminActionResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async reactivateUser(
    @Param('userId') userId: string,
    @Body('adminId') adminId: string
  ): Promise<AdminActionResponseDto> {
    const result = await this.adminService.reactivateUser({
      adminId,
      userId
    });

    if (!result.success) {
      const status = result.error?.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      throw new HttpException(result.error || 'Failed to reactivate user', status);
    }

    return {
      success: true,
      data: result.data!
    };
  }

  @Put(':userId/role')
  @ApiOperation({ summary: 'Change user role (promote/demote)' })
  @ApiParam({ name: 'userId', description: 'User ID to promote/demote' })
  @ApiResponse({ status: 200, description: 'User role changed successfully', type: AdminActionResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async promoteUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) promoteDto: PromoteUserDto,
    @Body('adminId') adminId: string
  ): Promise<AdminActionResponseDto> {
    const result = await this.adminService.promoteUser({
      adminId,
      userId,
      newRole: promoteDto.newRole
    });

    if (!result.success) {
      const status = result.error?.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      throw new HttpException(result.error || 'Failed to change user role', status);
    }

    return {
      success: true,
      data: result.data!
    };
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a user account (permanent action)' })
  @ApiParam({ name: 'userId', description: 'User ID to delete' })
  @ApiResponse({ status: 200, description: 'User deleted successfully', type: AdminActionResponseDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async deleteUser(
    @Param('userId') userId: string,
    @Body(ValidationPipe) deleteDto: DeleteUserDto,
    @Body('adminId') adminId: string
  ): Promise<AdminActionResponseDto> {
    const result = await this.adminService.deleteUser({
      adminId,
      userId,
      confirmDeletion: deleteDto.confirmDeletion
    });

    if (!result.success) {
      const status = result.error?.includes('not found') ? HttpStatus.NOT_FOUND : HttpStatus.FORBIDDEN;
      throw new HttpException(result.error || 'Failed to delete user', status);
    }

    return {
      success: true,
      data: result.data!
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics for dashboard' })
  @ApiResponse({ status: 200, description: 'User statistics retrieved successfully', type: UserStatsResponseDto })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getUserStats(
    @Body('adminId') adminId: string
  ): Promise<UserStatsResponseDto> {
    const result = await this.adminService.getUserStats({ adminId });

    if (!result.success) {
      throw new HttpException(result.error || 'Failed to get user statistics', HttpStatus.FORBIDDEN);
    }

    return {
      success: true,
      data: result.data!
    };
  }
}