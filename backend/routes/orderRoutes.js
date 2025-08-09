// ── backend/routes/orderRoutes.js ──
const express = require('express');
const { getBook, addOrder, getOpenSellSummary } = require('../controllers/orderController');
const auth = require('../middleware/auth');  // 로그인 검사 미들웨어

const router = express.Router();

// 주문장(오더북) 조회
// GET /api/orders/book/:productId
router.get('/book/:productId', getBook);

// 미체결 매도 합계 및 보유량 요약
// GET /api/orders/open-sell/:productId
router.get('/open-sell/:productId', auth, getOpenSellSummary);

// 주문 추가
// POST /api/orders
// { productId, type: 'buy'|'sell', price, quantity }
router.post('/', auth, addOrder);

module.exports = router;
