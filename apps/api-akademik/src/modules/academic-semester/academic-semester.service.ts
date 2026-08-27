import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { AcademicSemesterRepository } from './academic-semester.repository';
import { CreateAcademicSemesterDto } from './dto/create-academic-semester.dto';
import { UpdateAcademicSemesterDto } from './dto/update-academic-semester.dto';
import { QueryAcademicSemesterDto } from './dto/query-academic-semester.dto';

@Injectable()
export class AcademicSemesterService {
  private readonly logger = new Logger(AcademicSemesterService.name);

  constructor(private readonly repository: AcademicSemesterRepository) {}

  async findAll(tenantId: string, query: QueryAcademicSemesterDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Academic Semesters: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Academic Semester by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    return item;
  }

  async findCurrent(tenantId: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching current Academic Semester`);
    const item = await this.repository.findCurrent(tenantId);

    if (!item) {
      throw new NotFoundException('Current Academic Semester not found');
    }

    return item;
  }

  async create(tenantId: string, data: CreateAcademicSemesterDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Academic Semester: ${data.code}`);

    const exists = await this.repository.existsByCode(tenantId, data.code);
    if (exists) {
      throw new ConflictException(
        `Academic Semester with code '${data.code}' already exists in this tenant`,
      );
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Academic Semester created: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateAcademicSemesterDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Academic Semester id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(tenantId, data.code, id);
      if (codeExists) {
        throw new ConflictException(
          `Academic Semester with code '${data.code}' already exists in this tenant`,
        );
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    this.logger.log(`[Tenant ${tenantId}] Academic Semester updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Academic Semester id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    this.logger.log(`[Tenant ${tenantId}] Academic Semester deleted: ${item.id}`);
    return item;
  }

  async setCurrent(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Setting Academic Semester as current: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Academic Semester with id '${id}' not found`);
    }

    const item = await this.repository.setCurrent(tenantId, id);
    this.logger.log(`[Tenant ${tenantId}] Academic Semester set as current: ${item.id}`);
    return item;
  }
}
