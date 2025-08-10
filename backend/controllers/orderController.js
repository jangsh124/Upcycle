// ── backend/controllers/orderController.js ──
const mongoose  = require('mongoose');
const OrderBook = require('../services/orderBook');
const Order     = require('../model/Order');
const Product   = require('../model/Product');
const Holding   = require('../model/Holding');

// 주문장 조회: 메모리북에서 가져와 JSON 반환
exports.getBook = async (req, res) => {
  try {
    const { productId } = req.params;
    const book = await OrderBook.getBook(productId);
    return res.json(book);
  } catch (error) {
    console.error('getBook error:', error);
    return res.status(500).json({ error: 'Failed to get order book' });
  }
};

// 사용자의 특정 상품에 대한 미체결 매도 합계 조회
exports.getOpenSellSummary = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const docs = await Order.find({
      userId,
      productId,
      type: 'sell',
      remainingQuantity: { $gt: 0 }
    }).select('remainingQuantity').lean();

    const openSellQuantity = docs.reduce((sum, d) => sum + (d.remainingQuantity || 0), 0);

    // 보유 지분도 함께 반환하면 프론트가 추가 요청 없이 계산 가능
    const holding = await Holding.findOne({ userId, productId }).select('quantity').lean();
    const totalHolding = holding?.quantity || 0;
    const availableToSell = Math.max(0, totalHolding - openSellQuantity);

    return res.json({ openSellQuantity, totalHolding, availableToSell });
  } catch (error) {
    console.error('getOpenSellSummary error:', error);
    return res.status(500).json({ error: 'Failed to fetch open sell summary' });
  }
};

// 사용자의 미체결 매도 주문 목록 반환
exports.getOpenSellList = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const items = await Order.find({
      userId,
      productId,
      type: 'sell',
      remainingQuantity: { $gt: 0 },
      status: { $in: ['open', 'partial'] }
    })
      .select('orderId price remainingQuantity createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ items });
  } catch (error) {
    console.error('getOpenSellList error:', error);
    return res.status(500).json({ error: 'Failed to fetch open sell list' });
  }
};

