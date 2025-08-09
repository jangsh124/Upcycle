// ── backend/controllers/orderController.js ──
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
        // 보유 수량 및 이미 등록된 미체결 매도 주문 합계 확인
        const holding = await Holding.findOne({ userId, productId });
        const ownedQuantity = holding?.quantity || 0;
        const openSells = await Order.aggregate([
          { $match: { userId: Order.db.castObjectId(userId), productId: Order.db.castObjectId(productId), type: 'sell', remainingQuantity: { $gt: 0 } } },
          { $group: { _id: null, total: { $sum: '$remainingQuantity' } } }
        ]);
        const alreadyListed = openSells?.[0]?.total || 0;
        const availableToSell = Math.max(0, ownedQuantity - alreadyListed);
        if (quantity > availableToSell) {
          return res.status(400).json({ 
            error: `보유 지분 ${ownedQuantity}개 중 이미 판매 등록 ${alreadyListed}개가 있어, 추가로 ${availableToSell}개까지만 매도 등록 가능합니다.`
          });
        }
      } catch (error) {
        console.error('❌ 상품 정보 조회 실패:', error);
        return res.status(500).json({ error: '상품 정보 조회 실패' });
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
