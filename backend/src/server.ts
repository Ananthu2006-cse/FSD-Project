import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import locationRoutes from './routes/locationRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import movementRoutes from './routes/movementRoutes';
import damagedRoutes from './routes/damagedRoutes';
import orderRoutes from './routes/orderRoutes';
import reportsRoutes from './routes/reportsRoutes';
import { User } from './models/User';
import { Product } from './models/Product';
import { Warehouse } from './models/Warehouse';
import { Location } from './models/Location';
import { Inventory } from './models/Inventory';
import { StockMovement } from './models/StockMovement';
import { DamagedStock } from './models/DamagedStock';
import { Order } from './models/Order';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inventory_db';

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Root & Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'UP',
    database: mongoose.connection.readyState === 1 ? 'CONNECTED' : 'DISCONNECTED',
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/damaged', damagedRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api', userRoutes);

// Seed default products if empty
const seedProducts = async () => {
  const count = await Product.countDocuments();
  if (count === 0) {
    await Product.create([
      {
        name: 'Heavy Duty Euro Pallet',
        sku: 'PLT-EUR-001',
        description: 'Standard heavy duty wooden warehouse pallet (1200x800mm)',
        category: 'Storage & Pallets',
        unitPrice: 24.50,
        quantity: 150,
        status: 'ACTIVE',
      },
      {
        name: 'Industrial Barcode Scanner 2D',
        sku: 'SCN-WMS-104',
        description: 'Rugged handheld wireless Bluetooth 2D QR/barcode reader',
        category: 'Electronics & Tools',
        unitPrice: 189.99,
        quantity: 35,
        status: 'ACTIVE',
      },
      {
        name: 'Galvanized Steel Storage Bin',
        sku: 'BIN-STL-045',
        description: 'Stackable steel warehouse picking bin with label holder',
        category: 'Shelving & Bins',
        unitPrice: 42.00,
        quantity: 80,
        status: 'ACTIVE',
      },
      {
        name: 'Industrial Heavy Stretch Wrap',
        sku: 'PKG-WRP-009',
        description: '500mm x 300m 23-micron pallet packing shrink film roll',
        category: 'Packaging',
        unitPrice: 16.75,
        quantity: 210,
        status: 'ACTIVE',
      },
    ]);
    console.log('[Database] Initial product catalog seeded.');
  }
};

// Seed default users if they don't exist
const seedUsers = async () => {
  const defaultPassword = 'demo@2024';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const initialUsers = [
    { name: 'Admin', email: 'admin@example.com', role: 'ADMIN' },
    { name: 'Manager', email: 'manager@example.com', role: 'MANAGER' },
    { name: 'Staff', email: 'staff@example.com', role: 'STAFF' },
  ];

  for (const u of initialUsers) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      existing.password = hashedPassword;
      existing.role = u.role as any;
      existing.status = 'ACTIVE';
      await existing.save();
    } else {
      await User.create({
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: u.role,
        status: 'ACTIVE',
      });
    }
  }
  console.log('[Database] Seed users initialized (admin, manager, staff).');
};

// Seed default warehouses and locations if empty
const seedWarehouses = async () => {
  const count = await Warehouse.countDocuments();
  if (count === 0) {
    const mainWh = await Warehouse.create({
      name: 'Main Distribution Centre',
      code: 'WH-001',
      address: '12 Industrial Estate Road, Sector 4, Logistics Park',
      description: 'Primary storage and dispatch facility',
      status: 'ACTIVE',
    });
    const northWh = await Warehouse.create({
      name: 'North Annex Storage',
      code: 'WH-002',
      address: '7 North Storage Lane, Zone B',
      description: 'Overflow and bulk storage annex',
      status: 'ACTIVE',
    });
    // Locations for Main WH
    for (const loc of [
      { name: 'Aisle A - Bay 01', code: 'A-01', description: 'Heavy pallets zone' },
      { name: 'Aisle A - Bay 02', code: 'A-02', description: 'General storage' },
      { name: 'Aisle B - Bay 01', code: 'B-01', description: 'Electronics rack' },
      { name: 'Aisle B - Bay 02', code: 'B-02', description: 'Fragile items' },
    ]) {
      await Location.create({ warehouseId: mainWh._id, ...loc, status: 'ACTIVE' });
    }
    // Locations for North Annex
    for (const loc of [
      { name: 'Zone C - Bay 01', code: 'C-01', description: 'Bulk rolls and packaging' },
      { name: 'Zone C - Bay 02', code: 'C-02', description: 'Spare capacity' },
    ]) {
      await Location.create({ warehouseId: northWh._id, ...loc, status: 'ACTIVE' });
    }
    console.log('[Database] Warehouse and location seed data initialized.');
  }
};

