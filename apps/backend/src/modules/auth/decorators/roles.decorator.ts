import { SetMetadata } from '@nestjs/common';

/**
 * Key for storing required roles in metadata
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator to specify which roles can access a route
 * @param roles Array of role strings that are allowed
 *
 * @example
 * ```typescript
 * @Roles('ADMIN')
 * @Get('admin/users')
 * async getUsers() { ... }
 * ```
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

/**
 * Shorthand decorator for admin-only routes
 *
 * @example
 * ```typescript
 * @RequireAdmin()
 * @Get('admin/stats')
 * async getStats() { ... }
 * ```
 */
export const RequireAdmin = () => SetMetadata(ROLES_KEY, ['ADMIN']);

/**
 * Shorthand decorator for authenticated user routes (any role)
 *
 * @example
 * ```typescript
 * @RequireAuth()
 * @Get('profile')
 * async getProfile() { ... }
 * ```
 */
export const RequireAuth = () => SetMetadata(ROLES_KEY, ['USER', 'ADMIN']);