import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const BASE_URL = 'https://ssfalparamb-cn-p-git-staging-ssf-alparamb.vercel.app';
const BYPASS_TOKEN = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

if (!BYPASS_TOKEN) {
  console.error("Error: VERCEL_AUTOMATION_BYPASS_SECRET is not set.");
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'x-vercel-protection-bypass': BYPASS_TOKEN,
};

async function testEndpoint(name, url, options, expectedStatus) {
  console.log(`\n--- Testing: ${name} ---`);
  try {
    const response = await fetch(url, options);
    console.log(`Status: ${response.status} (Expected: ${expectedStatus})`);
    const data = await response.json().catch(() => null);
    if (data) {
       console.log('Response:', data);
    }
    
    if (response.status === expectedStatus) {
      console.log('✅ PASS');
      return { success: true, response, data };
    } else {
      console.log('❌ FAIL');
      return { success: false, response, data };
    }
  } catch (err) {
    console.error('❌ Network Error:', err);
    return { success: false, error: err };
  }
}

async function runTests() {
  console.log(`Starting Phase 7 Staging Auth Tests... Target: ${BASE_URL}\n`);

  // 1. GET /api/v1/auth/session without application cookie
  await testEndpoint(
    'GET /api/v1/auth/session without cookie',
    `${BASE_URL}/api/v1/auth/session`,
    { method: 'GET', headers },
    401
  );

  // 2. POST /api/v1/auth/logout without cookie
  await testEndpoint(
    'POST /api/v1/auth/logout without cookie',
    `${BASE_URL}/api/v1/auth/logout`,
    { method: 'POST', headers },
    200
  );

  // 3. POST /api/v1/auth/member/login with invalid payload
  await testEndpoint(
    'POST /api/v1/auth/member/login with invalid payload',
    `${BASE_URL}/api/v1/auth/member/login`,
    { method: 'POST', headers, body: JSON.stringify({ phone: "invalid", pin: "abc" }) },
    400
  );

  // 4. POST /api/v1/auth/admin/login with invalid payload
  await testEndpoint(
    'POST /api/v1/auth/admin/login with invalid payload',
    `${BASE_URL}/api/v1/auth/admin/login`,
    { method: 'POST', headers, body: JSON.stringify({ phone: "9999", code: "xyz" }) },
    400
  );

  // We can't automatically test valid login since we don't have the staging test credentials directly in the codebase.
  // The user will need to run the manual valid login test with credentials.
  
  console.log('\n--- Tests Completed ---');
}

runTests();
