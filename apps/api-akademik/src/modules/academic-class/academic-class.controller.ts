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
import { AcademicClassService } from './academic-class.service';
import { CreateAcademicClassDto } from './dto/create-academic-class.dto';
import { UpdateAcademicClassDto } from './dto/update-academic-class.dto';
import { QueryAcademicClassDto } from './dto/query-academic-class.dto';
import { ImportGradesDto } from './dto/import-grades.dto';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Academic Classes')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant UUID or slug' })
@Controller('academic-classes')
export class AcademicClassController {
  constructor(private readonly service: AcademicClassService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Academic Classes with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Academic Classes retrieved successfully',
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by class code, name, or course name' })
  @ApiQuery({ name: 'semesterId', required: false, type: String, description: 'Filter by semester ID' })
  @ApiQuery({ name: 'courseId', required: false, type: String, description: 'Filter by course ID' })
  @ApiQuery({ name: 'lecturerId', required: false, type: String, description: 'Filter by lecturer ID' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryAcademicClassDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Academic Class detail by ID (including lecturers and students with grades)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Class detail retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Class not found',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Academic Class with lecturer assignments and optional student enrollments' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Academic Class created successfully',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Academic Class code already exists for this semester and course in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid Foreign Key IDs',
  })
  async create(@TenantId() tenantId: string, @Body() data: CreateAcademicClassDto) {
    return this.service.create(tenantId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Academic Class by ID (including lecturers and student enrollments)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Class updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Class not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Academic Class code already exists for this semester and course in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid Foreign Key IDs',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateAcademicClassDto,
  ) {
    return this.service.update(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Academic Class by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Academic Class deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Class not found',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }

  @Post(':id/grades/import')
  @ApiOperation({ summary: 'Bulk import or update grades for enrolled students in a class' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Grades imported successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Academic Class not found',
  })
  async importGrades(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: ImportGradesDto,
  ) {
    return this.service.importGrades(tenantId, id, data);
  }
}
