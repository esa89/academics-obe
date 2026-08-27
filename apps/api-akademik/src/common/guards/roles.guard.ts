import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { extractAndVerifyUserFromRequest } from '../tenant/jwt-parser.util';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly reflector: Reflector;

  constructor(@Optional() reflector?: Reflector) {
    this.reflector = reflector || new Reflector();
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authUser = extractAndVerifyUserFromRequest(request);

    if (!authUser) {
      throw new ForbiddenException(
        `Authentication required. Roles required: ${requiredRoles.join(', ')}`,
      );
    }

    // PLATFORM_ADMIN has universal access
    if (authUser.isPlatformAdmin || authUser.roles.includes('PLATFORM_ADMIN')) {
      return true;
    }

    const hasRole = requiredRoles.some((r) =>
      authUser.roles.some((userRole) => userRole.toLowerCase() === r.toLowerCase()),
    );

    if (!hasRole) {
      throw new ForbiddenException(
        `Insufficient role privileges. Required: ${requiredRoles.join(', ')}, actual: ${authUser.roles.join(', ')}`,
      );
    }

    return true;
  }
}
