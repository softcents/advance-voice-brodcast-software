/**
 * Utility for making authenticated API requests with active user scoping
 */

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('impersonated_token') || localStorage.getItem('voicepro_token')
      : null;

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export function getActiveUserId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const impUser = localStorage.getItem('impersonated_user');
    if (impUser) return JSON.parse(impUser).id;
    const user = localStorage.getItem('voicepro_user');
    if (user) return JSON.parse(user).id;
  } catch {}
  return undefined;
}

export function getActiveUserRole(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const impUser = localStorage.getItem('impersonated_user');
    if (impUser) return JSON.parse(impUser).role;
    const user = localStorage.getItem('voicepro_user');
    if (user) return JSON.parse(user).role;
  } catch {}
  return undefined;
}
