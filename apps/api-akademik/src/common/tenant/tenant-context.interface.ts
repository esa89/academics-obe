export interface TenantInfo {
  id: string;
  code: string;
  name: string;
  slug: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export interface TenantContext {
  tenant: TenantInfo;
  tenantId: string;
  userId?: string;
  userRole?: string;
  userTenantId?: string;
  isPlatformAdmin?: boolean;
}
