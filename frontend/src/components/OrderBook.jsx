// ── src/components/OrderBook.jsx ──
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./OrderBook.css";

export default function OrderBook({ productId }) {
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [], spread: null, midPrice: null });
  const [orderForm, setOrderForm] = useState({ side: "buy", price: "", quantity: "", total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchOrderBook = useCallback(async () => {
    try {
      const response = await axios.get(`/api/orders/book/${productId}`);
      const { buyOrders, sellOrders } = response.data;
      
      // 가격별로 주문을 그룹화하고 수량을 합산
      const bidMap = new Map();
      const askMap = new Map();
      
      buyOrders.forEach(order => {
        const price = order.price;
        bidMap.set(price, (bidMap.get(price) || 0) + order.remaining);
      });
      
      sellOrders.forEach(order => {
        const price = order.price;
        askMap.set(price, (askMap.get(price) || 0) + order.remaining);
      });
      
      // 가격순으로 정렬
      const bids = Array.from(bidMap.entries())
        .sort(([a], [b]) => b - a) // 매수는 높은 가격부터
        .slice(0, 10)
        .map(([price, quantity]) => ({ price, quantity }));
      
      const asks = Array.from(askMap.entries())
        .sort(([a], [b]) => a - b) // 매도는 낮은 가격부터
        .slice(0, 10)
        .map(([price, quantity]) => ({ price, quantity }));
      
      // 스프레드와 중간가격 계산
      const spread = asks.length > 0 && bids.length > 0 ? asks[0].price - bids[0].price : null;
      const midPrice = asks.length > 0 && bids.length > 0 ? (asks[0].price + bids[0].price) / 2 : null;
      
      setOrderBookData({ bids, asks, spread, midPrice });
    } catch (error) {
      console.error("오더북 데이터 가져오기 실패:", error);
    }
  }, [productId]);

  useEffect(() => {
    fetchOrderBook();
    const interval = setInterval(fetchOrderBook, 2000);
    return () => clearInterval(interval);
  }, [fetchOrderBook]);

  const placeOrder = async () => {
    if (!orderForm.price || !orderForm.quantity) {
      alert("가격과 수량을 입력해주세요.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post("/api/orders", {
        productId,
        side: orderForm.side,
        price: parseFloat(orderForm.price),
        quantity: parseInt(orderForm.quantity)
      });
      
      setOrderForm({ side: "buy", price: "", quantity: "", total: 0 });
      fetchOrderBook();
      alert("주문이 성공적으로 등록되었습니다!");
    } catch (error) {
      console.error("주문 등록 실패:", error);
      alert("주문 등록에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceClick = (price, quantity, side) => {
    setOrderForm(prev => ({
      ...prev,
      side,
      price: price.toString(),
      quantity: quantity.toString(),
      total: price * quantity
    }));
  };

  const handleQuantityChange = (quantity) => {
    const total = parseFloat(orderForm.price) * parseFloat(quantity);
    setOrderForm(prev => ({ ...prev, quantity, total }));
  };

  const handlePriceChange = (price) => {
    const total = parseFloat(price) * parseFloat(orderForm.quantity);
    setOrderForm(prev => ({ ...prev, price, total }));
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('ko-KR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    }).format(price);
  };

  return (
    <div className="order-book-container">
      <div className="order-book-header">
        <h3>호가창</h3>
        <div className="order-book-controls">
          <label>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            자동 새로고침
          </label>
        </div>
      </div>

      <div className="order-book-content">
        {/* 왼쪽: 매수 호가 */}
        <div className="order-side buy-side">
          <div className="side-header">
            <span>수량</span>
            <span>가격</span>
          </div>
          <div className="order-levels">
            {orderBookData.bids.map((bid, index) => (
              <div 
                key={`bid-${index}`} 
                className="order-level bid-level"
                onClick={() => handlePriceClick(bid.price, bid.quantity, 'buy')}
              >
                <span className="level-quantity">{formatNumber(bid.quantity)}</span>
                <span className="level-price">{formatPrice(bid.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 중앙: 현재가/스프레드 */}
        <div className="order-center">
          {orderBookData.midPrice && (
            <div className="current-price">
              <div className="price-value">{formatPrice(orderBookData.midPrice)}</div>
              {orderBookData.spread && (
                <div className="spread">
                  스프레드: {formatPrice(orderBookData.spread)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 오른쪽: 매도 호가 */}
        <div className="order-side sell-side">
          <div className="side-header">
            <span>가격</span>
            <span>수량</span>
          </div>
          <div className="order-levels">
            {orderBookData.asks.map((ask, index) => (
              <div 
                key={`ask-${index}`} 
                className="order-level ask-level"
                onClick={() => handlePriceClick(ask.price, ask.quantity, 'sell')}
              >
                <span className="level-price">{formatPrice(ask.price)}</span>
                <span className="level-quantity">{formatNumber(ask.quantity)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 주문 폼 */}
      <div className="order-form">
        <h4>주문하기</h4>
        <div className="form-row">
          <label>주문 유형:</label>
          <div className="order-type-buttons">
            <button
              type="button"
              className={orderForm.side === 'buy' ? 'active' : ''}
              onClick={() => setOrderForm(prev => ({ ...prev, side: 'buy' }))}
            >
              매수
            </button>
            <button
              type="button"
              className={orderForm.side === 'sell' ? 'active' : ''}
              onClick={() => setOrderForm(prev => ({ ...prev, side: 'sell' }))}
            >
              매도
            </button>
          </div>
        </div>
        
        <div className="form-row">
          <label>가격:</label>
          <input
            type="number"
            value={orderForm.price}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="가격을 입력하세요"
            step="0.01"
            min="0"
          />
        </div>
        
        <div className="form-row">
          <label>수량:</label>
          <input
            type="number"
            value={orderForm.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="수량을 입력하세요"
            min="1"
          />
        </div>
        
        <div className="form-row">
          <label>총액:</label>
          <span className="total-amount">{formatNumber(orderForm.total)}원</span>
        </div>
        
        <button
          className="place-order-btn"
          onClick={placeOrder}
          disabled={isLoading}
        >
          {isLoading ? '주문 중...' : '주문하기'}
        </button>
      </div>
    </div>
  );
}