// Seed operational data (Inventory, Movements, Damaged Stock, Orders) if empty
const seedOperationalData = async () => {
  const invCount = await Inventory.countDocuments();
  if (invCount === 0) {
    const products = await Product.find();
    const mainWh = await Warehouse.findOne({ code: 'WH-001' });
    const northWh = await Warehouse.findOne({ code: 'WH-002' });
    const adminUser = await User.findOne({ role: 'ADMIN' });

    if (products.length >= 4 && mainWh && northWh && adminUser) {
      const locA1 = await Location.findOne({ warehouseId: mainWh._id, code: 'A-01' });
      const locA2 = await Location.findOne({ warehouseId: mainWh._id, code: 'A-02' });
      const locB1 = await Location.findOne({ warehouseId: mainWh._id, code: 'B-01' });
      const locC1 = await Location.findOne({ warehouseId: northWh._id, code: 'C-01' });

      if (locA1 && locA2 && locB1 && locC1) {
        // Seed Inventory
        const inv1 = await Inventory.create({
          productId: products[0]._id, // Euro Pallet
          warehouseId: mainWh._id,
          locationId: locA1._id,
          quantity: 120,
          minimumStock: 25,
        });

        const inv2 = await Inventory.create({
          productId: products[1]._id, // Barcode Scanner
          warehouseId: mainWh._id,
          locationId: locB1._id,
          quantity: 18,
          minimumStock: 10,
        });

        const inv3 = await Inventory.create({
          productId: products[2]._id, // Steel Bin
          warehouseId: mainWh._id,
          locationId: locA2._id,
          quantity: 8, // Low stock on purpose
          minimumStock: 15,
        });

        const inv4 = await Inventory.create({
          productId: products[3]._id, // Stretch Wrap
          warehouseId: northWh._id,
          locationId: locC1._id,
          quantity: 210,
          minimumStock: 50,
        });

        // Seed initial movements
        await StockMovement.create([
          {
            type: 'IN',
            productId: products[0]._id,
            warehouseId: mainWh._id,
            locationId: locA1._id,
            quantity: 120,
            reason: 'Inbound delivery from supplier container manifest #4092',
            userId: adminUser._id,
          },
          {
            type: 'TRANSFER',
            productId: products[1]._id,
            warehouseId: mainWh._id,
            locationId: locA1._id,
            toWarehouseId: mainWh._id,
            toLocationId: locB1._id,
            quantity: 5,
            reason: 'Replenishing secure tech electronics shelf',
            userId: adminUser._id,
          },
        ]);

        // Seed 1 Damaged item report
        await DamagedStock.create({
          productId: products[2]._id,
          warehouseId: mainWh._id,
          locationId: locA2._id,
          quantity: 2,
          reason: 'Forklift impact caused dented steel frame during unloading',
          reportedBy: adminUser._id,
          status: 'REPORTED',
        });

        // Seed Orders
        await Order.create([
          {
            orderNumber: 'ORD-7001-ALPHA',
            customerName: 'Continental Logistics Group',
            items: [
              { productId: products[0]._id, quantity: 15, unitPrice: products[0].unitPrice },
              { productId: products[3]._id, quantity: 20, unitPrice: products[3].unitPrice },
            ],
            totalAmount: 15 * products[0].unitPrice + 20 * products[3].unitPrice,
            status: 'CONFIRMED',
            dispatchBay: 'Bay 02 - North Gate',
            notes: 'High-priority regional distribution dispatch',
            createdBy: adminUser._id,
          },
          {
            orderNumber: 'ORD-7002-BETA',
            customerName: 'Apex Warehouse Supplies Ltd',
            items: [
              { productId: products[1]._id, quantity: 2, unitPrice: products[1].unitPrice },
            ],
            totalAmount: 2 * products[1].unitPrice,
            status: 'PENDING',
            dispatchBay: 'Bay 01',
            notes: 'Standard courier pickup',
            createdBy: adminUser._id,
          },
        ]);

        console.log('[Database] Operational data (Inventory, Movements, Damaged, Orders) seeded.');
      }
    }
  }
};

// Database Connection with graceful dev fallback
const connectDatabase = async () => {
  try {
    console.log(`[Database] Connecting to MongoDB at ${MONGODB_URI}...`);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    console.log('[Database] Connected to MongoDB successfully.');
  } catch (err: any) {
    console.warn(`[Database] Could not connect to local MongoDB (${err.message}). Starting in-memory dev database...`);
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      console.log(`[Database] In-memory MongoDB started at ${memoryUri}`);
      await mongoose.connect(memoryUri);
      console.log('[Database] Connected to in-memory MongoDB.');
    } catch (memErr: any) {
      console.error('[Database] Failed to initialize in-memory database:', memErr.message);
      throw memErr;
    }
  }

  await seedUsers();
  await seedProducts();
  await seedWarehouses();
  await seedOperationalData();
};

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`[Server] Warehouse Inventory API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('[Server] Fatal startup error:', error);
    process.exit(1);
  }
};

startServer();

export default app;
