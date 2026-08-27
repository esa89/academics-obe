import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { StudentRepository } from './student.repository';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private readonly repository: StudentRepository) {}

  async findAll(tenantId: string, query: QueryStudentDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Students: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Student by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Student with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateStudentDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Student: ${data.nim}`);

    const facultyExists = await this.repository.facultyExists(tenantId, data.facultyId);
    if (!facultyExists) {
      throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
    }

    const spExists = await this.repository.studyProgramExists(tenantId, data.studyProgramId);
    if (!spExists) {
      throw new BadRequestException(`Study Program with id '${data.studyProgramId}' not found in this tenant`);
    }

    if (data.curriculumId) {
      const currExists = await this.repository.curriculumExists(tenantId, data.curriculumId);
      if (!currExists) {
        throw new BadRequestException(`Curriculum with id '${data.curriculumId}' not found in this tenant`);
      }
    }

    if (data.academicSemesterId) {
      const semExists = await this.repository.academicSemesterExists(tenantId, data.academicSemesterId);
      if (!semExists) {
        throw new BadRequestException(`Academic Semester with id '${data.academicSemesterId}' not found in this tenant`);
      }
    }

    const nimExists = await this.repository.existsByNim(tenantId, data.nim);
    if (nimExists) {
      throw new ConflictException(`Student with NIM '${data.nim}' already exists in this tenant`);
    }

    if (data.email) {
      const emailExists = await this.repository.existsByEmail(tenantId, data.email);
      if (emailExists) {
        throw new ConflictException(`Student with email '${data.email}' already exists in this tenant`);
      }
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Student created: ${item.id}`);
    return item;
  }

  async update(tenantId: string, id: string, data: UpdateStudentDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Student id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Student with id '${id}' not found`);
    }

    if (data.facultyId && data.facultyId !== existing.facultyId) {
      const facultyExists = await this.repository.facultyExists(tenantId, data.facultyId);
      if (!facultyExists) {
        throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
      }
    }

    if (data.studyProgramId && data.studyProgramId !== existing.studyProgramId) {
      const spExists = await this.repository.studyProgramExists(tenantId, data.studyProgramId);
      if (!spExists) {
        throw new BadRequestException(`Study Program with id '${data.studyProgramId}' not found in this tenant`);
      }
    }

    if (data.curriculumId !== undefined && data.curriculumId !== null) {
      const currExists = await this.repository.curriculumExists(tenantId, data.curriculumId);
      if (!currExists) {
        throw new BadRequestException(`Curriculum with id '${data.curriculumId}' not found in this tenant`);
      }
    }

    if (data.academicSemesterId !== undefined && data.academicSemesterId !== null) {
      const semExists = await this.repository.academicSemesterExists(tenantId, data.academicSemesterId);
      if (!semExists) {
        throw new BadRequestException(`Academic Semester with id '${data.academicSemesterId}' not found in this tenant`);
      }
    }

    if (data.nim && data.nim !== existing.nim) {
      const nimExists = await this.repository.existsByNim(tenantId, data.nim, id);
      if (nimExists) {
        throw new ConflictException(`Student with NIM '${data.nim}' already exists in this tenant`);
      }
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await this.repository.existsByEmail(tenantId, data.email, id);
      if (emailExists) {
        throw new ConflictException(`Student with email '${data.email}' already exists in this tenant`);
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    this.logger.log(`[Tenant ${tenantId}] Student updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Student id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Student with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    this.logger.log(`[Tenant ${tenantId}] Student deleted: ${item.id}`);
    return item;
  }

  async getTranscript(tenantId: string, studentId: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching transcript for student: ${studentId}`);
    const student = await this.repository.findById(tenantId, studentId);
    if (!student) {
      throw new NotFoundException(`Student with id '${studentId}' not found`);
    }
    return this.repository.getTranscript(tenantId, studentId);
  }
}
