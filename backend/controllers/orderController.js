// ── backend/controllers/orderController.js ──
const OrderBook = require('../services/orderBook');
const Order     = require('../model/Order');

// 주문장 조회: 메모리북에서 가져와 JSON 반환
exports.getBook = (req, res) => {
  const { productId } = req.params;
  const book = OrderBook.getBook(productId);
  return res.json(book);
};

// 주문 추가: 메모리북에 넣고 DB에도 기록
exports.addOrder = async (req, res) => {
  try {
    const { productId, type: side, price, quantity } = req.body;
    const userId = req.user.id;
    const orderId = Date.now().toString(); // 간단 고유 ID

     // 1) DB에 저장 후 실제 레코드 기반으로 매칭 수행
    await Order.create({
      orderId,
      userId,
      productId,
      type: side,
      price,
      quantity,
      remainingQuantity: quantity,
      status: 'open'
    });

    // 2) 메모리북에 추가 (매칭 로직 포함)
    await OrderBook.addOrder({ productId, side, price, quantity, orderId });


    // 3) (선택) 실시간 업데이트: io.emit('orderbook:update', ...)
    // const io = req.app.get('io');
    // io.emit('orderbook:update', { productId, ...OrderBook.getBook(productId) });

    return res.status(201).json({ message: 'Order placed', orderId });
  } catch (err) {
    console.error('OrderController.addOrder error:', err);
    return res.status(500).json({ error: 'Failed to place order' });
  }
};
