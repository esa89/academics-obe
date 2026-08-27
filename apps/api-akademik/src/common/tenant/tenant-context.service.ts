import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { TenantContext } from './tenant-context.interface';

@Injectable()
export class TenantContextService {
  private static readonly storage = new AsyncLocalStorage<TenantContext>();

  static run<R>(context: TenantContext, callback: () => R): R {
    return this.storage.run(context, callback);
  }

  static getContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  static getRequiredTenantId(): string {
    const tenantId = this.storage.getStore()?.tenantId;
    if (!tenantId) {
      throw new Error('Tenant context is missing in current execution context');
    }
    return tenantId;
  }
}
