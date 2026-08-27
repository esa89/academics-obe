import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { StudyProgramRepository } from './study-program.repository';
import { CreateStudyProgramDto } from './dto/create-study-program.dto';
import { UpdateStudyProgramDto } from './dto/update-study-program.dto';
import { QueryStudyProgramDto } from './dto/query-study-program.dto';

@Injectable()
export class StudyProgramService {
  private readonly logger = new Logger(StudyProgramService.name);

  constructor(private readonly repository: StudyProgramRepository) {}

  async findAll(tenantId: string, query: QueryStudyProgramDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching StudyPrograms: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching StudyProgram by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateStudyProgramDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating StudyProgram: ${data.code}`);

    const facultyExists = await this.repository.facultyExists(tenantId, data.facultyId);
    if (!facultyExists) {
      throw new BadRequestException(
        `Faculty with id '${data.facultyId}' not found in this tenant`,
      );
    }

    const exists = await this.repository.existsByCode(tenantId, data.code);
    if (exists) {
      throw new ConflictException(
        `Study Program with code '${data.code}' already exists in this tenant`,
      );
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] StudyProgram created: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateStudyProgramDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating StudyProgram id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }

    if (data.facultyId && data.facultyId !== existing.facultyId) {
      const facultyExists = await this.repository.facultyExists(tenantId, data.facultyId);
      if (!facultyExists) {
        throw new BadRequestException(
          `Faculty with id '${data.facultyId}' not found in this tenant`,
        );
      }
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(tenantId, data.code, id);
      if (codeExists) {
        throw new ConflictException(
          `Study Program with code '${data.code}' already exists in this tenant`,
        );
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    if (!item) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }
    this.logger.log(`[Tenant ${tenantId}] StudyProgram updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting StudyProgram id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    if (!item) {
      throw new NotFoundException(`Study Program with id '${id}' not found`);
    }
    this.logger.log(`[Tenant ${tenantId}] StudyProgram deleted: ${item.id}`);
    return item;
  }
}
