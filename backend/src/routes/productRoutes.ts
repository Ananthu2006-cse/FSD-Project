import { Router, Response } from 'express';
import { Product, ProductStatus } from '../models/Product';
import { authenticateToken, authorizeRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Apply JWT authentication to all product routes
router.use(authenticateToken);

// GET /api/products/export/csv — Export products catalog as CSV (ADMIN, MANAGER, STAFF)
router.get('/export/csv', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const products = await Product.find().sort({ name: 1 });
    const headers = ['Product Name', 'SKU', 'Category', 'Unit Price', 'Quantity', 'Status'];
    const rows = products.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku.replace(/"/g, '""')}"`,
      `"${p.category.replace(/"/g, '""')}"`,
      p.unitPrice.toFixed(2),
      p.quantity,
      p.status,
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products-export.csv"');
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: 'Error generating products CSV export.' });
  }
});

// GET /api/products — View all products with search, category, status & sorting (ADMIN, MANAGER, STAFF)
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search, category, status, sortBy, sortOrder } = req.query;
    const filter: any = {};

    if (search && typeof search === 'string' && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: searchRegex }, { sku: searchRegex }];
    }

    if (category && typeof category === 'string' && category.trim()) {
      filter.category = category.trim();
    }

    if (status && typeof status === 'string' && status.trim()) {
      filter.status = status.trim().toUpperCase();
    }

    // Determine sort options
    const sortFieldMap: Record<string, string> = {
      name: 'name',
      sku: 'sku',
      price: 'unitPrice',
      unitPrice: 'unitPrice',
      quantity: 'quantity',
      createdAt: 'createdAt',
    };

    const sortField = sortBy && typeof sortBy === 'string' && sortFieldMap[sortBy] ? sortFieldMap[sortBy] : 'createdAt';
    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortOptions: Record<string, 1 | -1> = { [sortField]: sortDir };

    const products = await Product.find(filter).sort(sortOptions);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving products.' });
  }
});

// GET /api/products/:id — View single product (ADMIN, MANAGER, STAFF)
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid product ID format.' });
  }
});

// POST /api/products — Create product (ADMIN, MANAGER only)
router.post('/', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, sku, description, category, unitPrice, quantity, status } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ message: 'Product name is required.' });
      return;
    }

    if (!sku || typeof sku !== 'string' || !sku.trim()) {
      res.status(400).json({ message: 'SKU is required.' });
      return;
    }

    if (!category || typeof category !== 'string' || !category.trim()) {
      res.status(400).json({ message: 'Category is required.' });
      return;
    }

    const numUnitPrice = Number(unitPrice);
    if (isNaN(numUnitPrice) || numUnitPrice < 0) {
      res.status(400).json({ message: 'Unit price must be a non-negative number.' });
      return;
    }

    const numQuantity = quantity !== undefined ? Number(quantity) : 0;
    if (isNaN(numQuantity) || numQuantity < 0) {
      res.status(400).json({ message: 'Quantity must be a non-negative number.' });
      return;
    }

    let productStatus: ProductStatus = 'ACTIVE';
    if (status) {
      const upperStatus = String(status).trim().toUpperCase();
      if (upperStatus !== 'ACTIVE' && upperStatus !== 'INACTIVE') {
        res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' });
        return;
      }
      productStatus = upperStatus as ProductStatus;
    }

    const cleanSku = sku.trim().toUpperCase();
    const existingSku = await Product.findOne({ sku: cleanSku });
    if (existingSku) {
      res.status(409).json({ message: 'A product with this SKU already exists.' });
      return;
    }

    const newProduct = await Product.create({
      name: name.trim(),
      sku: cleanSku,
      description: description ? String(description).trim() : '',
      category: category.trim(),
      unitPrice: numUnitPrice,
      quantity: numQuantity,
      status: productStatus,
    });

    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error creating product.' });
  }
});

// PUT /api/products/:id — Update product (ADMIN, MANAGER only)
router.put('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    const { name, sku, description, category, unitPrice, quantity, status } = req.body;

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        res.status(400).json({ message: 'Product name cannot be empty.' });
        return;
      }
      product.name = name.trim();
    }

    if (sku !== undefined) {
      if (typeof sku !== 'string' || !sku.trim()) {
        res.status(400).json({ message: 'SKU cannot be empty.' });
        return;
      }
      const cleanSku = sku.trim().toUpperCase();
      if (cleanSku !== product.sku) {
        const existing = await Product.findOne({ sku: cleanSku });
        if (existing) {
          res.status(409).json({ message: 'A product with this SKU already exists.' });
          return;
        }
        product.sku = cleanSku;
      }
    }

    if (description !== undefined) {
      product.description = String(description).trim();
    }

    if (category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        res.status(400).json({ message: 'Category cannot be empty.' });
        return;
      }
      product.category = category.trim();
    }

    if (unitPrice !== undefined) {
      const numUnitPrice = Number(unitPrice);
      if (isNaN(numUnitPrice) || numUnitPrice < 0) {
        res.status(400).json({ message: 'Unit price must be a non-negative number.' });
        return;
      }
      product.unitPrice = numUnitPrice;
    }

    if (quantity !== undefined) {
      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity < 0) {
        res.status(400).json({ message: 'Quantity must be a non-negative number.' });
        return;
      }
      product.quantity = numQuantity;
    }

    if (status !== undefined) {
      const upperStatus = String(status).trim().toUpperCase();
      if (upperStatus !== 'ACTIVE' && upperStatus !== 'INACTIVE') {
        res.status(400).json({ message: 'Status must be ACTIVE or INACTIVE.' });
        return;
      }
      product.status = upperStatus as ProductStatus;
    }

    await product.save();
    res.json(product);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error updating product.' });
  }
});

// DELETE /api/products/:id — Delete product (ADMIN, MANAGER only)
router.delete('/:id', authorizeRoles('ADMIN', 'MANAGER'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      res.status(404).json({ message: 'Product not found.' });
      return;
    }

    res.json({
      message: 'Product deleted successfully.',
      id: req.params.id,
    });
  } catch (error) {
    res.status(400).json({ message: 'Invalid product ID format.' });
  }
});

export default router;
