export default class OrderBook {
  constructor() {
    // Orders on the bid side sorted from highest to lowest price
    this.bids = [];
    // Orders on the ask side sorted from lowest to highest price
    this.asks = [];
  }

  addBid(order) {
    this.bids.push(order);
    this.bids.sort((a, b) => b.price - a.price);
  }

  addAsk(order) {
    this.asks.push(order);
    this.asks.sort((a, b) => a.price - b.price);
  }
}