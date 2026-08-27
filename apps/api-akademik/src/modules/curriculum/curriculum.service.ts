import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { CreateCurriculumDto } from './dto/create-curriculum.dto';
import { UpdateCurriculumDto } from './dto/update-curriculum.dto';
import { QueryCurriculumDto } from './dto/query-curriculum.dto';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);

  constructor(private readonly repository: CurriculumRepository) {}

  async findAll(tenantId: string, query: QueryCurriculumDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Curricula: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Curriculum by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Curriculum with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateCurriculumDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Curriculum: ${data.code}`);

    if (data.studyProgramId) {
      const spExists = await this.repository.studyProgramExists(tenantId, data.studyProgramId);
      if (!spExists) {
        throw new BadRequestException(`Study Program with id '${data.studyProgramId}' not found in this tenant`);
      }
    }

    if (data.facultyId) {
      const facExists = await this.repository.facultyExists(tenantId, data.facultyId);
      if (!facExists) {
        throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
      }
    }

    const exists = await this.repository.existsByCode(
      tenantId,
      data.code,
      data.studyProgramId ?? null,
      data.facultyId ?? null,
    );
    if (exists) {
      throw new ConflictException(`Curriculum with code '${data.code}' already exists in this scope for this tenant`);
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Curriculum created: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateCurriculumDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Curriculum id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Curriculum with id '${id}' not found`);
    }

    if (data.studyProgramId !== undefined && data.studyProgramId !== null) {
      const spExists = await this.repository.studyProgramExists(tenantId, data.studyProgramId);
      if (!spExists) {
        throw new BadRequestException(`Study Program with id '${data.studyProgramId}' not found in this tenant`);
      }
    }

    if (data.facultyId !== undefined && data.facultyId !== null) {
      const facExists = await this.repository.facultyExists(tenantId, data.facultyId);
      if (!facExists) {
        throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    this.logger.log(`[Tenant ${tenantId}] Curriculum updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Curriculum id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Curriculum with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    this.logger.log(`[Tenant ${tenantId}] Curriculum deleted: ${item.id}`);
    return item;
  }
}
