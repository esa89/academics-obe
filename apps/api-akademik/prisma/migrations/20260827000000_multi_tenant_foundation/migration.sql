-- ============================================================================
-- Migration: 20260827000000_multi_tenant_foundation
-- Description: Establish Multi-Tenant Foundation, backfill WIDYATAMA tenant,
--              scope academic master data, and update unique constraints.
-- ============================================================================

-- 1. Create Enum & Tenant table
DO $$ BEGIN
    CREATE TYPE "TenantStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "tenants" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "status" "TenantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenants_code_key" ON "tenants"("code");
CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");

-- 2. Insert default Tenant WIDYATAMA
INSERT INTO "tenants" ("id", "code", "name", "slug", "status", "createdAt", "updatedAt")
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'WIDYATAMA',
    'Universitas Widyatama',
    'widyatama',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;

-- 3. Add nullable tenantId column to tenant-scoped tables
ALTER TABLE "faculties" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "study_programs" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "curriculums" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "academic_semesters" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "lecturers" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "students" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "academic_classes" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- 4. Backfill existing data with WIDYATAMA tenant ID
UPDATE "faculties" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "study_programs" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "curriculums" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "courses" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "academic_semesters" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "lecturers" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "students" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
UPDATE "academic_classes" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;

-- 5. Set tenantId as NOT NULL
ALTER TABLE "faculties" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "study_programs" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "curriculums" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "courses" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "academic_semesters" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "lecturers" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "students" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "academic_classes" ALTER COLUMN "tenantId" SET NOT NULL;

-- 6. Add Foreign Key constraints to tenants
ALTER TABLE "faculties" DROP CONSTRAINT IF EXISTS "faculties_tenantId_fkey";
ALTER TABLE "faculties" ADD CONSTRAINT "faculties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "study_programs" DROP CONSTRAINT IF EXISTS "study_programs_tenantId_fkey";
ALTER TABLE "study_programs" ADD CONSTRAINT "study_programs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "curriculums" DROP CONSTRAINT IF EXISTS "curriculums_tenantId_fkey";
ALTER TABLE "curriculums" ADD CONSTRAINT "curriculums_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "courses_tenantId_fkey";
ALTER TABLE "courses" ADD CONSTRAINT "courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "academic_semesters" DROP CONSTRAINT IF EXISTS "academic_semesters_tenantId_fkey";
ALTER TABLE "academic_semesters" ADD CONSTRAINT "academic_semesters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lecturers" DROP CONSTRAINT IF EXISTS "lecturers_tenantId_fkey";
ALTER TABLE "lecturers" ADD CONSTRAINT "lecturers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "students_tenantId_fkey";
ALTER TABLE "students" ADD CONSTRAINT "students_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "academic_classes" DROP CONSTRAINT IF EXISTS "academic_classes_tenantId_fkey";
ALTER TABLE "academic_classes" ADD CONSTRAINT "academic_classes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. Update Unique Constraints to composite (tenantId, ...) and add indexes

-- faculties
DROP INDEX IF EXISTS "faculties_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "faculties_tenantId_code_key" ON "faculties"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "faculties_tenantId_idx" ON "faculties"("tenantId");

-- study_programs
DROP INDEX IF EXISTS "study_programs_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "study_programs_tenantId_code_key" ON "study_programs"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "study_programs_tenantId_idx" ON "study_programs"("tenantId");

-- curriculums
CREATE INDEX IF NOT EXISTS "curriculums_tenantId_idx" ON "curriculums"("tenantId");
CREATE INDEX IF NOT EXISTS "curriculums_tenantId_code_idx" ON "curriculums"("tenantId", "code");

-- courses
DROP INDEX IF EXISTS "courses_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "courses_tenantId_code_key" ON "courses"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "courses_tenantId_idx" ON "courses"("tenantId");

-- academic_semesters
DROP INDEX IF EXISTS "academic_semesters_code_key";
CREATE UNIQUE INDEX IF NOT EXISTS "academic_semesters_tenantId_code_key" ON "academic_semesters"("tenantId", "code");
CREATE INDEX IF NOT EXISTS "academic_semesters_tenantId_idx" ON "academic_semesters"("tenantId");

-- lecturers
DROP INDEX IF EXISTS "lecturers_nidn_key";
DROP INDEX IF EXISTS "lecturers_nrk_key";
DROP INDEX IF EXISTS "lecturers_email_key";
DROP INDEX IF EXISTS "lecturers_identityUsername_key";
CREATE UNIQUE INDEX IF NOT EXISTS "lecturers_tenantId_nidn_key" ON "lecturers"("tenantId", "nidn");
CREATE UNIQUE INDEX IF NOT EXISTS "lecturers_tenantId_nrk_key" ON "lecturers"("tenantId", "nrk");
CREATE UNIQUE INDEX IF NOT EXISTS "lecturers_tenantId_email_key" ON "lecturers"("tenantId", "email");
CREATE UNIQUE INDEX IF NOT EXISTS "lecturers_tenantId_identityUsername_key" ON "lecturers"("tenantId", "identityUsername");
CREATE INDEX IF NOT EXISTS "lecturers_tenantId_idx" ON "lecturers"("tenantId");

-- students
DROP INDEX IF EXISTS "students_nim_key";
DROP INDEX IF EXISTS "students_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "students_tenantId_nim_key" ON "students"("tenantId", "nim");
CREATE UNIQUE INDEX IF NOT EXISTS "students_tenantId_email_key" ON "students"("tenantId", "email");
CREATE INDEX IF NOT EXISTS "students_tenantId_idx" ON "students"("tenantId");

-- academic_classes
CREATE INDEX IF NOT EXISTS "academic_classes_tenantId_idx" ON "academic_classes"("tenantId");
