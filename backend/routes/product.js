// routes/product.js
const express = require('express');
const fs = require('fs');
const Product = require('../model/Product');
const Purchase = require('../model/Purchase');
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
      .populate('sellerId', 'name email')
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
      .populate('sellerId', 'name email')
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
    const product = await Product.findById(req.params.id).populate('sellerId', 'name email');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    // 기존 데이터에는 tokenSupply/tokenPrice 값이 없을 수 있으므로 기본값을 설정
    if (product.tokenSupply === undefined || product.tokenSupply === null) {
      product.tokenSupply = product.tokenCount;
    }
    if (product.tokenPrice === undefined || product.tokenPrice === null) {
      if (product.price && product.tokenCount) {
        product.tokenPrice = Math.round(product.price / product.tokenCount);
      } else {
        product.tokenPrice = 0;
      }
    }
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
    const { title, description, price, location, tokenCount, tokenSupply, tokenPrice,
            sharePercentage, shareQuantity, unitPrice, tier } = req.body;
    const parsedCount = parseInt(tokenCount, 10) || 100;
    const parsedSupply = tokenSupply !== undefined ? parseInt(tokenSupply, 10) : parsedCount;
    const parsedSharePercentage = sharePercentage !== undefined ? parseFloat(sharePercentage) : 0;
    const parsedShareQuantity   = shareQuantity !== undefined ? parseFloat(shareQuantity)   : 0;
    const parsedUnitPrice       = unitPrice !== undefined ? parseFloat(unitPrice)       : 0;
    if (parsedSupply < parsedCount * 0.35) {
      return res.status(400).json({ error: 'tokenSupply must be at least 35% of tokenCount' });
    }

    const imageFiles = req.files.map(f => f.filename);
    const newProduct = new Product({
      title,
      description,
      price,
      tokenSupply: parsedSupply,
      tokenPrice,
      tokenCount: parsedCount,
      location: JSON.parse(location || '{}'),
      sharePercentage: parsedSharePercentage,
      shareQuantity:   parsedShareQuantity,
      unitPrice:       parsedUnitPrice,
      tier: tier || 'free',
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
      } catch (err) {
        return res.status(400).json({ error: 'Invalid location format' });
      }
    }

    if (updates.tokenCount !== undefined) {
      updates.tokenCount = parseInt(updates.tokenCount, 10);
    }

    if (updates.sharePercentage !== undefined) {
      updates.sharePercentage = parseFloat(updates.sharePercentage);
    }
    if (updates.shareQuantity !== undefined) {
      updates.shareQuantity = parseFloat(updates.shareQuantity);
    }
    if (updates.unitPrice !== undefined) {
      updates.unitPrice = parseFloat(updates.unitPrice);
    }

    let existingImages = [];
    if (updates.existingImages) {
      try {
        existingImages = JSON.parse(updates.existingImages);
      } catch (err) {
        return res.status(400).json({ error: 'Invalid existingImages format' });
      }
    }
    delete updates.existingImages;
  const uploadedImages = (req.files || []).map(f => f.filename);

    const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const newImages = [...existingImages, ...uploadedImages];
  const removedImages = (product.images || []).filter(img => !newImages.includes(img));
  for (const img of removedImages) {
    try {
      await fs.promises.unlink(path.join(__dirname, '../uploads', img));
    } catch (e) {}
  }

  updates.images = newImages;

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

// ───────────── 토큰 구매 ─────────────
// POST /api/products/:id/purchase { quantity }
router.post('/:id/purchase', authMiddleware, async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity, 10);
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid quantity' });
    }

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    // tokenSupply 값이 없을 경우 tokenCount를 잔여 수량으로 간주
    if (product.tokenSupply === undefined || product.tokenSupply === null) {
      product.tokenSupply = product.tokenCount;
    }

    if (product.tokenSupply < quantity) {
      return res.status(400).json({ error: 'Not enough tokens available' });
    }

    product.tokenSupply -= quantity;
    await product.save();

    const purchase = new Purchase({
      userId: req.user.id,
      productId: product._id,
      quantity
    });
    await purchase.save();

    res.json({ message: 'Purchase successful', purchase });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ───────────── 상품 삭제 ─────────────
// DELETE /api/products/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    for (const img of product.images || []) {
      try {
        await fs.promises.unlink(path.join(__dirname, '../uploads', img));
      } catch (e) {}
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
