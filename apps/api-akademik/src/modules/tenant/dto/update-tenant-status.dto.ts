import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { TenantStatusDto } from './create-tenant.dto';

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatusDto, example: TenantStatusDto.ACTIVE })
  @IsNotEmpty()
  @IsEnum(TenantStatusDto)
  status!: TenantStatusDto;
}
