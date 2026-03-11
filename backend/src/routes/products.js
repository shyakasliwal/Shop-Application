const express = require('express');
const Product = require('../models/Product');

const router = express.Router();

// GET /api/products - list all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    console.error('Error fetching products', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /api/products - create a new product
router.post('/', async (req, res) => {
  try {
    const {
      name,
      type,
      stock,
      mrp,
      sellingPrice,
      brand,
      description,
      returnEligible,
      imageUrl,
      images,
    } = req.body;

    if (!name || !type || stock == null || mrp == null || sellingPrice == null || !brand) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const normalizedImages = Array.isArray(images)
      ? images
      : imageUrl
      ? [imageUrl]
      : [];

    const product = await Product.create({
      name,
      type,
      stock,
      mrp,
      sellingPrice,
      brand,
      description,
      returnEligible: Boolean(returnEligible),
      imageUrl,
      images: normalizedImages,
      isPublished: false,
      status: 'draft',
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('Error creating product', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PATCH /api/products/:id/publish - toggle publish status
router.patch('/:id/publish', async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const product = await Product.findByIdAndUpdate(
      id,
      {
        isPublished: Boolean(isPublished),
        status: Boolean(isPublished) ? 'published' : 'draft',
      },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('Error updating publish status', err);
    res.status(500).json({ error: 'Failed to update publish status' });
  }
});

// PATCH /api/products/:id - update product fields
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatable = [
      'name',
      'type',
      'stock',
      'mrp',
      'sellingPrice',
      'brand',
      'description',
      'returnEligible',
      'imageUrl',
      'images',
    ];

    const updateData = {};
    updatable.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (Object.prototype.hasOwnProperty.call(updateData, 'returnEligible')) {
      updateData.returnEligible = Boolean(updateData.returnEligible);
    }

    if (Object.prototype.hasOwnProperty.call(updateData, 'images')) {
      const rawImages = updateData.images;
      if (Array.isArray(rawImages)) {
        updateData.images = rawImages;
        updateData.imageUrl = rawImages[0] || updateData.imageUrl || '';
      } else if (typeof rawImages === 'string' && rawImages) {
        updateData.images = [rawImages];
        updateData.imageUrl = rawImages;
      }
    }

    const product = await Product.findByIdAndUpdate(id, updateData, { new: true });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('Error updating product', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - delete a product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting product', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;

