import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { FacultyRepository } from './faculty.repository';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { QueryFacultyDto } from './dto/query-faculty.dto';

@Injectable()
export class FacultyService {
  private readonly logger = new Logger(FacultyService.name);

  constructor(private readonly repository: FacultyRepository) {}

  async findAll(tenantId: string, query: QueryFacultyDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Faculties: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Faculty by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Faculty with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateFacultyDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Faculty with code: ${data.code}`);

    const exists = await this.repository.existsByCode(tenantId, data.code);
    if (exists) {
      throw new ConflictException(
        `Faculty with code '${data.code}' already exists in this tenant`,
      );
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Faculty created with id: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateFacultyDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Faculty id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Faculty with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(tenantId, data.code, id);
      if (codeExists) {
        throw new ConflictException(
          `Faculty with code '${data.code}' already exists in this tenant`,
        );
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    this.logger.log(`[Tenant ${tenantId}] Faculty updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Faculty id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Faculty with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    this.logger.log(`[Tenant ${tenantId}] Faculty deleted: ${item.id}`);
    return item;
  }
}
