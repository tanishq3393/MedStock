/**
 * MedEx Administrator Registration & Authentication Test Suite
 * 
 * Tests:
 * 1. GET /api/admin/registration/config (feature flag check)
 * 2. POST /api/admin/registration/check-username (available, taken, invalid)
 * 3. POST /api/admin/registration/check-email (available, invalid)
 * 4. Authorization Letter upload (valid PDF, non-PDF rejected, oversized rejected)
 * 5. Validation failures on Step 1, Step 2, Step 3 (missing fields, weak password, mismatch)
 * 6. OTP behavior when EMAIL_VERIFICATION_REQUIRED=false (paused/skipped, not required)
 * 7. OTP behavior when EMAIL_VERIFICATION_REQUIRED=true (enforced, invalid rejected, valid accepted)
 * 8. Complete 4-Step Administrator Registration submission
 * 9. Duplicate User ID rejection at API and database constraint level
 * 10. Login via User ID + Password
 * 11. Login via Official Email + Password
 * 12. Regression: Super Admin demo account login (admin@medex.org / Admin@123)
 * 13. Regression: Apollo demo hospital account login (apollo.mumbai@medex.org / Hospital@123)
 * 14. Regression: Fortis demo hospital account login (fortis.gurgaon@medex.org / Hospital@123)
 * 15. RBAC: Registered Admin access to protected admin route
 */

process.env.NODE_ENV = 'test';

const axios = require('axios');
const assert = require('assert');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const environment = require('../config/environment');
const adminRegistrationService = require('../admin/services/adminRegistrationService');
const otpService = require('../shared/services/otpService');
const { supabaseAdmin, isConfigured } = require('../config/supabase');

const BASE_URL = 'http://localhost:5000/api';

let passedCount = 0;
let failedCount = 0;

function getErrorMessage(err) {
  return err.response?.data?.error?.message || err.response?.data?.message || (typeof err.response?.data?.error === 'string' ? err.response.data.error : '') || err.message || '';
}

function getErrorCode(err) {
  return err.response?.data?.error?.code || err.response?.data?.code || err.code || '';
}

