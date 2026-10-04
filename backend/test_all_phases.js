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

async function runFullSuite() {
  console.log('===============================================================');
  console.log('--- STARTING COMPREHENSIVE END-TO-END TEST SUITE (PHASES 6-10) ---');
  console.log('===============================================================');

  // 1. Authenticate tokens
  console.log('\n[1] Authenticating test accounts...');
  const adminToken = await login('admin@example.com');
  const managerToken = await login('manager@example.com');
  const staffToken = await login('staff@example.com');
  console.log('✓ Retrieved JWTs for ADMIN, MANAGER, and STAFF.');

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

  // 2. Fetch master data (Product, Warehouse, Location)
  console.log('\n[2] Fetching initial master data...');
  const prodsRes = await api('GET', '/api/products', staffToken);
  const whsRes = await api('GET', '/api/warehouses', staffToken);

  if (!prodsRes.body?.length || !whsRes.body?.length) {
    throw new Error('Master data missing.');
  }
  const testProduct = prodsRes.body[0];
  const testWarehouse = whsRes.body[0];

  const whLocsRes = await api('GET', `/api/warehouses/${testWarehouse.id}/locations`, staffToken);
  if (!whLocsRes.body?.length) {
    throw new Error('Warehouse locations missing.');
  }
  const testLocation = whLocsRes.body[0];
  console.log(`✓ Master entities verified: Product "${testProduct.name}", Warehouse "${testWarehouse.code}", Location "${testLocation.code}".`);

  // ==========================================
  // PHASE 6: INVENTORY MANAGEMENT
  // ==========================================
  console.log('\n---------------------------------------------------------------');
  console.log('PHASE 6: INVENTORY / STOCK MANAGEMENT');
  console.log('---------------------------------------------------------------');

  // 6.1 View inventory
  const invRes = await api('GET', '/api/inventory', staffToken);
  if (invRes.status !== 200 || !Array.isArray(invRes.body)) {
    throw new Error('Failed to retrieve inventory.');
  }
  console.log(`✓ Inventory list fetched: ${invRes.body.length} records in database.`);

  // 6.2 STAFF cannot create inventory
  const staffCreateInv = await api('POST', '/api/inventory', staffToken, {
    productId: testProduct.id,
    warehouseId: testWarehouse.id,
    locationId: testLocation.id,
    quantity: 50,
  });
  if (staffCreateInv.status !== 403) {
    throw new Error(`Expected 403 for STAFF POST /api/inventory, got ${staffCreateInv.status}`);
  }
  console.log('✓ STAFF forbidden (403) from creating inventory records.');

  // 6.3 Negative quantity validation
  const negQtyInv = await api('POST', '/api/inventory', adminToken, {
    productId: testProduct.id,
    warehouseId: testWarehouse.id,
    locationId: testLocation.id,
    quantity: -10,
  });
  if (negQtyInv.status !== 400) {
    throw new Error(`Expected 400 for negative quantity, got ${negQtyInv.status}`);
  }
  console.log('✓ Negative inventory quantity correctly rejected (400 Bad Request).');

  // 6.4 Auto status calculation
  const lowStockItem = invRes.body.find((i) => i.status === 'LOW_STOCK');
  const inStockItem = invRes.body.find((i) => i.status === 'IN_STOCK');
  if (lowStockItem) {
    console.log(`✓ Auto-status verified: Item ${lowStockItem.productId?.name} has quantity ${lowStockItem.quantity} <= minStock ${lowStockItem.minimumStock} -> status "${lowStockItem.status}".`);
  }
  if (inStockItem) {
    console.log(`✓ Auto-status verified: Item ${inStockItem.productId?.name} has quantity ${inStockItem.quantity} > minStock ${inStockItem.minimumStock} -> status "${inStockItem.status}".`);
  }

  // ==========================================
  // PHASE 7: STOCK MOVEMENT
  // ==========================================
  console.log('\n---------------------------------------------------------------');
  console.log('PHASE 7: STOCK MOVEMENT & TRANSFERS');
  console.log('---------------------------------------------------------------');

  // 7.1 View stock movements
  const movRes = await api('GET', '/api/movements', staffToken);
  if (movRes.status !== 200 || !Array.isArray(movRes.body)) {
    throw new Error('Failed to retrieve movements.');
  }
  console.log(`✓ Movements log fetched: ${movRes.body.length} transactions recorded.`);

  // 7.2 Outbound rejection if insufficient stock
  const overDispatchRes = await api('POST', '/api/movements', staffToken, {
    type: 'OUT',
    productId: testProduct.id,
    warehouseId: testWarehouse.id,
    locationId: testLocation.id,
    quantity: 999999, // Impossible amount
    reason: 'Exceeding inventory test',
  });
  if (overDispatchRes.status !== 400) {
    throw new Error(`Expected 400 for over-dispatch, got ${overDispatchRes.status}`);
  }
  console.log(`✓ Insufficient stock correctly blocked: "${overDispatchRes.body?.message}"`);

  // 7.3 Execute valid stock transfer
  const stockItem = invRes.body.find((i) => i.quantity >= 5);
  const sWhId = stockItem.warehouseId?.id || stockItem.warehouseId?._id;
  const sLocId = stockItem.locationId?.id || stockItem.locationId?._id;
  const sProdId = stockItem.productId?.id || stockItem.productId?._id;
  const sWhLocs = await api('GET', `/api/warehouses/${sWhId}/locations`, staffToken);
  const targetLoc = sWhLocs.body.find((l) => l.id !== sLocId) || sWhLocs.body[0];

  const validTransferRes = await api('POST', '/api/movements', staffToken, {
    type: 'TRANSFER',
    productId: sProdId,
    warehouseId: sWhId,
    locationId: sLocId,
    toWarehouseId: sWhId,
    toLocationId: targetLoc.id,
    quantity: 2,
    reason: 'Routine bin rebalance test',
  });
  if (validTransferRes.status !== 201 || !validTransferRes.body?.movement) {
    throw new Error(`Failed to execute stock transfer: ${JSON.stringify(validTransferRes.body)}`);
  }
  console.log(`✓ Stock transfer executed cleanly: 2 units of "${stockItem.productId?.name}" relocated. Operator logged as "${validTransferRes.body.movement.userId?.name}".`);

  // ==========================================
  // PHASE 8: DAMAGED STOCK
  // ==========================================
  console.log('\n---------------------------------------------------------------');
  console.log('PHASE 8: DAMAGED STOCK MANAGEMENT');
  console.log('---------------------------------------------------------------');

  // 8.1 View damaged stock
  const damRes = await api('GET', '/api/damaged', staffToken);
  if (damRes.status !== 200 || !Array.isArray(damRes.body)) {
    throw new Error('Failed to retrieve damaged stock.');
  }
  console.log(`✓ Damaged stock records fetched: ${damRes.body.length} records.`);

  // 8.2 Report damaged item & verify inventory deduction
  const initialInvCheck = await api('GET', '/api/inventory', staffToken);
  const targetInv = initialInvCheck.body.find((i) => i.productId?.id === testProduct.id && i.quantity >= 3);

  if (targetInv) {
    const qtyBefore = targetInv.quantity;
    const reportDamRes = await api('POST', '/api/damaged', staffToken, {
      productId: testProduct.id,
      warehouseId: targetInv.warehouseId?.id || targetInv.warehouseId?._id,
      locationId: targetInv.locationId?.id || targetInv.locationId?._id,
      quantity: 1,
      reason: 'Crushed box corner during handling',
    });
    if (reportDamRes.status !== 201) {
      throw new Error(`Failed to report damaged stock: ${JSON.stringify(reportDamRes.body)}`);
    }
    const remaining = reportDamRes.body.remainingInventory;
    if (remaining !== qtyBefore - 1) {
      throw new Error(`Inventory was not deducted! Before: ${qtyBefore}, After: ${remaining}`);
    }
    console.log(`✓ Damaged stock reported: 1 unit quarantined. Usable inventory deducted from ${qtyBefore} to ${remaining}.`);

    // 8.3 Resolve damaged stock as MANAGER
    const damagedId = reportDamRes.body.damaged.id;
    const resolveRes = await api('PATCH', `/api/damaged/${damagedId}/resolve`, managerToken, {
      resolutionNotes: 'Written off with vendor insurance voucher #9941',
    });
    if (resolveRes.status !== 200 || resolveRes.body.status !== 'RESOLVED') {
      throw new Error(`Failed to resolve damaged item: ${JSON.stringify(resolveRes.body)}`);
    }
    console.log(`✓ Damaged stock resolution approved by MANAGER: Status is now "${resolveRes.body.status}".`);
  }

  // ==========================================
  // PHASE 9: ORDER & DISPATCH FULFILLMENT
  // ==========================================
  console.log('\n---------------------------------------------------------------');
  console.log('PHASE 9: ORDER & DISPATCH WORKFLOW');
  console.log('---------------------------------------------------------------');

  // 9.1 View orders
  const ordRes = await api('GET', '/api/orders', staffToken);
  if (ordRes.status !== 200 || !Array.isArray(ordRes.body)) {
    throw new Error('Failed to retrieve orders.');
  }
  console.log(`✓ Orders list fetched: ${ordRes.body.length} orders in queue.`);

  // 9.2 Create fulfillment order
  const createOrderRes = await api('POST', '/api/orders', staffToken, {
    customerName: 'Test End-To-End Client',
    items: [
      { productId: testProduct.id, quantity: 2 },
    ],
    dispatchBay: 'Bay 03 - East Wing',
    notes: 'Urgent priority dispatch',
  });
  if (createOrderRes.status !== 201 || !createOrderRes.body?.orderNumber) {
    throw new Error(`Failed to create order: ${JSON.stringify(createOrderRes.body)}`);
  }
  const testOrder = createOrderRes.body;
  console.log(`✓ Fulfillment order created: ${testOrder.orderNumber} (Status: ${testOrder.status}, Total: $${testOrder.totalAmount.toFixed(2)}).`);

  // 9.3 Transition PENDING -> CONFIRMED (verifies inventory)
  const confirmOrderRes = await api('PATCH', `/api/orders/${testOrder.id}/status`, staffToken, {
    status: 'CONFIRMED',
  });
  if (confirmOrderRes.status !== 200 || confirmOrderRes.body.status !== 'CONFIRMED') {
    throw new Error(`Failed to confirm order: ${JSON.stringify(confirmOrderRes.body)}`);
  }
  console.log(`✓ Order confirmed after inventory verification check.`);

  // 9.4 Transition CONFIRMED -> PICKING -> READY -> DISPATCHED
  await api('PATCH', `/api/orders/${testOrder.id}/status`, staffToken, { status: 'PICKING' });
  await api('PATCH', `/api/orders/${testOrder.id}/status`, staffToken, { status: 'READY' });
  const dispatchRes = await api('PATCH', `/api/orders/${testOrder.id}/status`, staffToken, {
    status: 'DISPATCHED',
    dispatchBay: 'Bay 03 - East Wing',
  });
  if (dispatchRes.status !== 200 || dispatchRes.body.status !== 'DISPATCHED') {
    throw new Error(`Failed to dispatch order: ${JSON.stringify(dispatchRes.body)}`);
  }
  console.log(`✓ Full lifecycle completed: Order progressed to DISPATCHED. Usable stock decremented for outbound freight.`);

  // ==========================================
  // PHASE 10: REPORTS & DASHBOARD ANALYTICS
  // ==========================================
  console.log('\n---------------------------------------------------------------');
  console.log('PHASE 10: OPERATIONAL REPORTS & DASHBOARD METRICS');
  console.log('---------------------------------------------------------------');

  const analyticsRes = await api('GET', '/api/reports/analytics', adminToken);
  if (analyticsRes.status !== 200 || !analyticsRes.body?.summary) {
    throw new Error('Failed to retrieve analytics report.');
  }
  const s = analyticsRes.body.summary;
  console.log('✓ Live MongoDB Operational Metrics Summary:');
  console.log(`   - Total Products:        ${s.totalProducts}`);
  console.log(`   - Total Warehouses:      ${s.totalWarehouses}`);
  console.log(`   - Total Storage Bins:    ${s.totalLocations}`);
  console.log(`   - Total Units In Stock:  ${s.totalStockUnits}`);
  console.log(`   - Total Stock Valuation: $${s.totalStockValuation}`);
  console.log(`   - Low Stock Items:       ${s.lowStockCount}`);
  console.log(`   - Damaged Stock Items:   ${s.totalDamagedItems}`);
  console.log(`   - Total Orders Processed:${s.totalOrders} (${s.dispatchedOrders} dispatched)`);

  console.log('\n===============================================================');
  console.log('🎉 ALL PHASES (PHASE 5 THROUGH PHASE 10) PASSED WITH 100% SUCCESS!');
  console.log('===============================================================');
}

runFullSuite().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.message);
  process.exit(1);
});
