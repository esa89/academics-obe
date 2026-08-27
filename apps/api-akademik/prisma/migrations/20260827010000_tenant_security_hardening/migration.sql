-- Security Hardening: Change Foreign Key Constraints on Tenant from CASCADE to RESTRICT

-- 1. faculties
ALTER TABLE "faculties" DROP CONSTRAINT IF EXISTS "faculties_tenantId_fkey";
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 2. study_programs
ALTER TABLE "study_programs" DROP CONSTRAINT IF EXISTS "study_programs_tenantId_fkey";
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 3. curriculums
ALTER TABLE "curriculums" DROP CONSTRAINT IF EXISTS "curriculums_tenantId_fkey";
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. courses
ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_tenantId_fkey";
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. academic_semesters
ALTER TABLE "academic_semesters" DROP CONSTRAINT IF EXISTS "academic_semesters_tenantId_fkey";
ALTER TABLE "academic_semesters" ADD CONSTRAINT "academic_semesters_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 6. lecturers
ALTER TABLE "lecturers" DROP CONSTRAINT IF EXISTS "lecturers_tenantId_fkey";
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 7. students
ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_tenantId_fkey";
ALTER TABLE "students" ADD CONSTRAINT "students_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 8. academic_classes
ALTER TABLE "academic_classes" DROP CONSTRAINT IF EXISTS "academic_classes_tenantId_fkey";
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
