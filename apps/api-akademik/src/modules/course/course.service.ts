import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CourseRepository } from './course.repository';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(private readonly repository: CourseRepository) {}

  async findAll(tenantId: string, query: QueryCourseDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Courses: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Course by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Course with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateCourseDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Course: ${data.code}`);

    if (data.curriculumId) {
      const currExists = await this.repository.curriculumExists(tenantId, data.curriculumId);
      if (!currExists) {
        throw new BadRequestException(`Curriculum with id '${data.curriculumId}' not found in this tenant`);
      }
    }

    if (data.facultyId) {
      const facExists = await this.repository.facultyExists(tenantId, data.facultyId);
      if (!facExists) {
        throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
      }
    }

    const exists = await this.repository.existsByCode(tenantId, data.code);
    if (exists) {
      throw new ConflictException(`Course with code '${data.code}' already exists in this tenant`);
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Course created: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateCourseDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Course id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Course with id '${id}' not found`);
    }

    if (data.curriculumId !== undefined && data.curriculumId !== null) {
      const currExists = await this.repository.curriculumExists(tenantId, data.curriculumId);
      if (!currExists) {
        throw new BadRequestException(`Curriculum with id '${data.curriculumId}' not found in this tenant`);
      }
    }

    if (data.facultyId !== undefined && data.facultyId !== null) {
      const facExists = await this.repository.facultyExists(tenantId, data.facultyId);
      if (!facExists) {
        throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
      }
    }

    if (data.code && data.code !== existing.code) {
      const codeExists = await this.repository.existsByCode(tenantId, data.code, id);
      if (codeExists) {
        throw new ConflictException(`Course with code '${data.code}' already exists in this tenant`);
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    this.logger.log(`[Tenant ${tenantId}] Course updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Course id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Course with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    this.logger.log(`[Tenant ${tenantId}] Course deleted: ${item.id}`);
    return item;
  }
}
