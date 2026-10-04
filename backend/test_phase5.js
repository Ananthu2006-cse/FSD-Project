const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: body ? JSON.parse(body) : null });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function login(email, password = 'demo@2024') {
  const res = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { email, password }
  );
  if (res.status !== 200 || !res.body?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

async function runTests() {
  console.log('--- STARTING PHASE 5 AUTOMATED TEST SUITE ---');

  // 1. Authenticate roles
  console.log('\n[1] Authenticating test accounts...');
  const adminToken = await login('admin@example.com');
  const managerToken = await login('manager@example.com');
  const staffToken = await login('staff@example.com');
  console.log('✓ Successfully retrieved JWTs for ADMIN, MANAGER, and STAFF.');

  // Helper for authorized requests
  const api = (method, path, token, body) =>
    request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      },
      body
    );

  // 2. View warehouses
  console.log('\n[2] Testing GET /api/warehouses for all roles...');
  const adminWhRes = await api('GET', '/api/warehouses', adminToken);
  const managerWhRes = await api('GET', '/api/warehouses', managerToken);
  const staffWhRes = await api('GET', '/api/warehouses', staffToken);
  if (adminWhRes.status !== 200 || managerWhRes.status !== 200 || staffWhRes.status !== 200) {
    throw new Error('Failed to retrieve warehouses for all roles');
  }
  console.log(`✓ Warehouses retrieved successfully: ${adminWhRes.body.length} warehouses found.`);

  // 3. Test STAFF RBAC block on creation
  console.log('\n[3] Testing STAFF RBAC (STAFF cannot create warehouse)...');
  const staffCreateWh = await api('POST', '/api/warehouses', staffToken, {
    name: 'Illegal Staff Warehouse',
    code: 'WH-ERR',
  });
  if (staffCreateWh.status !== 403) {
    throw new Error(`Expected 403 for STAFF POST /api/warehouses, got ${staffCreateWh.status}`);
  }
  console.log('✓ STAFF forbidden (403) from creating warehouses.');

  // 4. Test Validation: Missing fields
  console.log('\n[4] Testing Warehouse Validation (Missing name/code)...');
  const emptyWhRes = await api('POST', '/api/warehouses', adminToken, { name: '', code: '' });
  if (emptyWhRes.status !== 400) {
    throw new Error(`Expected 400 for empty fields, got ${emptyWhRes.status}`);
  }
  console.log(`✓ Validation error handled: "${emptyWhRes.body?.message}"`);

  // 5. Create Warehouse as MANAGER
  console.log('\n[5] Testing Warehouse creation as MANAGER...');
  const uniqueCode = 'WH-TST-' + Date.now().toString().slice(-4);
  const createWhRes = await api('POST', '/api/warehouses', managerToken, {
    name: 'Test Regional Depot',
    code: uniqueCode,
    address: '99 Automation Way, Dock 7',
    description: 'Temporary warehouse for test suite',
    status: 'ACTIVE',
  });
  if (createWhRes.status !== 201 || !createWhRes.body?.id) {
    throw new Error(`Failed to create warehouse: ${JSON.stringify(createWhRes.body)}`);
  }
  const createdWh = createWhRes.body;
  console.log(`✓ Warehouse created: ${createdWh.name} (Code: ${createdWh.code}, ID: ${createdWh.id})`);

  // 6. Test Duplicate Code
  console.log('\n[6] Testing Duplicate Warehouse Code validation...');
  const dupWhRes = await api('POST', '/api/warehouses', adminToken, {
    name: 'Duplicate Depot',
    code: uniqueCode,
  });
  if (dupWhRes.status !== 409) {
    throw new Error(`Expected 409 for duplicate warehouse code, got ${dupWhRes.status}`);
  }
  console.log(`✓ Duplicate warehouse code correctly rejected (409 Conflict).`);

  // 7. Test Update Warehouse
  console.log('\n[7] Testing Warehouse update as ADMIN...');
  const updateWhRes = await api('PUT', `/api/warehouses/${createdWh.id}`, adminToken, {
    name: 'Updated Regional Depot',
    address: '100 Automation Blvd',
  });
  if (updateWhRes.status !== 200 || updateWhRes.body.name !== 'Updated Regional Depot') {
    throw new Error(`Failed to update warehouse: ${JSON.stringify(updateWhRes.body)}`);
  }
  console.log('✓ Warehouse updated successfully.');

  // 8. Test Location RBAC & Creation
  console.log('\n[8] Testing Location RBAC (STAFF cannot create location)...');
  const staffLocRes = await api('POST', '/api/locations', staffToken, {
    warehouseId: createdWh.id,
    name: 'Illegal Bin',
    code: 'X-01',
  });
  if (staffLocRes.status !== 403) {
    throw new Error(`Expected 403 for STAFF POST /api/locations, got ${staffLocRes.status}`);
  }
  console.log('✓ STAFF forbidden (403) from creating storage locations.');

  // 9. Test Location Creation with Invalid Warehouse
  console.log('\n[9] Testing Location creation with invalid warehouse ID...');
  const invalidWhLoc = await api('POST', '/api/locations', adminToken, {
    warehouseId: '507f1f77bcf86cd799439011',
    name: 'Orphan Bin',
    code: 'O-01',
  });
  if (invalidWhLoc.status !== 404) {
    throw new Error(`Expected 404 for non-existent warehouseId, got ${invalidWhLoc.status}`);
  }
  console.log('✓ Location correctly rejected when warehouse does not exist (404 Not Found).');

  // 10. Create Locations in the test warehouse
  console.log('\n[10] Creating locations in test warehouse as MANAGER...');
  const loc1Res = await api('POST', '/api/locations', managerToken, {
    warehouseId: createdWh.id,
    name: 'Aisle 1 Shelf A',
    code: 'A1-A',
    description: 'Bulk storage',
    status: 'ACTIVE',
  });
  const loc2Res = await api('POST', '/api/locations', managerToken, {
    warehouseId: createdWh.id,
    name: 'Aisle 1 Shelf B',
    code: 'A1-B',
    description: 'Carton picking',
    status: 'ACTIVE',
  });
  if (loc1Res.status !== 201 || loc2Res.status !== 201) {
    throw new Error(`Failed to create locations: ${JSON.stringify(loc1Res.body)}`);
  }
  const loc1 = loc1Res.body;
  console.log(`✓ Created 2 storage locations (${loc1.code}, ${loc2Res.body.code}) in ${createdWh.code}.`);

  // 11. Test Duplicate Location Code within same Warehouse
  console.log('\n[11] Testing Duplicate Location Code inside same warehouse...');
  const dupLocRes = await api('POST', '/api/locations', adminToken, {
    warehouseId: createdWh.id,
    name: 'Duplicate Bin',
    code: 'A1-A',
  });
  if (dupLocRes.status !== 409) {
    throw new Error(`Expected 409 for duplicate location code, got ${dupLocRes.status}`);
  }
  console.log('✓ Duplicate location code within warehouse correctly rejected (409 Conflict).');

  // 12. Test GET /api/warehouses/:warehouseId/locations
  console.log('\n[12] Testing GET /api/warehouses/:warehouseId/locations for STAFF...');
  const whLocsRes = await api('GET', `/api/warehouses/${createdWh.id}/locations`, staffToken);
  if (whLocsRes.status !== 200 || whLocsRes.body.length !== 2) {
    throw new Error(`Expected 2 locations, got ${whLocsRes.body?.length}`);
  }
  console.log(`✓ STAFF successfully read ${whLocsRes.body.length} locations for warehouse.`);

  // 13. Test Update Location
  console.log('\n[13] Testing Location update as MANAGER...');
  const updateLocRes = await api('PUT', `/api/locations/${loc1.id}`, managerToken, {
    name: 'Aisle 1 Shelf A [EXPANDED]',
  });
  if (updateLocRes.status !== 200 || !updateLocRes.body.name.includes('[EXPANDED]')) {
    throw new Error(`Failed to update location: ${JSON.stringify(updateLocRes.body)}`);
  }
  console.log('✓ Location updated successfully.');

  // 14. Test Delete Location
  console.log('\n[14] Testing Location deletion as ADMIN...');
  const delLocRes = await api('DELETE', `/api/locations/${loc1.id}`, adminToken);
  if (delLocRes.status !== 200) {
    throw new Error(`Failed to delete location: ${JSON.stringify(delLocRes.body)}`);
  }
  console.log('✓ Single location deleted successfully.');

  // 15. Test Delete Warehouse with Cascading Locations
  console.log('\n[15] Testing Warehouse deletion and cascade cleanup...');
  const delWhRes = await api('DELETE', `/api/warehouses/${createdWh.id}`, adminToken);
  if (delWhRes.status !== 200) {
    throw new Error(`Failed to delete warehouse: ${JSON.stringify(delWhRes.body)}`);
  }
  // Verify warehouse is gone
  const checkWh = await api('GET', `/api/warehouses/${createdWh.id}`, adminToken);
  if (checkWh.status !== 404) {
    throw new Error('Warehouse was not deleted');
  }
  // Verify child location was also deleted
  const checkLoc = await api('GET', `/api/locations/${loc2Res.body.id}`, adminToken);
  if (checkLoc.status !== 404) {
    throw new Error('Child location was not cleaned up on warehouse delete');
  }
  console.log('✓ Warehouse and all its child locations cleaned up successfully.');

  console.log('\n🎉 ALL PHASE 5 TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
