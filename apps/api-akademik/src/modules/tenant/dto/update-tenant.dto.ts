import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, Matches } from 'class-validator';
import { TenantStatusDto } from './create-tenant.dto';

export class UpdateTenantDto {
  @ApiPropertyOptional({ example: 'Universitas Widyatama Baru' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'widyatama' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with hyphens' })
  slug?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#1E3A8A' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ enum: TenantStatusDto })
  @IsOptional()
  @IsEnum(TenantStatusDto)
  status?: TenantStatusDto;
}
