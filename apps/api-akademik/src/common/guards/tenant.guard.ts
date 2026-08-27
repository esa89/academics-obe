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
import { extractAndVerifyUserFromRequest } from '../tenant/jwt-parser.util';

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

    // Extract authenticated user identity strictly from verified token / session
    const authUser = extractAndVerifyUserFromRequest(request);

    // If endpoint is platform-only, it requires PLATFORM_ADMIN credentials
    if (isPlatformOnly) {
      if (!authUser || !authUser.isPlatformAdmin) {
        throw new ForbiddenException(
          'Platform admin privileges required. Access is restricted to authenticated platform administrators.',
        );
      }

      request.tenantContext = {
        tenant: {
          id: '',
          code: 'PLATFORM',
          name: 'Platform Administration',
          slug: 'platform',
          status: 'ACTIVE',
        },
        tenantId: '',
        userTenantId: authUser.userTenantId,
        userRole: 'PLATFORM_ADMIN',
        userId: authUser.userId,
        isPlatformAdmin: true,
      } satisfies TenantContext;
      return true;
    }

    // Extract tenant selector from client headers (X-Tenant-Id or X-Tenant-Slug)
    const tenantHeader = (
      request.headers['x-tenant-id'] ||
      request.headers['x-tenant-slug'] ||
      request.headers['x-tenant'] ||
      ''
    ).toString().trim();

    const targetIdentifier = tenantHeader || authUser?.userTenantId || authUser?.userTenantSlug;

    if (!targetIdentifier) {
      throw new UnauthorizedException(
        'Tenant context is required. Please provide X-Tenant-Id or X-Tenant-Slug header.',
      );
    }

    return this.resolveAndAttachTenant(request, targetIdentifier, authUser);
  }

  private async resolveAndAttachTenant(
    request: any,
    identifier: string,
    authUser: ReturnType<typeof extractAndVerifyUserFromRequest>,
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

    // Cross-tenant boundary check:
    // If user is authenticated with a tenant-bound identity and is NOT a PLATFORM_ADMIN,
    // they MUST NOT access data of another tenant!
    if (authUser && !authUser.isPlatformAdmin) {
      if (authUser.userTenantId && authUser.userTenantId !== tenant.id) {
        throw new ForbiddenException('Cross-tenant access forbidden. You cannot access another university data.');
      }
      if (authUser.userTenantSlug && authUser.userTenantSlug !== tenant.slug) {
        throw new ForbiddenException('Cross-tenant access forbidden. You cannot access another university data.');
      }
    }

    const tenantContext: TenantContext = {
      tenant,
      tenantId: tenant.id,
      userTenantId: authUser?.userTenantId,
      userRole: authUser?.roles[0],
      userId: authUser?.userId,
      isPlatformAdmin: authUser?.isPlatformAdmin ?? false,
    };

    request.tenantContext = tenantContext;
    return true;
  }
}
