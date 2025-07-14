// routes/product.js
const express = require('express');
const Product = require('../model/Product');
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// ➊ 정렬 옵션 정의
const SORT_OPTIONS = {
  createdAt_desc: { createdAt: -1 },
  createdAt_asc:  { createdAt:  1 },
  price_desc:     { price:     -1 },
  price_asc:      { price:      1 },
};

// ➋ multer 설정 (이미지 업로드)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// ──────────────── 기본 목록 조회 ────────────────
// GET /api/products?keyword=&sort=
router.get('/', async (req, res) => {
  try {
    const { keyword = '', sort } = req.query;
    const sortObj = SORT_OPTIONS[sort] || SORT_OPTIONS.createdAt_desc;

    const products = await Product
      .find({ title: { $regex: keyword, $options: 'i' } })
      .sort(sortObj);

    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ───────────── 내가 등록한 상품 조회 ─────────────
// GET /api/products/my?sort=
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const sortObj = SORT_OPTIONS[req.query.sort] || SORT_OPTIONS.createdAt_desc;
    const myProducts = await Product
      .find({ sellerId: req.user.id })
      .sort(sortObj);

    res.json(myProducts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ───────────── 단일 상품 상세 조회 ─────────────
// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Invalid product ID' });
  }
});

// ───────────── 상품 등록 ─────────────
// POST /api/products
router.post('/', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const { title, description, price, location } = req.body;
    const imageFiles = req.files.map(f => f.filename);
    const newProduct = new Product({
      title,
      description,
      price,
      location: JSON.parse(location || '{}'),
      images: imageFiles,
      sellerId: req.user.id,
    });
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to create product' });
  }
});

// ───────────── 상품 수정 ─────────────
// PATCH /api/products/:id
router.patch('/:id', authMiddleware, upload.array('images', 5), async (req, res) => {
  try {
    const updates = { ...req.body };

    if (updates.location) {
      try {
        updates.location = JSON.parse(updates.location);
      } catch {
        updates.location = {};
      }
    }

    if (req.files.length) {
      let existingImages = [];
    if (updates.existingImages) {
      try {
        existingImages = JSON.parse(updates.existingImages);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid existingImages format' });
      }
    }
    delete updates.existingImages;

    let parsedLocation;
    if (updates.location) {
      try {
        parsedLocation = JSON.parse(updates.location);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid location format' });
      }
    }
    delete updates.location;

    const uploadedImages = req.files.map(f => f.filename);
    updates.images = [...existingImages, ...uploadedImages];

    if (parsedLocation) {
      updates.location = parsedLocation;
    }
  }
    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to update product' });
  }
});

// ───────────── 상품 삭제 ─────────────
// DELETE /api/products/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await Product.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
