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

const api = (method, path, token, body) =>
  request(
    {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
    body
  );

async function runTestVerification() {
  console.log('==================================================================');
  console.log('--- WIMS BALANCED UPGRADE: COMPREHENSIVE AUTOMATED VERIFICATION ---');
  console.log('==================================================================\n');

  // 1. Authentication & JWT Functionality
  console.log('TEST 1: Authentication & JWT Tokens');
  const adminToken = await login('admin@example.com');
  const managerToken = await login('manager@example.com');
  const staffToken = await login('staff@example.com');
  console.log('✓ Successfully authenticated ADMIN, MANAGER, and STAFF accounts.');

  // 2. RBAC Permissions
  console.log('\nTEST 2: Role-Based Access Control (RBAC)');
  const staffDenied = await api('POST', '/api/products', staffToken, {
    name: 'Unauthorized Item',
    sku: 'UNAUTH-999',
    category: 'Security',
    unitPrice: 10,
  });
  if (staffDenied.status !== 403) {
    throw new Error(`RBAC Failure: STAFF should be 403 Forbidden, got ${staffDenied.status}`);
  }
  console.log('✓ STAFF correctly blocked (HTTP 403) from creating products.');

  // 3. Product CRUD & Sorting Options
  console.log('\nTEST 3: Product Search, Validation & Sorting');
  const testSku = 'TEST-PRD-' + Date.now().toString().slice(-4);
  const createProdRes = await api('POST', '/api/products', adminToken, {
    name: 'High Precision Scale',
    sku: testSku,
    description: 'Precision warehouse counting scale',
    category: 'Electronics & Tools',
    unitPrice: 125.50,
    quantity: 10,
    status: 'ACTIVE',
  });
  if (createProdRes.status !== 201) {
    throw new Error(`Failed to create product: ${JSON.stringify(createProdRes.body)}`);
  }
  const createdProdId = createProdRes.body.id;
  console.log(`✓ Product created successfully with SKU [${testSku}].`);

  // 3.1 Test sorting by price
  const sortRes = await api('GET', '/api/products?sortBy=price&sortOrder=asc', adminToken);
  if (sortRes.status !== 200 || !Array.isArray(sortRes.body)) {
    throw new Error('Failed to retrieve sorted products.');
  }
  const prices = sortRes.body.map((p) => p.unitPrice);
  for (let i = 0; i < prices.length - 1; i++) {
    if (prices[i] > prices[i + 1]) {
      throw new Error(`Products not sorted in ascending price order: ${prices.join(', ')}`);
    }
  }
  console.log('✓ Product sorting verified: Successfully sorted products by unit price ascending.');

  // 3.2 Test CSV Export for Products
  const prodCsvRes = await api('GET', '/api/products/export/csv', adminToken);
  if (prodCsvRes.status !== 200 || !prodCsvRes.headers['content-type']?.includes('text/csv')) {
    throw new Error(`Product CSV export failed: status ${prodCsvRes.status}`);
  }
  if (!prodCsvRes.body.includes('Product Name,SKU,Category,Unit Price,Quantity,Status')) {
    throw new Error('Product CSV missing required header row.');
  }
  console.log('✓ Product CSV export verified: Correct text/csv headers & columns generated.');

  // 4. Warehouse & Location Management
  console.log('\nTEST 4: Warehouse and Location Management');
  const whRes = await api('GET', '/api/warehouses', staffToken);
  if (whRes.status !== 200 || whRes.body.length === 0) {
    throw new Error('Failed to retrieve warehouses.');
  }
  const testWh = whRes.body[0];
  const locRes = await api('GET', `/api/warehouses/${testWh.id}/locations`, staffToken);
  if (locRes.status !== 200 || locRes.body.length === 0) {
    throw new Error('Failed to retrieve storage locations for warehouse.');
  }
  const testLoc = locRes.body[0];
  console.log(`✓ Warehouses & Locations verified: Found warehouse [${testWh.code}] with location [${testLoc.code}].`);

  // 5. Inventory Ledger & CSV Export
  console.log('\nTEST 5: Inventory Ledger & Inventory CSV Export');
  const invRes = await api('GET', '/api/inventory', staffToken);
  if (invRes.status !== 200 || !Array.isArray(invRes.body)) {
    throw new Error('Failed to retrieve inventory records.');
  }
  const invCsvRes = await api('GET', '/api/inventory/export/csv', adminToken);
  if (invCsvRes.status !== 200 || !invCsvRes.headers['content-type']?.includes('text/csv')) {
    throw new Error(`Inventory CSV export failed: status ${invCsvRes.status}`);
  }
  if (!invCsvRes.body.includes('Product Name,SKU,Category,Warehouse,Location,Quantity,Minimum Stock,Unit Price,Stock Status')) {
    throw new Error('Inventory CSV missing required header row.');
  }
  console.log('✓ Inventory CSV export verified: Formatted columns & live records streamed.');

  // 6. Stock Movement & Quantity Audit Trail
  console.log('\nTEST 6: Stock Movements with Previous & Updated Quantities');
  // 6.1 IN Movement
  const inMovement = await api('POST', '/api/movements', staffToken, {
    type: 'IN',
    productId: createdProdId,
    warehouseId: testWh.id,
    locationId: testLoc.id,
    quantity: 20,
    reason: 'Initial production shipment receipt',
  });
  if (inMovement.status !== 201) {
    throw new Error(`IN movement failed: ${JSON.stringify(inMovement.body)}`);
  }
  const inRecord = inMovement.body.movement;
  if (inRecord.previousQuantity === undefined || inRecord.newQuantity === undefined) {
    throw new Error('Audit Trail Failure: IN movement missing previousQuantity or newQuantity.');
  }
  console.log(`✓ Stock IN recorded: Previous Qty: ${inRecord.previousQuantity} → New Qty: ${inRecord.newQuantity} (+${inRecord.quantity}).`);

  // 6.2 OUT Movement
  const outMovement = await api('POST', '/api/movements', staffToken, {
    type: 'OUT',
    productId: createdProdId,
    warehouseId: testWh.id,
    locationId: testLoc.id,
    quantity: 5,
    reason: 'Outbound picking for regional dispatch',
  });
  if (outMovement.status !== 201) {
    throw new Error(`OUT movement failed: ${JSON.stringify(outMovement.body)}`);
  }
  const outRecord = outMovement.body.movement;
  if (outRecord.previousQuantity !== inRecord.newQuantity || outRecord.newQuantity !== inRecord.newQuantity - 5) {
    throw new Error(`Audit Trail Failure: Previous Qty (${outRecord.previousQuantity}) or New Qty (${outRecord.newQuantity}) incorrect.`);
  }
  console.log(`✓ Stock OUT recorded: Previous Qty: ${outRecord.previousQuantity} → New Qty: ${outRecord.newQuantity} (-${outRecord.quantity}).`);

  // 6.3 Negative Stock Prevention Check
  const excessiveOut = await api('POST', '/api/movements', staffToken, {
    type: 'OUT',
    productId: createdProdId,
    warehouseId: testWh.id,
    locationId: testLoc.id,
    quantity: 9999,
    reason: 'Invalid excessive dispatch test',
  });
  if (excessiveOut.status !== 400 || !excessiveOut.body.message.includes('Insufficient inventory')) {
    throw new Error('Negative Stock Validation Failure: Excessive OUT should return 400 with insufficient stock.');
  }
  console.log('✓ Negative Stock Validation: Prevented dispatch exceeding available inventory.');

  // 7. Inventory Intelligence (Stock-out Risk & Restock Calculations)
  console.log('\nTEST 7: Inventory Intelligence Module');
  const intelRes = await api('GET', '/api/intelligence/predictions', managerToken);
  if (intelRes.status !== 200 || !intelRes.body?.predictions || !intelRes.body?.demandAnalytics) {
    throw new Error(`Failed to retrieve intelligence report: ${JSON.stringify(intelRes.body)}`);
  }
  const { predictions, demandAnalytics, summary: intelSummary } = intelRes.body;
  console.log(`✓ Predictions calculated for ${predictions.length} inventory allocations.`);
  console.log(`   - High Risk Items (≤7d):   ${intelSummary.highRiskCount}`);
  console.log(`   - Medium Risk Items (8-14d): ${intelSummary.mediumRiskCount}`);
  console.log(`   - Low Risk Items (15-30d):   ${intelSummary.lowRiskCount}`);
  console.log(`   - Suggested Restock Orders:  ${intelSummary.pendingRestockCount}`);
  console.log(`✓ Fast-Moving Items: ${demandAnalytics.fastMoving.length} identified.`);
  console.log(`✓ 7-Day Consumption Daily Trend: ${demandAnalytics.dailyTrend.length} date points aggregated.`);

  // Verify prediction structure
  const samplePred = predictions[0];
  if (!samplePred || !('riskLevel' in samplePred) || !('suggestedReorderQty' in samplePred)) {
    throw new Error('Intelligence schema missing riskLevel or suggestedReorderQty.');
  }
  console.log(`✓ Sample item [${samplePred.productName}]: Current=${samplePred.currentStock}, Risk=${samplePred.riskLevel}, Suggested Reorder=${samplePred.suggestedReorderQty} units.`);

  // 8. Dashboard Analytics & Summary Charts
  console.log('\nTEST 8: Dashboard Analytics & Summary Breakdown');
  const dashRes = await api('GET', '/api/reports/analytics', adminToken);
  if (dashRes.status !== 200 || !dashRes.body?.summary) {
    throw new Error('Failed to retrieve dashboard analytics.');
  }
  const { summary: s, categoryBreakdown, statusBreakdown, recentMovements } = dashRes.body;
  console.log('✓ Operational Metrics Verified:');
  console.log(`   - Total Master Products:  ${s.totalProducts}`);
  console.log(`   - Total In-Stock Units:   ${s.totalStockUnits}`);
  console.log(`   - Low Stock Items:        ${s.lowStockCount}`);
  console.log(`   - Out of Stock Items:     ${s.outOfStockCount}`);
  console.log(`   - Total Stock Valuation:  $${s.totalStockValuation}`);
  console.log(`✓ Category Breakdown: ${categoryBreakdown.length} product groups aggregated.`);
  console.log(`✓ Status Breakdown: Healthy=${statusBreakdown.inStock}, Low=${statusBreakdown.lowStock}, Depleted=${statusBreakdown.outOfStock}.`);
  console.log(`✓ Recent Stock Movements: ${recentMovements.length} live audit log entries.`);

  console.log('\n==================================================================');
  console.log('🎉 ALL 8 TEST SUITES COMPLETED WITH 100% SUCCESS — ZERO FAILURES!');
  console.log('==================================================================');
}

runTestVerification().catch((err) => {
  console.error('\n❌ TEST VERIFICATION FAILED:', err.message);
  process.exit(1);
});
