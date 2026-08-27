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
} from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { UpdateTenantStatusDto } from './dto/update-tenant-status.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { TenantResponseDto } from './dto/tenant-response.dto';
import { PlatformOnly, Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tenants (Platform Admin)')
@ApiBearerAuth()
@Controller('tenants')
export class TenantController {
  constructor(private readonly service: TenantService) {}

  @Public()
  @Get('lookup/:slug')
  @ApiOperation({ summary: 'Public lookup for tenant branding/configuration by slug' })
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async lookup(@Param('slug') slug: string) {
    return this.service.findBySlug(slug);
  }

  @Get()
  @PlatformOnly()
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Get all Tenants with pagination and search (Platform Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto, isArray: true })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'] })
  async findAll(@Query() query: QueryTenantDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @PlatformOnly()
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Get Tenant by ID (Platform Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @PlatformOnly()
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Create a new Tenant (Platform Admin only)' })
  @ApiResponse({ status: HttpStatus.CREATED, type: TenantResponseDto })
  async create(@Body() data: CreateTenantDto) {
    return this.service.create(data);
  }

  @Put(':id')
  @PlatformOnly()
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Update Tenant metadata (Platform Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateTenantDto,
  ) {
    return this.service.update(id, data);
  }

  @Patch(':id/status')
  @PlatformOnly()
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Update Tenant active status (Platform Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() data: UpdateTenantStatusDto,
  ) {
    return this.service.updateStatus(id, data);
  }

  @Delete(':id')
  @PlatformOnly()
  @Roles('PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Delete Tenant (Platform Admin only)' })
  @ApiResponse({ status: HttpStatus.OK, type: TenantResponseDto })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.service.remove(id);
  }
}
