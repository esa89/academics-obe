import {
  Controller,
  Get,
  Post,
  Put,
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
import { StudentService } from './student.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { Gender, StudentStatus, AdmissionPath } from '@prisma/client';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Students')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant UUID or slug' })
@Controller('students')
export class StudentController {
  constructor(private readonly service: StudentService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Students with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Students retrieved successfully',
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by NIM, Name, Email' })
  @ApiQuery({ name: 'facultyId', required: false, type: String, description: 'Filter by faculty ID' })
  @ApiQuery({ name: 'studyProgramId', required: false, type: String, description: 'Filter by study program ID' })
  @ApiQuery({ name: 'curriculumId', required: false, type: String, description: 'Filter by curriculum ID' })
  @ApiQuery({ name: 'entryYear', required: false, type: Number, description: 'Filter by entry year' })
  @ApiQuery({ name: 'studentStatus', required: false, enum: StudentStatus, description: 'Filter by student status' })
  @ApiQuery({ name: 'gender', required: false, enum: Gender, description: 'Filter by gender' })
  @ApiQuery({ name: 'admissionPath', required: false, enum: AdmissionPath, description: 'Filter by admission path' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryStudentDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Student by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Get(':id/transcript')
  @ApiOperation({ summary: 'Get student academic transcript' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student transcript retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async getTranscript(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.getTranscript(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Student' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Student created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Student NIM or Email already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid FK ID',
  })
  async create(@TenantId() tenantId: string, @Body() data: CreateStudentDto) {
    return this.service.create(tenantId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Student by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Student NIM or Email already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid FK ID',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateStudentDto,
  ) {
    return this.service.update(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Student by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Student deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Student not found',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
