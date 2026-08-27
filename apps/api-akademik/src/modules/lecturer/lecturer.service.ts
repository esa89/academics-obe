import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LecturerRepository } from './lecturer.repository';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { QueryLecturerDto } from './dto/query-lecturer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class LecturerService {
  private readonly logger = new Logger(LecturerService.name);
  private readonly identityApiUrl: string;

  constructor(
    private readonly repository: LecturerRepository,
    private readonly configService?: ConfigService,
  ) {
    this.identityApiUrl =
      this.configService?.get<string>('IDENTITY_API_URL') ||
      process.env.IDENTITY_API_URL ||
      'http://localhost:3013';
  }

  async findAll(tenantId: string, query: QueryLecturerDto) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Lecturers: ${JSON.stringify(query)}`);
    return this.repository.findAll(tenantId, query);
  }

  async findOne(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Fetching Lecturer by id: ${id}`);
    const item = await this.repository.findById(tenantId, id);

    if (!item) {
      throw new NotFoundException(`Lecturer with id '${id}' not found`);
    }

    return item;
  }

  async create(tenantId: string, data: CreateLecturerDto) {
    this.logger.log(`[Tenant ${tenantId}] Creating Lecturer: ${data.nidn}`);

    const facultyExists = await this.repository.facultyExists(tenantId, data.facultyId);
    if (!facultyExists) {
      throw new BadRequestException(`Faculty with id '${data.facultyId}' not found in this tenant`);
    }

    const spExists = await this.repository.studyProgramExists(tenantId, data.studyProgramId);
    if (!spExists) {
      throw new BadRequestException(`Study Program with id '${data.studyProgramId}' not found in this tenant`);
    }

    const nidnExists = await this.repository.existsByNidn(tenantId, data.nidn);
    if (nidnExists) {
      throw new ConflictException(`Lecturer with NIDN '${data.nidn}' already exists in this tenant`);
    }

    const nrkExists = await this.repository.existsByNrk(tenantId, data.nrk);
    if (nrkExists) {
      throw new ConflictException(`Lecturer with NRK '${data.nrk}' already exists in this tenant`);
    }

    const emailExists = await this.repository.existsByEmail(tenantId, data.email);
    if (emailExists) {
      throw new ConflictException(`Lecturer with email '${data.email}' already exists in this tenant`);
    }

    if (data.username) {
      const usernameExists = await this.repository.existsByUsername(tenantId, data.username);
      if (usernameExists) {
        throw new ConflictException(`Username '${data.username}' already exists in this tenant`);
      }
    }

    const item = await this.repository.create(tenantId, data);
    this.logger.log(`[Tenant ${tenantId}] Lecturer created: ${item.id}`);

    // Asynchronously attempt to sync with Authentik if credentials were provided
    if (data.username && data.password) {
      this.syncToAuthentik(tenantId, item.id, {
        username: data.username,
        email: data.email,
        name: data.name,
        password: data.password,
      }).catch((err) => {
        this.logger.error(`[Tenant ${tenantId}] Failed to auto-sync lecturer ${item.id} to Authentik: ${err.message}`);
      });
    }

    return item;
  }

  async update(tenantId: string, id: string, data: UpdateLecturerDto) {
    this.logger.log(`[Tenant ${tenantId}] Updating Lecturer id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Lecturer with id '${id}' not found`);
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

    if (data.nidn && data.nidn !== existing.nidn) {
      const nidnExists = await this.repository.existsByNidn(tenantId, data.nidn, id);
      if (nidnExists) {
        throw new ConflictException(`Lecturer with NIDN '${data.nidn}' already exists in this tenant`);
      }
    }

    if (data.nrk && data.nrk !== existing.nrk) {
      const nrkExists = await this.repository.existsByNrk(tenantId, data.nrk, id);
      if (nrkExists) {
        throw new ConflictException(`Lecturer with NRK '${data.nrk}' already exists in this tenant`);
      }
    }

    if (data.email && data.email !== existing.email) {
      const emailExists = await this.repository.existsByEmail(tenantId, data.email, id);
      if (emailExists) {
        throw new ConflictException(`Lecturer with email '${data.email}' already exists in this tenant`);
      }
    }

    const item = await this.repository.update(tenantId, id, data);
    if (!item) {
      throw new NotFoundException(`Lecturer with id '${id}' not found`);
    }
    this.logger.log(`[Tenant ${tenantId}] Lecturer updated: ${item.id}`);
    return item;
  }

  async remove(tenantId: string, id: string) {
    this.logger.log(`[Tenant ${tenantId}] Deleting Lecturer id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Lecturer with id '${id}' not found`);
    }

    const item = await this.repository.remove(tenantId, id);
    if (!item) {
      throw new NotFoundException(`Lecturer with id '${id}' not found`);
    }
    this.logger.log(`[Tenant ${tenantId}] Lecturer deleted: ${item.id}`);
    return item;
  }

  async resetPassword(tenantId: string, id: string, data: ResetPasswordDto) {
    this.logger.log(`[Tenant ${tenantId}] Resetting password for Lecturer id: ${id}`);

    const existing = await this.repository.findById(tenantId, id);
    if (!existing) {
      throw new NotFoundException(`Lecturer with id '${id}' not found`);
    }

    if (!existing.identityUserId) {
      throw new BadRequestException(`Lecturer ${existing.name} is not linked to an Authentik identity account`);
    }

    try {
      await axios.post(
        `${this.identityApiUrl}/users/${existing.identityUserId}/reset-password`,
        { password: data.newPassword },
      );
      return { success: true, message: 'Password reset successfully' };
    } catch (err: any) {
      this.logger.error(`Failed to reset password via identity API: ${err.message}`);
      throw new BadRequestException('Failed to communicate with Identity service');
    }
  }

  private async syncToAuthentik(
    tenantId: string,
    lecturerId: string,
    payload: { username: string; email: string; name: string; password?: string },
  ) {
    try {
      const resp = await axios.post(`${this.identityApiUrl}/users`, {
        ...payload,
        role: 'dosen',
      });
      if (resp.data?.data?.id) {
        await this.repository.updateAuthentikInfo(tenantId, lecturerId, {
          identityUserId: resp.data.data.id,
          authentikStatus: 'ACTIVE',
        });
      }
    } catch (err: any) {
      this.logger.warn(`Identity sync failed for lecturer ${lecturerId}: ${err.message}`);
    }
  }
}
