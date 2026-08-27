import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../build/app.module.js';

declare const process: any;

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 MULTI-TENANT FOUNDATION INTEGRATION & ISOLATION TEST SUITE');
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

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Public Tenant Lookup Route
    // -------------------------------------------------------------------------
    console.log('🔹 Category 1: Public Endpoints');
    {
      const res = await fetch(`${baseUrl}/tenants/lookup/widyatama`);
      const body = await res.json();
      assert(
        res.status === 200 && body.code === 'WIDYATAMA' && body.slug === 'widyatama',
        'GET /tenants/lookup/:slug succeeds publicly without tenant context headers',
        `Status: ${res.status}, body: ${JSON.stringify(body)}`,
      );
    }

    {
      const res = await fetch(`${baseUrl}/tenants/lookup/non-existent-slug`);
      assert(
        res.status === 404,
        'GET /tenants/lookup/:slug with non-existent slug returns 404',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 2: Strict Tenant Context Requirement & Zero Fallback
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 2: Tenant Context Enforcement & Zero Fallback');
    {
      const res = await fetch(`${baseUrl}/faculties`);
      const body = await res.json();
      assert(
        res.status === 401 && body.message.includes('Tenant context is required'),
        'GET /faculties without X-Tenant-Id is REJECTED with 401 (No Fallback to Widyatama)',
        `Status: ${res.status}, body: ${JSON.stringify(body)}`,
      );
    }

    {
      const res = await fetch(`${baseUrl}/students`);
      assert(
        res.status === 401,
        'GET /students without X-Tenant-Id is REJECTED with 401',
        `Status: ${res.status}`,
      );
    }

    {
      const res = await fetch(`${baseUrl}/faculties`, {
        headers: { 'x-tenant-id': 'invalid-tenant-slug-999' },
      });
      assert(
        res.status === 401,
        'GET /faculties with non-existent tenant slug returns 401 Tenant not found',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 3: Tenant-Scoped Queries & Isolation
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 3: Multi-Tenant Data Isolation');
    let widyatamaFacultyId = '';
    let demoFacultyId = '';

    {
      const resWidyatama = await fetch(`${baseUrl}/faculties`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const bodyW = await resWidyatama.json();
      assert(
        resWidyatama.status === 200 && bodyW.data.length > 0 && bodyW.data.every((f: any) => f.tenantId === '00000000-0000-0000-0000-000000000001'),
        'GET /faculties with x-tenant-id: widyatama returns ONLY Widyatama faculties',
        `Count: ${bodyW.data?.length}`,
      );
      widyatamaFacultyId = bodyW.data[0].id;
    }

    {
      const resDemo = await fetch(`${baseUrl}/faculties`, {
        headers: { 'x-tenant-id': 'demo' },
      });
      const bodyD = await resDemo.json();
      assert(
        resDemo.status === 200 && bodyD.data.length > 0 && bodyD.data.every((f: any) => f.tenantId === '00000000-0000-0000-0000-000000000002'),
        'GET /faculties with x-tenant-id: demo returns ONLY Demo faculties',
        `Count: ${bodyD.data?.length}`,
      );
      demoFacultyId = bodyD.data[0].id;
    }

    // -------------------------------------------------------------------------
    // TEST 4: Cross-Tenant Direct ID Probing (Must return 404)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 4: Cross-Tenant Probing Rejection');
    {
      const res = await fetch(`${baseUrl}/faculties/${widyatamaFacultyId}`, {
        headers: { 'x-tenant-id': 'demo' },
      });
      assert(
        res.status === 404,
        'GET /faculties/:widyatamaId from DEMO tenant context returns 404 (ID Probing Blocked)',
        `Status: ${res.status}`,
      );
    }

    {
      const res = await fetch(`${baseUrl}/faculties/${demoFacultyId}`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      assert(
        res.status === 404,
        'GET /faculties/:demoId from WIDYATAMA tenant context returns 404 (ID Probing Blocked)',
        `Status: ${res.status}`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 5: Cross-Tenant Unique Constraints (Same code/NIM in different tenants)
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 5: Multi-Tenant Schema Independence');
    const dynamicNim = `NIM-${Date.now().toString().slice(-6)}`;
    let studentWId = '';
    let studentDId = '';

    {
      // Widyatama student with dynamic NIM
      const res = await fetch(`${baseUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'widyatama',
        },
        body: JSON.stringify({
          nim: dynamicNim,
          name: 'Student in Widyatama',
          gender: 'LAKI_LAKI',
          facultyId: widyatamaFacultyId,
          studyProgramId: (await (await fetch(`${baseUrl}/study-programs`, { headers: { 'x-tenant-id': 'widyatama' } })).json()).data[0].id,
          entryYear: 2024,
        }),
      });
      const body = await res.json();
      assert(
        res.status === 201,
        `Create student with NIM ${dynamicNim} in Widyatama succeeds`,
        `Status: ${res.status}, body: ${JSON.stringify(body)}`,
      );
      studentWId = body.data?.id || body.id;
    }

    {
      // Demo student with the EXACT SAME NIM
      const res = await fetch(`${baseUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'demo',
        },
        body: JSON.stringify({
          nim: dynamicNim,
          name: 'Student in Demo Campus with same NIM',
          gender: 'PEREMPUAN',
          facultyId: demoFacultyId,
          studyProgramId: (await (await fetch(`${baseUrl}/study-programs`, { headers: { 'x-tenant-id': 'demo' } })).json()).data[0].id,
          entryYear: 2024,
        }),
      });
      const body = await res.json();
      assert(
        res.status === 201,
        `Create student with SAME NIM ${dynamicNim} in Demo tenant succeeds (Multi-tenant unique constraint working)`,
        `Status: ${res.status}, body: ${JSON.stringify(body)}`,
      );
      studentDId = body.data?.id || body.id;
    }

    {
      // Duplicate in SAME tenant must be rejected with 409
      const res = await fetch(`${baseUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': 'demo',
        },
        body: JSON.stringify({
          nim: dynamicNim,
          name: 'Duplicate Student in Demo Campus',
          gender: 'PEREMPUAN',
          facultyId: demoFacultyId,
          studyProgramId: (await (await fetch(`${baseUrl}/study-programs`, { headers: { 'x-tenant-id': 'demo' } })).json()).data[0].id,
          entryYear: 2024,
        }),
      });
      assert(
        res.status === 409,
        'Duplicate NIM within SAME tenant is REJECTED with 409 Conflict',
        `Status: ${res.status}`,
      );
    }

    // Cleanup test records
    if (studentWId) {
      await fetch(`${baseUrl}/students/${studentWId}`, { method: 'DELETE', headers: { 'x-tenant-id': 'widyatama' } });
    }
    if (studentDId) {
      await fetch(`${baseUrl}/students/${studentDId}`, { method: 'DELETE', headers: { 'x-tenant-id': 'demo' } });
    }

    // -------------------------------------------------------------------------
    // TEST 6: Existing Widyatama Production Data Retention
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 6: Widyatama Production Data Retention');
    {
      const resStudents = await fetch(`${baseUrl}/students?limit=1`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const sBody = await resStudents.json();
      assert(
        resStudents.status === 200 && sBody.meta.total >= 360,
        `All 360+ Widyatama production students retained (found ${sBody.meta.total})`,
      );

      const resLecturers = await fetch(`${baseUrl}/lecturers?limit=1`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const lBody = await resLecturers.json();
      assert(
        resLecturers.status === 200 && lBody.meta.total >= 47,
        `All 47+ Widyatama production lecturers retained (found ${lBody.meta.total})`,
      );

      const resClasses = await fetch(`${baseUrl}/academic-classes?limit=1`, {
        headers: { 'x-tenant-id': 'widyatama' },
      });
      const cBody = await resClasses.json();
      assert(
        resClasses.status === 200 && cBody.meta.total >= 151,
        `All 151+ Widyatama production classes retained (found ${cBody.meta.total})`,
      );
    }

    // -------------------------------------------------------------------------
    // TEST 7: Platform Admin Operations
    // -------------------------------------------------------------------------
    console.log('\n🔹 Category 7: Platform Admin & RBAC');
    {
      // Attempting to access GET /tenants without PLATFORM_ADMIN role
      const res = await fetch(`${baseUrl}/tenants`, {
        headers: { 'x-user-role': 'TENANT_ADMIN' },
      });
      assert(
        res.status === 403,
        'GET /tenants by non-PLATFORM_ADMIN is REJECTED with 403 Forbidden',
        `Status: ${res.status}`,
      );
    }

    {
      // Access GET /tenants as PLATFORM_ADMIN
      const res = await fetch(`${baseUrl}/tenants`, {
        headers: { 'x-user-role': 'PLATFORM_ADMIN' },
      });
      const body = await res.json();
      assert(
        res.status === 200 && body.data.length >= 2,
        'GET /tenants by PLATFORM_ADMIN returns list of all tenants',
        `Count: ${body.data?.length}`,
      );
    }

  } catch (err: any) {
    console.error('💥 Test suite runtime exception:', err);
    failed++;
  } finally {
    await app.close();
    console.log('\n========================================================');
    console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
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