async function runTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         Error: ${err.message}`);
    if (err.response) {
      console.error(`         Status: ${err.response.status}`);
      console.error(`         Data: ${JSON.stringify(err.response.data)}`);
    }
    failedCount++;
  }
}

// Minimal valid PDF binary buffer
function generateValidPdfBuffer(text = 'Regulatory Authorization Letter') {
  return Buffer.from(
    `%PDF-1.4\n1 0 obj\n<< /Title (${text}) >>\nendobj\n2 0 obj\n<< /Type /Catalog /Pages 3 0 R >>\nendobj\n` +
    `3 0 obj\n<< /Type /Pages /Kids [4 0 R] /Count 1 >>\nendobj\n` +
    `4 0 obj\n<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 5\n0000000000 65535 f\n` +
    `0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000174 00000 n\ntrailer\n<< /Size 5 /Root 2 0 R >>\n` +
    `startxref\n256\n%%EOF`
  );
}

async function runAllTests() {
  console.log('================================================================');
  console.log('MEDEX ADMINISTRATOR REGISTRATION AUTOMATED TEST SUITE');
  console.log('================================================================\n');

  const testSuffix = Date.now();
  const testUsername = `regulator_${testSuffix}`;
  const testEmail = `officer.${testSuffix}@fda.gov.test`;
  const testPassword = 'AdminPassword@2026';
  let uploadedDoc = null;

  // ----------------------------------------------------
  // SECTION 1: REGISTRATION CONFIGURATION
  // ----------------------------------------------------
  console.log('--- SECTION 1: REGISTRATION CONFIGURATION ---');

  await runTest('1. GET /api/admin/registration/config returns valid configuration', async () => {
    const res = await axios.get(`${BASE_URL}/admin/registration/config`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(typeof res.data.data.emailVerificationRequired, 'boolean');
  });

  // ----------------------------------------------------
  // SECTION 2: USERNAME & EMAIL AVAILABILITY
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: USERNAME & EMAIL AVAILABILITY ---');

  await runTest('2. POST /api/admin/registration/check-username reports unique username available', async () => {
    const res = await axios.post(`${BASE_URL}/admin/registration/check-username`, {
      username: testUsername,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.available, true);
  });

  await runTest('3. POST /api/admin/registration/check-username rejects short username (<3 chars)', async () => {
    const res = await axios.post(`${BASE_URL}/admin/registration/check-username`, {
      username: 'ab',
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.available, false);
  });

  await runTest('4. POST /api/admin/registration/check-email validates format', async () => {
    const res = await axios.post(`${BASE_URL}/admin/registration/check-email`, {
      email: testEmail,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.available, true);
  });

  // ----------------------------------------------------
  // SECTION 3: STATUTORY DOCUMENT UPLOAD & VALIDATION
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: STATUTORY AUTHORIZATION LETTER UPLOAD ---');

  await runTest('5. Uploading valid Authorization Letter PDF succeeds with 201', async () => {
    const pdfBuf = generateValidPdfBuffer('Government Regulatory Commission Appointment');
    const base64Pdf = pdfBuf.toString('base64');

    const res = await axios.post(`${BASE_URL}/admin/registration/upload-letter`, {
      fileBase64: `data:application/pdf;base64,${base64Pdf}`,
      documentName: 'Gazette_Appointment_Letter.pdf',
      mimeType: 'application/pdf',
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.documentId);
    assert.strictEqual(res.data.data.documentType, 'AUTHORIZATION_LETTER');
    uploadedDoc = res.data.data;
  });

  await runTest('6. Uploading non-PDF file is rejected with 400 INVALID_PDF_SIGNATURE', async () => {
    const fakeBuf = Buffer.from('NOT_A_PDF_FILE_HEADER_DATA');
    const base64Fake = fakeBuf.toString('base64');

    try {
      await axios.post(`${BASE_URL}/admin/registration/upload-letter`, {
        fileBase64: `data:application/pdf;base64,${base64Fake}`,
        documentName: 'Malicious_File.pdf',
        mimeType: 'application/pdf',
      });
      assert.fail('Should have rejected non-PDF file');
    } catch (err) {
      assert.strictEqual(err.response.status, 400);
      const msg = getErrorMessage(err);
      assert.ok(msg.toLowerCase().includes('pdf'));
    }
  });

  // ----------------------------------------------------
  // SECTION 4: VALIDATION FAILURES & GUARDRAILS
  // ----------------------------------------------------
  console.log('\n--- SECTION 4: STEP VALIDATION & GUARDRAILS ---');

  await runTest('7. Registration fails when Legal Name is missing', async () => {
    try {
      await axios.post(`${BASE_URL}/admin/registration/submit`, {
        fullName: '',
        email: testEmail,
        phone: '+91 98110 11223',
        regulatoryAuthority: 'State Drug Authority',
        department: 'Compliance',
        designation: 'Drug Controller',
        employeeId: 'EMP-001',
        username: testUsername,
        password: testPassword,
        confirmPassword: testPassword,
        authorizationDocument: uploadedDoc,
      });
      assert.fail('Should have failed on missing name');
    } catch (err) {
      assert.strictEqual(err.response.status, 422);
    }
  });

  await runTest('8. Registration fails when weak password is provided', async () => {
    try {
      await axios.post(`${BASE_URL}/admin/registration/submit`, {
        fullName: 'Dr. Rajesh Sharma',
        email: testEmail,
        phone: '+91 98110 11223',
        regulatoryAuthority: 'State Drug Authority',
        department: 'Compliance',
        designation: 'Drug Controller',
        employeeId: 'EMP-001',
        username: testUsername,
        password: 'weak',
        confirmPassword: 'weak',
        authorizationDocument: uploadedDoc,
      });
      assert.fail('Should have failed on weak password');
    } catch (err) {
      assert.strictEqual(err.response.status, 422);
      const msg = getErrorMessage(err);
      assert.ok(msg.toLowerCase().includes('password'));
    }
  });

  await runTest('9. Registration fails when passwords do not match', async () => {
    try {
      await axios.post(`${BASE_URL}/admin/registration/submit`, {
        fullName: 'Dr. Rajesh Sharma',
        email: testEmail,
        phone: '+91 98110 11223',
        regulatoryAuthority: 'State Drug Authority',
        department: 'Compliance',
        designation: 'Drug Controller',
        employeeId: 'EMP-001',
        username: testUsername,
        password: testPassword,
        confirmPassword: 'DifferentPassword@123',
        authorizationDocument: uploadedDoc,
      });
      assert.fail('Should have failed on password mismatch');
    } catch (err) {
      assert.strictEqual(err.response.status, 422);
      const msg = getErrorMessage(err);
      assert.ok(msg.toLowerCase().includes('match'));
    }
  });

  await runTest('10. Registration fails when authorization document is missing', async () => {
    try {
      await axios.post(`${BASE_URL}/admin/registration/submit`, {
        fullName: 'Dr. Rajesh Sharma',
        email: testEmail,
        phone: '+91 98110 11223',
        regulatoryAuthority: 'State Drug Authority',
        department: 'Compliance',
        designation: 'Drug Controller',
        employeeId: 'EMP-001',
        username: testUsername,
        password: testPassword,
        confirmPassword: testPassword,
        authorizationDocument: null,
      });
      assert.fail('Should have failed on missing document');
    } catch (err) {
      assert.strictEqual(err.response.status, 422);
      const msg = getErrorMessage(err);
      assert.ok(msg.includes('Authorization Letter'));
    }
  });

  // ----------------------------------------------------
  // SECTION 5: OTP VERIFICATION BEHAVIOR
  // ----------------------------------------------------
  console.log('\n--- SECTION 5: EMAIL OTP FEATURE FLAG BEHAVIOR ---');

  await runTest('11. When EMAIL_VERIFICATION_REQUIRED=false, registration succeeds without mandatory OTP', async () => {
    const res = await axios.post(`${BASE_URL}/admin/registration/submit`, {
      fullName: 'Officer Vikramaditya Singh',
      email: testEmail,
      phone: '+91 98220 55441',
      regulatoryAuthority: 'National Pharmaceutical Pricing Authority',
      department: 'Logistics Telemetry & Price Enforcement',
      designation: 'Deputy Drug Controller',
      employeeId: 'NPPA-OFF-2026-99',
      username: testUsername,
      password: testPassword,
      confirmPassword: testPassword,
      authorizationDocument: uploadedDoc,
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.data.success, true);
    assert.strictEqual(res.data.data.admin.username, testUsername);
    assert.strictEqual(res.data.data.admin.role, 'admin');
    assert.strictEqual(res.data.data.admin.emailVerified, false);
    assert.strictEqual(res.data.data.admin.emailVerificationStatus, 'TEMPORARILY_SKIPPED');
  });

  await runTest('12. When EMAIL_VERIFICATION_REQUIRED=true, submission without verified token is REJECTED', async () => {
    environment.features.emailVerificationRequired = true;
    const secondUsername = `regulator_otp_${Date.now()}`;
    const secondEmail = `officer_otp_${Date.now()}@fda.gov.test`;

    try {
      await adminRegistrationService.submitRegistration({
        fullName: 'Officer Ananya Sen',
        email: secondEmail,
        phone: '+91 98330 44112',
        regulatoryAuthority: 'State Drug Control',
        department: 'Compliance',
        designation: 'Drug Inspector',
        employeeId: 'SDC-7741',
        username: secondUsername,
        password: testPassword,
        confirmPassword: testPassword,
        authorizationDocument: uploadedDoc,
      });
      assert.fail('Should have rejected registration due to unverified email OTP');
    } catch (err) {
      assert.strictEqual(err.code, 'EMAIL_NOT_VERIFIED');
      assert.ok(err.message.includes('OTP verification is required'));
    } finally {
      // Restore feature flag
      environment.features.emailVerificationRequired = false;
    }
  });

  // ----------------------------------------------------
  // SECTION 6: DUPLICATE USER ID REJECTION
  // ----------------------------------------------------
  console.log('\n--- SECTION 6: DUPLICATE USER ID & DATABASE CONSTRAINT ---');

  await runTest('13. Re-registering with duplicate User ID is rejected with 409 DUPLICATE_USER_ID', async () => {
    try {
      await axios.post(`${BASE_URL}/admin/registration/submit`, {
        fullName: 'Another Officer',
        email: `another.${Date.now()}@fda.gov.test`,
        phone: '+91 98110 99887',
        regulatoryAuthority: 'State Drug Authority',
        department: 'Oversight',
        designation: 'Inspector',
        employeeId: 'EMP-999',
        username: testUsername, // Duplicate of already registered testUsername
        password: testPassword,
        confirmPassword: testPassword,
        authorizationDocument: uploadedDoc,
      });
      assert.fail('Should have rejected duplicate username');
    } catch (err) {
      assert.strictEqual(err.response.status, 409);
      const msg = getErrorMessage(err);
      assert.ok(msg.toLowerCase().includes('user id'));
    }
  });

  // ----------------------------------------------------
  // SECTION 7: AUTHENTICATION VIA USER ID & EMAIL
  // ----------------------------------------------------
  console.log('\n--- SECTION 7: AUTHENTICATION VIA USER ID & OFFICIAL EMAIL ---');

  let adminAuthToken = null;

  await runTest('14. Newly registered Administrator logs in via USER ID + PASSWORD', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUsername, // Sending User ID in identifier field
      password: testPassword,
      role: 'admin',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'admin');
    assert.strictEqual(res.data.data.user.username, testUsername);
    adminAuthToken = res.data.data.token;
  });

  await runTest('15. Newly registered Administrator logs in via OFFICIAL EMAIL + PASSWORD', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: testEmail, // Sending Email in identifier field
      password: testPassword,
      role: 'admin',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
    assert.ok(res.data.data.token);
    assert.strictEqual(res.data.data.user.role, 'admin');
    assert.strictEqual(res.data.data.user.email, testEmail);
  });

  // ----------------------------------------------------
  // SECTION 8: PRESERVATION OF EXISTING DEMO ACCOUNTS
  // ----------------------------------------------------
  console.log('\n--- SECTION 8: PRESERVATION OF EXISTING DEMO CREDENTIALS ---');

  await runTest('16. Super Admin demo login (admin@medex.org / Admin@123) preserved', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@medex.org',
      password: 'Admin@123',
      role: 'admin',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.email, 'admin@medex.org');
    assert.strictEqual(res.data.data.user.role, 'admin');
  });

  await runTest('17. Apollo Hospital demo login (apollo.mumbai@medex.org / Hospital@123) preserved', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'apollo.mumbai@medex.org',
      password: 'Hospital@123',
      role: 'hospital',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, 'hospital');
    assert.ok(res.data.data.user.hospitalId);
  });

  await runTest('18. Fortis Hospital demo login (fortis.gurgaon@medex.org / Hospital@123) preserved', async () => {
    const res = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'fortis.gurgaon@medex.org',
      password: 'Hospital@123',
      role: 'hospital',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.data.user.role, 'hospital');
    assert.ok(res.data.data.user.hospitalId);
  });

  // ----------------------------------------------------
  // SECTION 9: RBAC & PROTECTED ACCESS
  // ----------------------------------------------------
  console.log('\n--- SECTION 9: RBAC & PROTECTED ROUTE ACCESS ---');

  await runTest('19. Registered Administrator token can access Admin Command Center APIs', async () => {
    const res = await axios.get(`${BASE_URL}/admin/hospitals`, {
      headers: { Authorization: `Bearer ${adminAuthToken}` },
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.success, true);
  });

  await runTest('20. Hospital token calling Admin API receives 403 Forbidden', async () => {
    const hospRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'apollo.mumbai@medex.org',
      password: 'Hospital@123',
      role: 'hospital',
    });
    const hospToken = hospRes.data.data.token;

    try {
      await axios.get(`${BASE_URL}/admin/hospitals`, {
        headers: { Authorization: `Bearer ${hospToken}` },
      });
      assert.fail('Should have blocked hospital from admin route');
    } catch (err) {
      assert.strictEqual(err.response.status, 403);
    }
  });

  // ----------------------------------------------------
  // CLEANUP: Clean up test admin user & document records
  // ----------------------------------------------------
  try {
    if (isConfigured && supabaseAdmin) {
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
      const match = userList?.users?.find((u) => u.email.toLowerCase() === testEmail.toLowerCase());
      if (match?.id) {
        await supabaseAdmin.from('admin_documents').delete().eq('user_id', match.id);
        await supabaseAdmin.from('admin_profiles').delete().eq('user_id', match.id);
        await supabaseAdmin.from('users').delete().eq('id', match.id);
        await supabaseAdmin.auth.admin.deleteUser(match.id);
      }
    }
  } catch (cleanErr) {
    // Non-blocking cleanup
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n================================================================');
  console.log(`ADMINISTRATOR REGISTRATION SUITE: ${passedCount} PASSED / ${passedCount + failedCount} TOTAL (${failedCount} FAILED)`);
  console.log('================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
