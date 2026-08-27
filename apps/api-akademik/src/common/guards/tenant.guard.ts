import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../database/prisma.service';
import { IS_PUBLIC_KEY, IS_PLATFORM_KEY } from '../decorators/public.decorator';
import { TenantContext, TenantInfo } from '../tenant/tenant-context.interface';

@Injectable()
export class TenantGuard implements CanActivate {
  private readonly logger = new Logger(TenantGuard.name);
  private readonly reflector: Reflector;
  private readonly prismaService: PrismaService;

  constructor(
    @Optional() reflector?: Reflector,
    @Optional() prisma?: PrismaService,
  ) {
    this.reflector = reflector || new Reflector();
    this.prismaService = prisma || new PrismaService();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const isPlatformOnly = this.reflector.getAllAndOverride<boolean>(IS_PLATFORM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Extract tenant identifier from headers or cookies
    const tenantHeader = (
      request.headers['x-tenant-id'] ||
      request.headers['x-tenant-slug'] ||
      request.headers['x-tenant'] ||
      ''
    ).toString().trim();

    // Extract user auth info from headers (mock/gateway forwarded auth headers)
    const userTenantId = (request.headers['x-user-tenant-id'] || '').toString().trim();
    const userRole = (request.headers['x-user-role'] || '').toString().trim();
    const userId = (request.headers['x-user-id'] || '').toString().trim();

    // If endpoint is platform-only, it doesn't require a tenant header, but requires platform auth
    if (isPlatformOnly) {
      request.tenantContext = {
        tenant: {
          id: '',
          code: 'PLATFORM',
          name: 'Platform Administration',
          slug: 'platform',
          status: 'ACTIVE',
        },
        tenantId: '',
        userTenantId: userTenantId || undefined,
        userRole: userRole || undefined,
        userId: userId || undefined,
        isPlatformAdmin: true,
      } satisfies TenantContext;
      return true;
    }

    if (!tenantHeader) {
      // Check if user has tenantId in token claims
      if (userTenantId) {
        return this.resolveAndAttachTenant(request, userTenantId, { userTenantId, userRole, userId });
      }

      throw new UnauthorizedException(
        'Tenant context is required. Please provide X-Tenant-Id or X-Tenant-Slug header.',
      );
    }

    return this.resolveAndAttachTenant(request, tenantHeader, { userTenantId, userRole, userId });
  }

  private async resolveAndAttachTenant(
    request: any,
    identifier: string,
    userInfo: { userTenantId?: string; userRole?: string; userId?: string },
  ): Promise<boolean> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    let tenant: TenantInfo | null = null;

    if (isUuid) {
      tenant = (await this.prismaService.tenant.findUnique({
        where: { id: identifier },
        select: { id: true, code: true, name: true, slug: true, status: true },
      })) as TenantInfo | null;
    } else {
      tenant = (await this.prismaService.tenant.findFirst({
        where: {
          OR: [
            { slug: identifier.toLowerCase() },
            { code: identifier.toUpperCase() },
          ],
        },
        select: { id: true, code: true, name: true, slug: true, status: true },
      })) as TenantInfo | null;
    }

    if (!tenant) {
      throw new UnauthorizedException(`Tenant '${identifier}' not found`);
    }

    if (tenant.status !== 'ACTIVE') {
      throw new ForbiddenException(`Tenant '${tenant.name}' is currently ${tenant.status.toLowerCase()}`);
    }

    // Cross-tenant barrier: if authenticated user belongs to a different tenant and is not PLATFORM_ADMIN
    if (
      userInfo.userTenantId &&
      userInfo.userRole !== 'PLATFORM_ADMIN' &&
      userInfo.userTenantId !== tenant.id
    ) {
      throw new ForbiddenException('Cross-tenant access forbidden. You cannot access another university data.');
    }

    const tenantContext: TenantContext = {
      tenant,
      tenantId: tenant.id,
      userTenantId: userInfo.userTenantId,
      userRole: userInfo.userRole,
      userId: userInfo.userId,
      isPlatformAdmin: userInfo.userRole === 'PLATFORM_ADMIN',
    };

    request.tenantContext = tenantContext;
    return true;
  }
}
