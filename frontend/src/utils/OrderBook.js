// src/utils/OrderBook.js
export default class OrderBook {
  constructor() {
    this.bids = []; // [{ price, remaining, orderId, ... }]
    this.asks = [];
  }

  // 서버에서 내려주는 전체 북 레벨로 덮어쓰기
  setBook({ buyOrders, sellOrders }) {
    this.bids = buyOrders
       .map(o => ({
        ...o,
        remaining: o.remaining ?? (o.quantity - (o.filled || 0)),
      }))
      .sort((a, b) => b.price - a.price);
    this.asks = sellOrders
      .map(o => ({
        ...o,
        remaining: o.remaining ?? (o.quantity - (o.filled || 0)),
      }))
      .sort((a, b) => a.price - b.price);
  }

  // 단일 주문 추가 (매수/매도 공통으로)
  addOrder({ side, price, quantity, orderId }) {
    const order = { price, remaining: quantity, orderId, timestamp: Date.now() };
    if (side === "buy") {
      this.bids.push(order);
      this.bids.sort((a, b) => b.price - a.price);
    } else {
      this.asks.push(order);
      this.asks.sort((a, b) => a.price - b.price);
    }
  }

  // 내부 초기화가 필요하면
  clear() {
    this.bids = [];
    this.asks = [];
  }
}
