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
import { AcademicSemesterService } from './academic-semester.service';
import { CreateAcademicSemesterDto } from './dto/create-academic-semester.dto';
import { UpdateAcademicSemesterDto } from './dto/update-academic-semester.dto';
import { QueryAcademicSemesterDto } from './dto/query-academic-semester.dto';
import { AcademicSemesterResponseDto } from './dto/academic-semester-response.dto';
import { SemesterType } from './enums/semester-type.enum';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Academic Semesters')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant UUID or slug' })
@Controller('academic-semesters')
export class AcademicSemesterController {
  constructor(private readonly service: AcademicSemesterService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Academic Semesters with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Academic Semesters retrieved successfully',
    type: AcademicSemesterResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code, name, academicYear' })
  @ApiQuery({ name: 'academicYear', required: false, type: String, description: 'Filter by academic year' })
  @ApiQuery({ name: 'semesterType', required: false, enum: SemesterType, description: 'Filter by semester type' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'isCurrent', required: false, type: Boolean, description: 'Filter by current status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryAcademicSemesterDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get('current')
  @ApiOperation({ summary: 'Get current active Academic Semester' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current Academic Semester retrieved successfully',
    type: AcademicSemesterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Current Academic Semester not found',
  })
  async findCurrent(@TenantId() tenantId: string) {
    return this.service.findCurrent(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Academic Semester by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Semester retrieved successfully',
    type: AcademicSemesterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Semester not found',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Academic Semester' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Academic Semester created successfully',
    type: AcademicSemesterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Academic Semester code already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
  })
  async create(@TenantId() tenantId: string, @Body() data: CreateAcademicSemesterDto) {
    return this.service.create(tenantId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Academic Semester by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Semester updated successfully',
    type: AcademicSemesterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Semester not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Academic Semester code already exists in this tenant',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateAcademicSemesterDto,
  ) {
    return this.service.update(tenantId, id, data);
  }

  @Patch(':id/current')
  @ApiOperation({ summary: 'Set Academic Semester as current for this tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Semester set as current successfully',
    type: AcademicSemesterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Semester not found',
  })
  async setCurrent(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.setCurrent(tenantId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Academic Semester by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Semester deleted successfully',
    type: AcademicSemesterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Semester not found',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
