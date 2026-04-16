/**
 * Authentication type definitions
 * Contracts for user identity and auth API responses
 */

/**
 * User data returned by authentication endpoints
 */
export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role?: string;
}

/**
 * Response from login and register endpoints
 */
export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

/**
 * Response from GET /auth/profile
 */
export interface UserProfile {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  lastLogin?: string;
}
