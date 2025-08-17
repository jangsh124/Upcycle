// ── backend/routes/orderRoutes.js ──
const express = require('express');
const { getBook, addOrder, getOpenSellSummary, getOpenSellList, cancelOrder, setOrderProcessing, setOrderComplete } = require('../controllers/orderController');
const auth = require('../middleware/auth');  // 로그인 검사 미들웨어
const OrderModel = require('../model/Order');

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

// 주문 처리 중 상태로 변경 (결제 페이지 진입 시)
// POST /api/orders/:orderId/processing
router.post('/:orderId/processing', auth, setOrderProcessing);

// 주문 완료 상태로 변경 (결제 완료 시)
// PATCH /api/orders/:orderId/complete
router.patch('/:orderId/complete', auth, setOrderComplete);

// 주문 추가
// POST /api/orders
// { productId, type: 'buy'|'sell', price, quantity }
router.post('/', auth, addOrder);

// 사용자의 최근 거래 내역 조회
// GET /api/orders/my/recent
router.get('/my/recent', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // holdings 데이터 기반으로 거래 내역 생성
    const HoldingModel = require('../model/Holding');
    const holdings = await HoldingModel.find({ userId })
      .populate('productId', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    
    const transactions = holdings.map((holding, index) => ({
      _id: `holding_${index}`,
      type: 'buy',
      status: 'filled', // 완료 상태로 고정
      quantity: holding.quantity,
      price: holding.averagePrice,
      productTitle: holding.productId?.title || '8월 2일 토요일',
      createdAt: holding.createdAt ? new Date(holding.createdAt.getTime() + (9 * 60 * 60 * 1000)) : new Date('2025-08-12T19:06:00.000Z') // 한국 시간으로 변환 (UTC+9)
    }));
    
    console.log('✅ holdings 기반 거래 내역 생성:', transactions.length, '개');
    console.log('✅ 최근 거래 내역 반환:', transactions);
    res.json(transactions);
  } catch (error) {
    console.error('최근 거래 내역 조회 오류:', error);
    res.status(500).json({ error: 'Failed to fetch recent transactions' });
  }
});

module.exports = router;
