// ── backend/controllers/orderController.js ──
const OrderBook = require('../services/orderBook');
const Order     = require('../model/Order');

// 주문장 조회: 메모리북에서 가져와 JSON 반환
exports.getBook = (req, res) => {
  try {
    const { productId } = req.params;
    const book = OrderBook.getBook(productId);
    return res.json(book);
  } catch (error) {
    console.error('getBook error:', error);
    return res.status(500).json({ error: 'Failed to get order book' });
  }
};

// 주문 추가: 메모리북에 넣고 DB에도 기록
exports.addOrder = async (req, res) => {
  try {
    const { productId, type: side, price, quantity } = req.body;
    const userId = req.user.id;
    const orderId = Date.now().toString(); // 간단 고유 ID

    console.log(`📋 새 주문 요청: ${side} ${price}원 x ${quantity}개 (사용자: ${userId})`);

    // 입력값 검증
    if (!productId || !side || !price || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (side !== 'buy' && side !== 'sell') {
      return res.status(400).json({ error: 'Invalid order type' });
    }

    if (price <= 0 || quantity <= 0) {
      return res.status(400).json({ error: 'Price and quantity must be positive' });
    }

    // 1) DB에 저장
    const order = await Order.create({
      orderId,
      userId,
      productId,
      type: side,
      price,
      quantity,
      remainingQuantity: quantity,
      status: 'open'
    });

    console.log(`✅ DB 저장 완료: 주문ID ${orderId}`);

    // 2) 메모리북에 추가 (매칭 로직 포함)
    const matches = await OrderBook.addOrder({ productId, side, price, quantity, orderId });

    console.log(`✅ 매칭 완료: ${matches.length}건 체결`);

    // 3) 응답 데이터 구성
    const response = {
      message: 'Order placed successfully',
      orderId,
      matches: matches.length,
      orderBook: OrderBook.getBook(productId)
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error('OrderController.addOrder error:', err);
    return res.status(500).json({ error: 'Failed to place order' });
  }
};
