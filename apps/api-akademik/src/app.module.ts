import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import appConfig from './config/app.config';
import { DatabaseModule } from './database/database.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { FacultyModule } from './modules/faculty/faculty.module';
import { StudyProgramModule } from './modules/study-program/study-program.module';
import { CurriculumModule } from './modules/curriculum/curriculum.module';
import { CourseModule } from './modules/course/course.module';
import { AcademicSemesterModule } from './modules/academic-semester/academic-semester.module';
import { LecturerModule } from './modules/lecturer/lecturer.module';
import { StudentModule } from './modules/student/student.module';
import { AcademicClassModule } from './modules/academic-class/academic-class.module';
import { TenantGuard } from './common/guards/tenant.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantContextInterceptor } from './common/interceptors/tenant-context.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env'],
    }),
    DatabaseModule,
    TenantModule,
    FacultyModule,
    StudyProgramModule,
    CurriculumModule,
    CourseModule,
    AcademicSemesterModule,
    LecturerModule,
    StudentModule,
    AcademicClassModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantContextInterceptor,
    },
  ],
})
export class AppModule {}
