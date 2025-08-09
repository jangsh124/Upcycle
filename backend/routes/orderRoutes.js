// ── backend/routes/orderRoutes.js ──
const express = require('express');
const { getBook, addOrder, getOpenSellSummary, getOpenSellList, cancelOrder } = require('../controllers/orderController');
const auth = require('../middleware/auth');  // 로그인 검사 미들웨어

const router = express.Router();

// 주문장(오더북) 조회
// GET /api/orders/book/:productId
router.get('/book/:productId', getBook);

// 미체결 매도 합계 및 보유량 요약
// GET /api/orders/open-sell/:productId
router.get('/open-sell/:productId', auth, getOpenSellSummary);

// 미체결 매도 목록
// GET /api/orders/open-sell-list/:productId
router.get('/open-sell-list/:productId', auth, getOpenSellList);

// 주문 취소
// POST /api/orders/:orderId/cancel
router.post('/:orderId/cancel', auth, cancelOrder);

// 주문 추가
// POST /api/orders
// { productId, type: 'buy'|'sell', price, quantity }
router.post('/', auth, addOrder);

module.exports = router;
