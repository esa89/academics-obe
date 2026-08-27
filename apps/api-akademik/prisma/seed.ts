import { PrismaClient, Degree, LastEducation, AcademicPosition, Gender, AdmissionPath, StudentStatus, SemesterType, LecturerRole } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Multi-Tenant Foundation data...');

  // 1. Ensure WIDYATAMA Tenant
  const widyatamaTenant = await prisma.tenant.upsert({
    where: { code: 'WIDYATAMA' },
    update: {
      name: 'Universitas Widyatama',
      slug: 'widyatama',
      status: 'ACTIVE',
      primaryColor: '#1E3A8A',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'WIDYATAMA',
      name: 'Universitas Widyatama',
      slug: 'widyatama',
      status: 'ACTIVE',
      primaryColor: '#1E3A8A',
    },
  });
  console.log(`✅ Tenant: ${widyatamaTenant.name} (${widyatamaTenant.code}) ready`);

  // 2. Create DEMO Tenant (for multi-tenant isolation testing & development)
  const demoTenant = await prisma.tenant.upsert({
    where: { code: 'DEMO' },
    update: {
      name: 'Universitas Demo Nusantara',
      slug: 'demo',
      status: 'ACTIVE',
      primaryColor: '#047857',
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      code: 'DEMO',
      name: 'Universitas Demo Nusantara',
      slug: 'demo',
      status: 'ACTIVE',
      primaryColor: '#047857',
    },
  });
  console.log(`✅ Tenant: ${demoTenant.name} (${demoTenant.code}) ready`);

  // 3. Seed Dummy Academic Master Data for DEMO Tenant
  const demoFaculty = await prisma.faculty.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'FT',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      code: 'FT',
      name: 'Fakultas Teknik Demo',
      description: 'Fakultas Teknik khusus tenant demo',
      isActive: true,
    },
  });

  const demoProdi = await prisma.studyProgram.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'IF',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      facultyId: demoFaculty.id,
      code: 'IF',
      name: 'Informatika Demo',
      degree: Degree.S1,
      accreditation: 'Unggul',
      isActive: true,
    },
  });

  const demoSemester = await prisma.academicSemester.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: '20241',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      code: '20241',
      name: 'Semester Ganjil 2024/2025 Demo',
      academicYear: '2024/2025',
      semesterType: SemesterType.GANJIL,
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-31'),
      isActive: true,
      isCurrent: true,
    },
  });

  const demoCourse = await prisma.course.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'IF101',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      facultyId: demoFaculty.id,
      code: 'IF101',
      name: 'Algoritma & Pemrograman Demo',
      sks: 3,
      semester: 1,
      isActive: true,
    },
  });

  const demoLecturer = await prisma.lecturer.upsert({
    where: {
      tenantId_nidn: {
        tenantId: demoTenant.id,
        nidn: '990001',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      nidn: '990001',
      nrk: 'DEMO-DOSEN-01',
      name: 'Dr. Dosen Demo, M.Kom.',
      email: 'dosen.demo@demo-campus.ac.id',
      lastEducation: LastEducation.S3,
      academicPosition: AcademicPosition.LEKTOR,
      facultyId: demoFaculty.id,
      studyProgramId: demoProdi.id,
      isActive: true,
    },
  });

  const demoStudent1 = await prisma.student.upsert({
    where: {
      tenantId_nim: {
        tenantId: demoTenant.id,
        nim: '240001',
      },
    },
    update: {},
    create: {
      tenantId: demoTenant.id,
      nim: '240001',
      name: 'Budi Santoso (Demo)',
      gender: Gender.LAKI_LAKI,
      email: 'budi.demo@demo-campus.ac.id',
      facultyId: demoFaculty.id,
      studyProgramId: demoProdi.id,
      academicSemesterId: demoSemester.id,
      admissionPath: AdmissionPath.REGULER,
      entryYear: 2024,
      studentStatus: StudentStatus.AKTIF,
      isActive: true,
    },
  });

  console.log(`✅ Demo Academic Master Data seeded for tenant ${demoTenant.code}`);
  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
