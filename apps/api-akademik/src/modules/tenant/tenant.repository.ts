import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { QueryTenantDto } from './dto/query-tenant.dto';
import { createPaginatedResult, PaginatedResult } from '../../common/dto/pagination.dto';

export interface TenantMapped {
  id: string;
  code: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTenantDto): Promise<PaginatedResult<TenantMapped>> {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.TenantWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status as any;
    }

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.tenant.count({ where }),
    ]);

    const mapped = data.map((item) => this.mapToResponse(item));
    return createPaginatedResult(mapped, total, page, limit);
  }

  async findById(id: string): Promise<TenantMapped | null> {
    const item = await this.prisma.tenant.findUnique({
      where: { id },
    });
    return item ? this.mapToResponse(item) : null;
  }

  async findByCode(code: string): Promise<TenantMapped | null> {
    const item = await this.prisma.tenant.findUnique({
      where: { code },
    });
    return item ? this.mapToResponse(item) : null;
  }

  async findBySlug(slug: string): Promise<TenantMapped | null> {
    const item = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    return item ? this.mapToResponse(item) : null;
  }

  async create(data: CreateTenantDto): Promise<TenantMapped> {
    const item = await this.prisma.tenant.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        slug: data.slug.toLowerCase(),
        logoUrl: data.logoUrl ?? null,
        primaryColor: data.primaryColor ?? null,
        status: (data.status as any) ?? 'ACTIVE',
      },
    });
    return this.mapToResponse(item);
  }

  async update(id: string, data: UpdateTenantDto): Promise<TenantMapped> {
    const updateData: Prisma.TenantUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug.toLowerCase();
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor;
    if (data.status !== undefined) updateData.status = data.status as any;

    const item = await this.prisma.tenant.update({
      where: { id },
      data: updateData,
    });
    return this.mapToResponse(item);
  }

  async updateStatus(id: string, status: string): Promise<TenantMapped> {
    const item = await this.prisma.tenant.update({
      where: { id },
      data: { status: status as any },
    });
    return this.mapToResponse(item);
  }

  async remove(id: string): Promise<TenantMapped> {
    const item = await this.prisma.tenant.delete({
      where: { id },
    });
    return this.mapToResponse(item);
  }

  async existsByCode(code: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: {
        code: code.toUpperCase(),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async hasAcademicRecords(tenantId: string): Promise<boolean> {
    const [facultyCount, studentCount, lecturerCount, classCount] = await Promise.all([
      this.prisma.faculty.count({ where: { tenantId } }),
      this.prisma.student.count({ where: { tenantId } }),
      this.prisma.lecturer.count({ where: { tenantId } }),
      this.prisma.academicClass.count({ where: { tenantId } }),
    ]);
    return facultyCount > 0 || studentCount > 0 || lecturerCount > 0 || classCount > 0;
  }

  async existsBySlug(slug: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.tenant.count({
      where: {
        slug: slug.toLowerCase(),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  private mapToResponse(item: any): TenantMapped {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      slug: item.slug,
      logoUrl: item.logoUrl,
      primaryColor: item.primaryColor,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