// 주문 취소(매도): 남은 수량이 있는 경우에 한해 소거. 동시 체결과 경합 시 안전하게 실패 처리
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    // 대상 주문 조회
    const order = await Order.findOne({ orderId, userId, type: 'sell' });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.remainingQuantity <= 0 || order.status === 'filled') {
      return res.status(400).json({ error: 'Nothing to cancel' });
    }

    // processing 상태에서는 취소 불가
    if (order.status === 'processing') {
      return res.status(400).json({ 
        error: '결제 진행 중인 주문은 취소할 수 없습니다. 결제를 완료하거나 취소 후 다시 시도해주세요.' 
      });
    }

    // 경쟁 상태를 피하기 위해 남은 수량이 그대로일 때만 취소되도록 조건부 업데이트
    const prevRemaining = order.remainingQuantity;
    const updated = await Order.findOneAndUpdate(
      {
        orderId,
        userId,
        type: 'sell',
        status: { $in: ['open', 'partial'] },
        remainingQuantity: prevRemaining
      },
      { $set: { status: 'cancelled', remainingQuantity: 0 } },
      { new: true }
    );

    if (!updated) {
      return res.status(409).json({ error: 'Cancel failed due to concurrent match. Try again.' });
    }

    // 메모리 오더북에서도 제거
    try {
      await OrderBook.cancelOrder(order.productId.toString(), orderId);
    } catch (e) {
      console.warn('OrderBook.cancelOrder warning:', e.message);
    }

    return res.json({ success: true, cancelledOrderId: orderId });
  } catch (error) {
    console.error('cancelOrder error:', error);
    return res.status(500).json({ error: 'Failed to cancel order' });
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

    // 판매 주문인 경우 판매자 설정 가격 이하로 판매 불가
    if (side === 'sell') {
      // 최소 가격 강제 (서버 신뢰)
      if (price < 100) {
        return res.status(400).json({ error: '매도 가격은 100원 이상이어야 합니다' });
      }

      try {
        const product = await Product.findById(productId);
        if (product && product.sharePercentage > 0) {
          const totalSaleAmount = product.price * (product.sharePercentage / 100);
          const unitCount = Math.round(product.sharePercentage * 1000); // 0.001% 단위
          const unitPrice = unitCount > 0 ? Math.round(totalSaleAmount / unitCount) : 0;
          
          if (unitPrice > 0 && price < unitPrice) {
            return res.status(400).json({ 
              error: `판매 가격은 ${unitPrice}원 이상이어야 합니다. 현재 가격: ${price}원` 
            });
          }
        }
        // 보유 수량 및 이미 등록된 미체결 매도 주문 합계 확인 (안전한 방식)
        const holding = await Holding.findOne({ userId, productId });
        const ownedQuantity = holding?.quantity || 0;
        const openSellDocs = await Order.find({
          userId,
          productId,
          type: 'sell',
          remainingQuantity: { $gt: 0 }
        }).select('remainingQuantity').lean();
        const alreadyListed = openSellDocs.reduce((sum, doc) => sum + (doc.remainingQuantity || 0), 0);
        const availableToSell = Math.max(0, ownedQuantity - alreadyListed);
        if (quantity > availableToSell) {
          return res.status(400).json({ 
            error: `보유 지분 ${ownedQuantity}개 중 이미 판매 등록 ${alreadyListed}개가 있어, 추가로 ${availableToSell}개까지만 매도 등록 가능합니다.`
          });
        }
      } catch (error) {
        console.error('❌ 매도 검증 실패:', error);
        return res.status(500).json({ error: '매도 검증 실패' });
      }
    }

    // 결제/수수료 재계산 (서버 신뢰)
    const subtotal = Math.round(price * quantity);
    const platformFeeRate = 0.01; // 1%
    const platformFee = Math.max(1, Math.ceil(subtotal * platformFeeRate));
    const platformFeeVatRate = 0.1; // 10%
    const platformFeeVat = Math.ceil(platformFee * platformFeeVatRate);
    const totalAmount = subtotal + platformFee + platformFeeVat;

    // 1) DB에 저장
    const order = await Order.create({
      orderId,
      userId,
      productId,
      type: side,
      price,
      quantity,
      remainingQuantity: quantity,
      status: 'open',
      currency: 'KRW',
      subtotal,
      platformFeeRate,
      platformFee,
      platformFeeVatRate,
      platformFeeVat,
      totalAmount
    });

    console.log(`✅ DB 저장 완료: 주문ID ${orderId}`);

    // 2) 메모리북에 추가 (매칭 로직 포함)
    const matches = await OrderBook.addOrder({ productId, side, price, quantity, orderId, userId });

    console.log(`✅ 매칭 완료: ${matches.length}건 체결`);

    // 3) 응답 데이터 구성
    const response = {
      success: true,
      message: 'Order placed successfully',
      orderId,
      matches: matches.length,
      orderBook: OrderBook.getBook(productId),
      amounts: { subtotal, platformFee, platformFeeVat, totalAmount }
    };

    return res.status(201).json(response);
  } catch (err) {
    console.error('OrderController.addOrder error:', err);
    return res.status(500).json({ error: 'Failed to place order' });
  }
};

// 주문을 처리 중 상태로 변경 (결제 페이지 진입 시)
const setOrderProcessing = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;

    console.log(`🔄 주문 처리 중 상태 변경 요청: ${orderId}`);

    // 주문 조회 및 권한 확인
    const order = await Order.findOne({ orderId, userId });
    if (!order) {
      return res.status(404).json({ error: '주문을 찾을 수 없습니다' });
    }

    // 상태 변경 가능 여부 확인
    if (order.status !== 'open') {
      return res.status(400).json({ 
        error: `현재 상태(${order.status})에서는 처리 중으로 변경할 수 없습니다` 
      });
    }

    // 처리 중 상태로 변경
    order.status = 'processing';
    await order.save();

    console.log(`✅ 주문 처리 중 상태 변경 완료: ${orderId}`);

    return res.status(200).json({ 
      success: true, 
      message: '주문이 처리 중 상태로 변경되었습니다',
      orderId,
      status: 'processing'
    });

  } catch (error) {
    console.error('❌ 주문 처리 중 상태 변경 실패:', error);
    return res.status(500).json({ error: '주문 상태 변경에 실패했습니다' });
  }
};

module.exports = {
  getBook: exports.getBook,
  addOrder: exports.addOrder,
  getOpenSellSummary: exports.getOpenSellSummary,
  getOpenSellList: exports.getOpenSellList,
  cancelOrder: exports.cancelOrder,
  setOrderProcessing
};
