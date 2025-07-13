// routes/product.js
const express = require('express');
const Product = require('../model/Product');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// ➊ 정렬 옵션 정의
const SORT_OPTIONS = {
  'createdAt_desc': { createdAt: -1 },
  'createdAt_asc':  { createdAt:  1 },
  'price_desc':     { price:     -1 },
  'price_asc':      { price:      1 },
};

// multer 저장 설정 (생략)

// ➋ 전체 상품 목록 + 키워드 검색 + 동적 정렬
router.get('/', async (req, res) => {
  try {
    const { keyword = '', sort } = req.query;
    // 넘어온 sort 값이 없거나 목록에 없으면 최신순 기본
    const sortObj = SORT_OPTIONS[sort] || SORT_OPTIONS['createdAt_desc'];

    const products = await Product
      .find({ title: { $regex: keyword, $options: 'i' } })
      .sort(sortObj);

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ➌ 내가 등록한 상품 목록 + 동적 정렬
router.get('/my', authMiddleware, async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: '인증이 필요합니다.' });
    }

    const { sort } = req.query;
    const sortObj = SORT_OPTIONS[sort] || SORT_OPTIONS['createdAt_desc'];

    const myProducts = await Product
      .find({ sellerId: req.user.id })
      .sort(sortObj);

    res.json({ products: myProducts });
  } catch (err) {
    res.status(500).json({ error: 'Server error', detail: String(err) });
  }
});

// ➍ 이하 상품 상세, 등록, 수정, 삭제 라우트는 그대로 사용
//    (생략)

module.exports = router;
