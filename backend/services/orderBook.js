// ── backend/services/orderBook.js ──
const OrderModel = require('../models/Order');

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
    const { bids, asks } = this._initBook(productId);
    const list = side === 'buy' ? bids : asks;
    list.push({ price, quantity, filled: 0, orderId, timestamp: Date.now() });
    // 체결 시도
    await this.matchOrders(productId);
  }

  // ② 매칭 로직: 체결 시 DB 남은 수량·상태 업데이트
  async matchOrders(productId) {
    const book = this.books[productId];
    if (!book) return;

    const { bids, asks } = book;
    // 가격–시간 우선순위 정렬
    bids.sort((a, b) => b.price - a.price || a.timestamp - b.timestamp);
    asks.sort((a, b) => a.price - b.price || a.timestamp - b.timestamp);

    // 체결 루프
    while (bids.length && asks.length && bids[0].price >= asks[0].price) {
      const bid = bids[0];
      const ask = asks[0];
      const execQty = Math.min(bid.quantity - bid.filled, ask.quantity - ask.filled);

      // 메모리북 상태 업데이트
      bid.filled += execQty;
      ask.filled += execQty;

      // DB 업데이트: 남은 수량 차감, 상태 변경
      await OrderModel.findOneAndUpdate(
        { orderId: bid.orderId },
        {
          $inc: { remainingQuantity: -execQty },
          $set: { status: bid.filled >= bid.quantity ? 'filled' : 'open' }
        }
      );
      await OrderModel.findOneAndUpdate(
        { orderId: ask.orderId },
        {
          $inc: { remainingQuantity: -execQty },
          $set: { status: ask.filled >= ask.quantity ? 'filled' : 'open' }
        }
      );

      // 완전 체결된 주문은 메모리북에서 제거
      if (bid.filled >= bid.quantity) bids.shift();
      if (ask.filled >= ask.quantity) asks.shift();
    }
  }

  // ③ 주문장 조회: 남은 수량 포함해 반환
  getBook(productId) {
    const { bids = [], asks = [] } = this.books[productId] || {};
    return {
      buyOrders: bids.map(o => ({
        price: o.price,
        remaining: o.quantity - o.filled,
        orderId: o.orderId
      })),
      sellOrders: asks.map(o => ({
        price: o.price,
        remaining: o.quantity - o.filled,
        orderId: o.orderId
      }))
    };
  }
}

module.exports = new OrderBook();
