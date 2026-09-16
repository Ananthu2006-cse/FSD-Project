import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import productRoutes from './routes/productRoutes';
import { User } from './models/User';
import { Product } from './models/Product';

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
