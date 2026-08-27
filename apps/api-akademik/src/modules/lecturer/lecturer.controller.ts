import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { LecturerService } from './lecturer.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { QueryLecturerDto } from './dto/query-lecturer.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Degree } from '../study-program/enums/degree.enum';
import { AcademicPosition, AuthentikStatus } from '@prisma/client';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Lecturers')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant UUID or slug' })
@Controller('lecturers')
export class LecturerController {
  constructor(private readonly service: LecturerService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Lecturers with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Lecturers retrieved successfully',
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by NIDN, NRK, Name, Email, Username' })
  @ApiQuery({ name: 'facultyId', required: false, type: String, description: 'Filter by faculty ID' })
  @ApiQuery({ name: 'studyProgramId', required: false, type: String, description: 'Filter by study program ID' })
  @ApiQuery({ name: 'lastEducation', required: false, enum: Degree, description: 'Filter by last education' })
  @ApiQuery({ name: 'academicPosition', required: false, enum: AcademicPosition, description: 'Filter by academic position' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'authentikStatus', required: false, enum: AuthentikStatus, description: 'Filter by Authentik sync status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryLecturerDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Lecturer by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lecturer retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lecturer not found',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Lecturer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lecturer created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lecturer NIDN, NRK, Email, or Username already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid facultyId/studyProgramId',
  })
  async create(@TenantId() tenantId: string, @Body() data: CreateLecturerDto) {
    return this.service.create(tenantId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Lecturer by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lecturer updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lecturer not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Lecturer NIDN, NRK, or Email already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid facultyId/studyProgramId',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateLecturerDto,
  ) {
    return this.service.update(tenantId, id, data);
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: 'Reset Lecturer Authentik password' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lecturer not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Lecturer is not linked to an Authentik account',
  })
  async resetPassword(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: ResetPasswordDto,
  ) {
    return this.service.resetPassword(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Lecturer by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lecturer deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lecturer not found',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
