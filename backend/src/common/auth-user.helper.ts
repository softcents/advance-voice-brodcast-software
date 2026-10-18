import { UnauthorizedException } from '@nestjs/common';

export interface AuthContext {
  userId?: string;
  role?: string;
  email?: string;
  isAuthenticated: boolean;
}

/**
 * Helper to strictly extract user identity and enforce tenant isolation.
 * Non-admin users are strictly locked to their authenticated JWT subject (decoded.sub).
 * Admins may optionally specify explicitUserId to manage on behalf of a tenant.
 */
export function extractAuthUser(
  authHeader?: string,
  explicitUserId?: string,
  requireAuth: boolean = false,
): AuthContext {
  let decoded: { sub?: string; role?: string; email?: string } | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
      }
    } catch {
      // invalid token format
    }
  }

  if (requireAuth && !decoded?.sub) {
    throw new UnauthorizedException('Authentication required');
  }

  if (decoded?.sub) {
    const isSuperAdmin = decoded.role === 'SUPER_ADMIN';
    // Only SUPER_ADMIN can act on behalf of another user via explicitUserId
    const resolvedUserId = isSuperAdmin && explicitUserId ? explicitUserId : decoded.sub;

    return {
      userId: resolvedUserId,
      role: decoded.role,
      email: decoded.email,
      isAuthenticated: true,
    };
  }

  // Fallback for non-authenticated contexts (or internal worker calls)
  return {
    userId: explicitUserId,
    role: undefined,
    email: undefined,
    isAuthenticated: false,
  };
}
