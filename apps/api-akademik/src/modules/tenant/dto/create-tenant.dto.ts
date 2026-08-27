import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
  MaxLength,
} from 'class-validator';

export enum TenantStatusDto {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export class CreateTenantDto {
  @ApiProperty({ example: 'WIDYATAMA', description: 'Unique tenant uppercase code' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Z0-9_-]+$/, { message: 'Code must only contain uppercase alphanumeric, hyphens, and underscores' })
  code!: string;

  @ApiProperty({ example: 'Universitas Widyatama' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiProperty({ example: 'widyatama', description: 'Subdomain or URL-friendly slug' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9-]+$/, { message: 'Slug must only contain lowercase alphanumeric and hyphens' })
  slug!: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: '#1E3A8A' })
  @IsOptional()
  @IsString()
  primaryColor?: string;

  @ApiPropertyOptional({ enum: TenantStatusDto, default: TenantStatusDto.ACTIVE })
  @IsOptional()
  @IsEnum(TenantStatusDto)
  status?: TenantStatusDto;
}
