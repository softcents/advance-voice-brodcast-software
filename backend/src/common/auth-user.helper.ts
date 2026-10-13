/**
 * Helper to safely extract user identity and role from JWT Authorization header or fallback
 */
export function extractAuthUser(
  authHeader?: string,
  explicitUserId?: string,
): { userId?: string; role?: string; email?: string } {
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payloadBase64 = token.split('.')[1];
      if (payloadBase64) {
        const decoded = JSON.parse(Buffer.from(payloadBase64, 'base64').toString('utf8'));
        return {
          userId: explicitUserId || decoded.sub,
          role: decoded.role,
          email: decoded.email,
        };
      }
    } catch {
      // ignore token decode errors and fall back
    }
  }

  return { userId: explicitUserId };
}
