import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { TenantRepository, TenantMapped } from './tenant.repository';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(private readonly repository: TenantRepository) {}

  async findAll(query: QueryTenantDto) {
    this.logger.log(`Fetching tenants with query: ${JSON.stringify(query)}`);
    return this.repository.findAll(query);
  }

  async findOne(id: string): Promise<TenantMapped> {
    this.logger.log(`Fetching tenant by id: ${id}`);
    const item = await this.repository.findById(id);
    if (!item) {
      throw new NotFoundException(`Tenant with id '${id}' not found`);
    }
    return item;
  }

  async findBySlug(slug: string): Promise<TenantMapped> {
    this.logger.log(`Fetching tenant by slug: ${slug}`);
    const item = await this.repository.findBySlug(slug);
    if (!item) {
      throw new NotFoundException(`Tenant with slug '${slug}' not found`);
    }
    return item;
  }

  async create(data: CreateTenantDto): Promise<TenantMapped> {
    this.logger.log(`Creating tenant: ${data.code}`);

    const codeExists = await this.repository.existsByCode(data.code);
    if (codeExists) {
      throw new ConflictException(`Tenant with code '${data.code}' already exists`);
    }

    const slugExists = await this.repository.existsBySlug(data.slug);
    if (slugExists) {
      throw new ConflictException(`Tenant with slug '${data.slug}' already exists`);
    }

    const item = await this.repository.create(data);
    this.logger.log(`Tenant created: ${item.id} (${item.code})`);
    return item;
  }

  async update(id: string, data: UpdateTenantDto): Promise<TenantMapped> {
    this.logger.log(`Updating tenant: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tenant with id '${id}' not found`);
    }

    if (data.slug && data.slug.toLowerCase() !== existing.slug) {
      const slugExists = await this.repository.existsBySlug(data.slug, id);
      if (slugExists) {
        throw new ConflictException(`Tenant with slug '${data.slug}' already exists`);
      }
    }

    const item = await this.repository.update(id, data);
    this.logger.log(`Tenant updated: ${item.id}`);
    return item;
  }

  async updateStatus(id: string, data: UpdateTenantStatusDto): Promise<TenantMapped> {
    this.logger.log(`Updating tenant status: ${id} -> ${data.status}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tenant with id '${id}' not found`);
    }

    const item = await this.repository.updateStatus(id, data.status);
    this.logger.log(`Tenant status updated: ${item.id} -> ${item.status}`);
    return item;
  }

  async remove(id: string): Promise<TenantMapped> {
    this.logger.log(`Deleting tenant: ${id}`);

    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`Tenant with id '${id}' not found`);
    }

    // Protect default WIDYATAMA tenant from accidental deletion
    if (existing.code === 'WIDYATAMA') {
      throw new ConflictException('Primary default tenant cannot be deleted');
    }

    const item = await this.repository.remove(id);
    this.logger.log(`Tenant deleted: ${item.id}`);
    return item;
  }
}
