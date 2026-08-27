import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AcademicClassRepository } from './academic-class.repository';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';
import { QueryAcademicClassDto } from './dto/query-academic-class.dto';
import { ImportGradesDto } from './dto/import-grades.dto';

@Injectable()
export class AcademicClassService {
  private readonly logger = new Logger(AcademicClassService.name);

  constructor(private readonly repository: AcademicClassRepository) {}

  async findAll(tenantId: string, query: QueryAcademicClassDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Academic Classes: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Academic Class by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Academic Class with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateAcademicClassDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Academic Class: ${data.code}`);

    const semExists = await this.repository.semesterExists(tenantId, data.semesterId);
    if (!semExists) {
      throw new BadRequestException(`Semester with id '${data.semesterId}' not found in this tenant`);
    }

    const courseExists = await this.repository.courseExists(tenantId, data.courseId);
    if (!courseExists) {
      throw new BadRequestException(`Course with id '${data.courseId}' not found in this tenant`);
    }

    for (const l of data.lecturers) {
      const exists = await this.repository.lecturerExists(tenantId, l.lecturerId);
      if (!exists) {
        throw new BadRequestException(`Lecturer with id '${l.lecturerId}' not found in this tenant`);
      }
    }

    if (data.studentIds) {
      for (const sid of data.studentIds) {
        const exists = await this.repository.studentExists(tenantId, sid);
        if (!exists) {
          throw new BadRequestException(`Student with id '${sid}' not found in this tenant`);
        }
      }
    }

    const exists = await this.repository.existsByCode(
      tenantId,
      data.semesterId,
      data.courseId,
      data.code,
    );
    if (exists) {
      throw new ConflictException(
        `Academic Class with code '${data.code}' already exists for this semester and course in this tenant`,
      );
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Academic Class created: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateAcademicClassDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Academic Class id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Academic Class with id '${id}' not found`);
    }

    if (data.semesterId && data.semesterId !== existing.semesterId) {
      const semExists = await this.repository.semesterExists(tenantId, data.semesterId);
      if (!semExists) {
        throw new BadRequestException(`Semester with id '${data.semesterId}' not found in this tenant`);
      }
    }

    if (data.courseId && data.courseId !== existing.courseId) {
      const courseExists = await this.repository.courseExists(tenantId, data.courseId);
      if (!courseExists) {
        throw new BadRequestException(`Course with id '${data.courseId}' not found in this tenant`);
      }
    }

    if (data.lecturers) {
      for (const l of data.lecturers) {
        const exists = await this.repository.lecturerExists(tenantId, l.lecturerId);
        if (!exists) {
          throw new BadRequestException(`Lecturer with id '${l.lecturerId}' not found in this tenant`);
        }
      }
    }

    if (data.studentIds) {
      for (const sid of data.studentIds) {
        const exists = await this.repository.studentExists(tenantId, sid);
        if (!exists) {
          throw new BadRequestException(`Student with id '${sid}' not found in this tenant`);
        }
      }
    }

    const targetSem = data.semesterId ?? existing.semesterId;
    const targetCourse = data.courseId ?? existing.courseId;
    const targetCode = data.code ?? existing.code;

    if (
      targetSem !== existing.semesterId ||
      targetCourse !== existing.courseId ||
      targetCode !== existing.code
    ) {
      const exists = await this.repository.existsByCode(
        tenantId,
        targetSem,
        targetCourse,
        targetCode,
        id,
      );
      if (exists) {
        throw new ConflictException(
          `Academic Class with code '${targetCode}' already exists for this semester and course in this tenant`,
        );
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    if (!item) {
      throw new NotFoundException(`Academic Class with id '${id}' not found`);
    }
    this.logger.log(`[Tenant ${tenantId}] Academic Class updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Academic Class id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Academic Class with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    if (!item) {
      throw new NotFoundException(`Academic Class with id '${id}' not found`);
    }
    this.logger.log(`[Tenant ${tenantId}] Academic Class deleted: ${item.id}`);
    return item;
  }

  async importGrades(tenantId: string, id: string, data: ImportGradesDto) {
    this.logger.log(`[Tenant ${tenantId}] Importing grades for Academic Class: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Academic Class with id '${id}' not found`);
    }

    return this.repository.bulkUpsertGrades(tenantId, id, data.grades);
  }
}
