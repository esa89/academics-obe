export interface DecodedAuthUser {
  userId?: string;
  email?: string;
  username?: string;
  roles: string[];
  userTenantId?: string;
  userTenantSlug?: string;
  isPlatformAdmin: boolean;
}

export function extractAndVerifyUserFromRequest(request: any): DecodedAuthUser | null {
  // 1. If upstream passport / auth middleware already validated request.user
  if (request.user && typeof request.user === 'object') {
    return normalizeSessionUser(request.user);
  }

  // 2. Parse Authorization: Bearer <jwt> token
  const authHeader = request.headers['authorization'] || request.headers['Authorization'];
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    const payload = parseJwtPayload(token);
    if (payload) {
      return normalizeSessionUser(payload);
    }
  }

  return null;
}

function parseJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      Buffer.from(base64, 'base64')
        .toString('utf-8')
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function normalizeSessionUser(data: Record<string, any>): DecodedAuthUser {
  const groups: string[] = Array.isArray(data.groups)
    ? data.groups
    : typeof data.groups === 'string'
    ? [data.groups]
    : [];

  const rawRoles: string[] = Array.isArray(data.roles)
    ? data.roles
    : typeof data.role === 'string'
    ? [data.role]
    : typeof data.roles === 'string'
    ? [data.roles]
    : [];

  const combinedRoles = Array.from(new Set([...groups, ...rawRoles].map((r) => r.trim())));

  const isPlatformAdmin = combinedRoles.some((r) => {
    const lower = r.toLowerCase();
    return lower === 'platform_admin' || lower === 'platform-admin' || lower === 'admin_platform';
  });

  const userTenantId =
    data.tenantId ||
    data.tenant_id ||
    data.organizationId ||
    data.organization_id ||
    (typeof data.metadata === 'object' && (data.metadata.tenantId || data.metadata.tenant_id)) ||
    undefined;

  const userTenantSlug =
    data.tenantSlug ||
    data.tenant_slug ||
    data.organization ||
    (typeof data.metadata === 'object' && (data.metadata.tenantSlug || data.metadata.tenant_slug)) ||
    undefined;

  return {
    userId: data.id || data.sub || data.userId,
    email: data.email,
    username: data.preferred_username || data.username || data.name,
    roles: combinedRoles,
    userTenantId: userTenantId ? String(userTenantId).trim() : undefined,
    userTenantSlug: userTenantSlug ? String(userTenantSlug).trim().toLowerCase() : undefined,
    isPlatformAdmin,
  };
}
