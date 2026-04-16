import type { CookieOptions } from 'express';

export const ACCESS_COOKIE_NAME = 'access_token';

export function getAccessCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}
