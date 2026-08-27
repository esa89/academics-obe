import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenantContext } from '../tenant/tenant-context.interface';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const context = request.tenantContext as TenantContext | undefined;
    return context?.tenantId || request.tenantId;
  },
);

export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const context = request.tenantContext as TenantContext | undefined;
    return context?.tenant || request.tenant;
  },
);
