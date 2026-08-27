import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const IS_PLATFORM_KEY = 'isPlatformOnly';
export const PlatformOnly = () => SetMetadata(IS_PLATFORM_KEY, true);
