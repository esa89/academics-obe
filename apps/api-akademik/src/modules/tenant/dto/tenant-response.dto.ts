import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatusDto } from './create-tenant.dto';

export class TenantResponseDto {
  @ApiProperty({ example: '00000000-0000-0000-0000-000000000001' })
  id!: string;

  @ApiProperty({ example: 'WIDYATAMA' })
  code!: string;

  @ApiProperty({ example: 'Universitas Widyatama' })
  name!: string;

  @ApiProperty({ example: 'widyatama' })
  slug!: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  logoUrl?: string | null;

  @ApiPropertyOptional({ example: '#1E3A8A' })
  primaryColor?: string | null;

  @ApiProperty({ enum: TenantStatusDto, example: TenantStatusDto.ACTIVE })
  status!: TenantStatusDto;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
