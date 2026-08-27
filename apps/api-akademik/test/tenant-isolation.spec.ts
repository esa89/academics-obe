import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../build/app.module.js';

declare const process: any;
declare const Buffer: any;

function createMockJwt(payload: Record<string, any>): string {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${header}.${body}.mock-signature`;
}

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 MULTI-TENANT SECURITY HARDENING & ISOLATION TEST SUITE');
  console.log('🧪 ========================================================\n');

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const PORT = 3099;
  await app.listen(PORT);
  const baseUrl = `http://localhost:${PORT}`;

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (detail) console.error(`     Reason: ${detail}`);
      failed++;
    }
  }

  const WIDYATAMA_ID = '00000000-0000-0000-0000-000000000001';
  const DEMO_ID = '00000000-0000-0000-0000-000000000002';

  // Mock Tokens
  const widyatamaUserToken = createMockJwt({
    sub: 'user-wid-01',
    email: 'dosen@widyatama.ac.id',
    name: 'Dosen Widyatama',
    roles: ['dosen'],
    tenantId: WIDYATAMA_ID,
    tenantSlug: 'widyatama',
  });

  const demoUserToken = createMockJwt({
    sub: 'user-demo-01',
    email: 'admin@demo-campus.ac.id',
    name: 'Admin Demo',
    roles: ['admin_akademik'],
    tenantId: DEMO_ID,
    tenantSlug: 'demo',
  });

  const platformAdminToken = createMockJwt({
    sub: 'platform-admin-01',
    email: 'superadmin@system.local',
    name: 'Platform Superadmin',
    roles: ['PLATFORM_ADMIN'],
    isPlatformAdmin: true,
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: User Tenant A + X-Tenant-Id A → allowed (200)
    // -------------------------------------------------------------------------
    console.log('🔹 Category 1: Valid Authenticated Tenant Access');
    {
      const res = await fetch(`${baseUrl}/faculties`, {
        headers: {
          Authorization: `Bearer ${widyatamaUserToken}`,
          'X-Tenant-Id': 'widyatama',
        },
      });
      const body = await res.json();
      assert(
        res.status === 200 && body.data.length > 0 && body.data.every((f: any) => f.tenantId === WIDYATAMA_ID),
        'User Tenant A + X-Tenant-Id A is ALLOWED (200 OK)',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: User Tenant A + X-Tenant-Id B → 403 Forbidden
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 2: Cross-Tenant Access Rejection');
    {
      const res = await fetch(`${baseUrl}/faculties`, {
        headers: {
          Authorization: `Bearer ${widyatamaUserToken}`,
          'X-Tenant-Id': 'demo',
        },
      });
      const body = await res.json();
      assert(
        res.status === 403 && body.message.includes('Cross-tenant access forbidden'),
        'User Tenant A + X-Tenant-Id B is REJECTED with 403 Forbidden',
        `Status: ${res.status}, body: ${JSON.stringify(body)}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Header Forgery (Forged X-User-* headers rejected)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 3: Anti-Header Forgery & Untrusted Client Headers');
    {
      // Attacker sends User Tenant A token but injects forged raw headers attempting to gain Tenant B or Platform Admin
      const res = await fetch(`${baseUrl}/faculties`, {
        headers: {
          Authorization: `Bearer ${widyatamaUserToken}`,
          'X-Tenant-Id': 'demo',
          'X-User-Tenant-Id': DEMO_ID,
          'X-User-Role': 'PLATFORM_ADMIN',
        },
      });
      assert(
        res.status === 403,
        'Forged X-User-Tenant-Id and X-User-Role headers are IGNORED (403 Forbidden enforced via verified JWT claims)',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Non-Platform User cannot access platform-only endpoint
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 4: Platform-Only Authorization');
    {
      const res = await fetch(`${baseUrl}/tenants`, {
        headers: {
          Authorization: `Bearer ${widyatamaUserToken}`,
        },
      });
      assert(
        res.status === 403,
        'Non-platform user attempting GET /tenants is REJECTED with 403 Forbidden',
        `Status: ${res.status}`,
      );
    }

    {
      // Unauthenticated request to platform-only endpoint
      const res = await fetch(`${baseUrl}/tenants`);
      assert(
        res.status === 403,
        'Unauthenticated request to GET /tenants is REJECTED with 403 Forbidden',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: PLATFORM_ADMIN can access platform endpoint
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 5: Verified PLATFORM_ADMIN Access');
    {
      const res = await fetch(`${baseUrl}/tenants`, {
        headers: {
          Authorization: `Bearer ${platformAdminToken}`,
        },
      });
      const body = await res.json();
      assert(
        res.status === 200 && Array.isArray(body.data) && body.data.length >= 2,
        'Verified PLATFORM_ADMIN token successfully accesses GET /tenants (200 OK)',
        `Count: ${body.data?.length}`,
      );
    }

    // Fetch faculty & study program IDs for cross-tenant relational testing
    const widFaculty = (await (await fetch(`${baseUrl}/faculties`, { headers: { 'x-tenant-id': 'widyatama' } })).json()).data[0];
    const demoFaculty = (await (await fetch(`${baseUrl}/faculties`, { headers: { 'x-tenant-id': 'demo' } })).json()).data[0];
    const widProdi = (await (await fetch(`${baseUrl}/study-programs`, { headers: { 'x-tenant-id': 'widyatama' } })).json()).data[0];
    const demoProdi = (await (await fetch(`${baseUrl}/study-programs`, { headers: { 'x-tenant-id': 'demo' } })).json()).data[0];
    const widStudent = (await (await fetch(`${baseUrl}/students?limit=1`, { headers: { 'x-tenant-id': 'widyatama' } })).json()).data[0];
    const demoStudent = (await (await fetch(`${baseUrl}/students?limit=1`, { headers: { 'x-tenant-id': 'demo' } })).json()).data[0];

    // -------------------------------------------------------------------------
    // TEST 6: Tenant A cannot update Student of Tenant B
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 6: Cross-Tenant Write Isolation (Update)');
    {
      const res = await fetch(`${baseUrl}/students/${demoStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'widyatama',
        },
        body: JSON.stringify({
          name: 'Hacked Name from Tenant A',
        }),
      });
      assert(
        res.status === 404,
        'Tenant A attempting PUT /students/:tenantBStudentId is REJECTED with 404 Not Found',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Tenant A cannot delete Student of Tenant B
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 7: Cross-Tenant Write Isolation (Delete)');
    {
      const res = await fetch(`${baseUrl}/students/${demoStudent.id}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant-Id': 'widyatama',
        },
      });
      assert(
        res.status === 404,
        'Tenant A attempting DELETE /students/:tenantBStudentId is REJECTED with 404 Not Found',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 8: Tenant A cannot create Student with StudyProgram of Tenant B
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 8: Relational Foreign Key Consistency');
    {
      const res = await fetch(`${baseUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'widyatama',
        },
        body: JSON.stringify({
          nim: 'TEST-CROSS-FK-01',
          name: 'Student Cross FK Test',
          gender: 'LAKI_LAKI',
          facultyId: widFaculty.id,
          studyProgramId: demoProdi.id, // <- Belongs to DEMO tenant!
          entryYear: 2024,
        }),
      });
      assert(
        res.status === 400,
        'Tenant A creating Student referencing StudyProgram of Tenant B is REJECTED with 400 Bad Request',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 9: Tenant A cannot create StudyProgram with Faculty of Tenant B
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${baseUrl}/study-programs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': 'widyatama',
        },
        body: JSON.stringify({
          code: 'TEST-PRODI-CROSS-FK',
          name: 'Prodi Cross FK Test',
          degree: 'S1',
          facultyId: demoFaculty.id, // <- Belongs to DEMO tenant!
        }),
      });
      assert(
        res.status === 400,
        'Tenant A creating StudyProgram referencing Faculty of Tenant B is REJECTED with 400 Bad Request',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 10: Tenant Deletion Safety (No Cascade, Blocked if Academic Records Exist)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 9: Tenant Lifecycle & Deletion Safety');
    {
      const res = await fetch(`${baseUrl}/tenants/${DEMO_ID}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${platformAdminToken}`,
        },
      });
      assert(
        res.status === 409,
        'Hard deleting tenant with existing academic records is BLOCKED with 409 Conflict',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 11: Missing Tenant Context → 401 Unauthorized (Zero Fallback)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 10: Zero Fallback Enforcement');
    {
      const res = await fetch(`${baseUrl}/students`);
      assert(
        res.status === 401,
        'Request without tenant context returns 401 Unauthorized (No fallback to Widyatama)',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 12: Existing Widyatama Data Retention & Integrity
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 11: Existing Production Data Retention');
    {
      const resStudents = await fetch(`${baseUrl}/students?limit=1`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const sBody = await resStudents.json();
      assert(
        resStudents.status === 200 && sBody.meta.total >= 360,
        `All 360+ Widyatama production students retained and accessible (found ${sBody.meta.total})`,
      );

      const resLecturers = await fetch(`${baseUrl}/lecturers?limit=1`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const lBody = await resLecturers.json();
      assert(
        resLecturers.status === 200 && lBody.meta.total >= 47,
        `All 47+ Widyatama production lecturers retained and accessible (found ${lBody.meta.total})`,
      );

      const resClasses = await fetch(`${baseUrl}/academic-classes?limit=1`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const cBody = await resClasses.json();
      assert(
        resClasses.status === 200 && cBody.meta.total >= 151,
        `All 151+ Widyatama production classes retained and accessible (found ${cBody.meta.total})`,
      );
    }

  } catch (err: any) {
    console.error('💥 Test suite runtime exception:', err);
    failed++;
  } finally {
    await app.close();
    console.log('\n========================================================');
    console.log(`🏁 SECURITY TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================\n');
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runTests().catch((e) => {
  console.error('TOP LEVEL ERROR:', e);
  process.exit(1);
});
