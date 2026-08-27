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
import { CourseService } from './course.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { CourseResponseDto } from './dto/course-response.dto';
import { TenantId } from '../../common/decorators/tenant.decorator';

@ApiTags('Courses')
@ApiBearerAuth()
@ApiHeader({ name: 'x-tenant-id', required: false, description: 'Tenant UUID or slug' })
@Controller('courses')
export class CourseController {
  constructor(private readonly service: CourseService) {}

  @Get()
  @ApiOperation({ summary: 'Get all Courses with pagination, search, and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of Courses retrieved successfully',
    type: CourseResponseDto,
    isArray: true,
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (max 100)' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code or name' })
  @ApiQuery({ name: 'curriculumId', required: false, type: String, description: 'Filter by curriculum ID' })
  @ApiQuery({ name: 'semester', required: false, type: Number, description: 'Filter by semester (1-8)' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Sort field' })
  @ApiQuery({ name: 'sortOrder', required: false, type: String, description: 'Sort direction (asc, desc)' })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryCourseDto) {
    return this.service.findAll(tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course retrieved successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.findOne(tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new Course' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Course code already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid curriculumId/facultyId',
  })
  async create(@TenantId() tenantId: string, @Body() data: CreateCourseDto) {
    return this.service.create(tenantId, data);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Course code already exists in this tenant',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error or invalid curriculumId/facultyId',
  })
  async update(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateCourseDto,
  ) {
    return this.service.update(tenantId, id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete Course by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Course deleted successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Course not found',
  })
  async remove(
    @TenantId() tenantId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ) {
    return this.service.remove(tenantId, id);
  }
}
