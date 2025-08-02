// ── backend/services/orderBook.js ──
const OrderModel = require('../model/Order');

class OrderBook {
  constructor() {
    this.books = {}; // productId → { bids: [], asks: [] }
  }

  _initBook(productId) {
    if (!this.books[productId]) {
      this.books[productId] = { bids: [], asks: [] };
    }
    return this.books[productId];
  }

  // ① 주문 추가: 매칭 로직까지 async/await 처리
  async addOrder({ productId, side, price, quantity, orderId }) {
    console.log(`📝 주문 추가: ${side} ${price}원 x ${quantity}개 (주문ID: ${orderId})`);
    
    const { bids, asks } = this._initBook(productId);
    const list = side === 'buy' ? bids : asks;
    
    // 새 주문 추가
    const newOrder = { 
      price, 
      quantity, 
      filled: 0, 
      orderId, 
      timestamp: Date.now(),
      side 
    };
    list.push(newOrder);
    
    console.log(`✅ 주문 추가 완료: ${side} ${price}원 x ${quantity}개`);
    
    // 체결 시도
    const matches = await this.matchOrders(productId);
    return matches;
  }

  // ② 매칭 로직: 체결 시 DB 남은 수량·상태 업데이트
  async matchOrders(productId) {
    const book = this.books[productId];
    if (!book) return [];

    const { bids, asks } = book;
    const matches = []; // 체결 내역 저장
    
    // 가격–시간 우선순위 정렬
    bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);

    console.log(`🔄 매칭 시작: 매수 ${bids.length}개, 매도 ${asks.length}개`);

    // 체결 루프
    while (bids.length && asks.length && bids[0].price >= asks[0].price) {
      const bid = bids[0];
      const ask = asks[0];
      const execQty = Math.min(bid.quantity - bid.filled, ask.quantity - ask.filled);
      const execPrice = ask.price; // 매도가 기준으로 체결

      console.log(`💥 체결: ${execPrice}원 x ${execQty}개 (매수: ${bid.orderId}, 매도: ${ask.orderId})`);

      // 체결 내역 저장
      matches.push({
        price: execPrice,
        quantity: execQty,
        buyOrderId: bid.orderId,
        sellOrderId: ask.orderId,
        timestamp: Date.now()
      });

      // 메모리북 상태 업데이트
      bid.filled += execQty;
      ask.filled += execQty;

      // DB 업데이트: 남은 수량 차감, 상태 변경
      try {
        await OrderModel.findOneAndUpdate(
          { orderId: bid.orderId },
          {
            $inc: { remainingQuantity: -execQty },
            $set: { status: bid.filled >= bid.quantity ? 'filled' : 'partial' }
          }
        );
        await OrderModel.findOneAndUpdate(
          { orderId: ask.orderId },
          {
            $inc: { remainingQuantity: -execQty },
            $set: { status: ask.filled >= ask.quantity ? 'filled' : 'partial' }
          }
        );
      } catch (error) {
        console.error(`❌ DB 업데이트 실패: ${error.message}`);
      }

      // 완전 체결된 주문은 메모리북에서 제거
      if (bid.filled >= bid.quantity) {
        console.log(`✅ 매수 주문 완전 체결: ${bid.orderId}`);
        bids.shift();
      }
      if (ask.filled >= ask.quantity) {
        console.log(`✅ 매도 주문 완전 체결: ${ask.orderId}`);
        asks.shift();
      }
    }

    console.log(`📊 매칭 완료: ${matches.length}건 체결`);
    return matches;
  }

  // ③ 주문장 조회: 남은 수량 포함해 반환
  getBook(productId) {
    const { bids = [], asks = [] } = this.books[productId] || {};
    
    // 가격별로 수량 집계
    const bidMap = new Map();
    const askMap = new Map();
    
    bids.forEach(order => {
      const remaining = order.quantity - order.filled;
      if (remaining > 0) {
        bidMap.set(order.price, (bidMap.get(order.price) || 0) + remaining);
      }
    });
    
    asks.forEach(order => {
      const remaining = order.quantity - order.filled;
      if (remaining > 0) {
        askMap.set(order.price, (askMap.get(order.price) || 0) + remaining);
      }
    });
    
    return {
      bids: Array.from(bidMap.entries())
        .sort(([a], [b]) => b - a) // 매수는 높은 가격부터
        .map(([price, quantity]) => ({ price, quantity })),
      asks: Array.from(askMap.entries())
        .sort(([a], [b]) => a - b) // 매도는 낮은 가격부터
        .map(([price, quantity]) => ({ price, quantity }))
    };
  }

  // ④ 주문 취소
  async cancelOrder(productId, orderId) {
    const book = this.books[productId];
    if (!book) return false;

    const { bids, asks } = book;
    
    // 매수 주문에서 찾기
    let orderIndex = bids.findIndex(o => o.orderId === orderId);
    let order = bids[orderIndex];
    
    if (orderIndex === -1) {
      // 매도 주문에서 찾기
      orderIndex = asks.findIndex(o => o.orderId === orderId);
      order = asks[orderIndex];
    }
    
    if (orderIndex === -1) {
      console.log(`❌ 주문을 찾을 수 없음: ${orderId}`);
      return false;
    }

    // 주문 제거
    const list = order.side === 'buy' ? bids : asks;
    list.splice(orderIndex, 1);
    
    console.log(`✅ 주문 취소 완료: ${orderId}`);
    return true;
  }
}

module.exports = new OrderBook();
