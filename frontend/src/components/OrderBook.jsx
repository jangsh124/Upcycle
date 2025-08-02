// ── src/components/OrderBook.jsx ──
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./OrderBook.css";

export default function OrderBook({ productId, product }) {
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [], spread: null, midPrice: null });
  const [orderForm, setOrderForm] = useState({ side: "buy", price: "", quantity: "", total: 0 });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [quantityError, setQuantityError] = useState("");

  // 🆕 현재 상품의 정보를 매도 호가로 변환
  const fetchOrderBook = useCallback(async () => {
    if (!product) {
      console.log("No product data available");
      return;
    }

    try {
      const price = product.unitPrice || product.tokenPrice || product.price || 0;
      const quantity = product.shareQuantity || product.tokenSupply || product.tokenCount || 0;
      
      console.log("Product data for order book:", { price, quantity, product });
      
      let asks = [];
      if (price > 0 && quantity > 0) {
        asks = [{ price, quantity, coinName: product.title || `코인_${price}` }];
      }
      
      const bids = []; // 매수 호가는 실제 주문이 있을 때만 표시
      
      setOrderBookData({ bids, asks, spread: null, midPrice: asks.length > 0 ? asks[0].price : null });
      
      // 물량 바 너비 계산
      calculateVolumeBars(asks, bids);
    } catch (error) {
      console.error("Error fetching order book:", error);
      setOrderBookData({ bids: [], asks: [], spread: null, midPrice: null });
    }
  }, [product]);

  // 물량 바 너비 계산 함수
  const calculateVolumeBars = (asks, bids) => {
    const maxAskQuantity = asks.length > 0 ? Math.max(...asks.map(ask => ask.quantity)) : 0;
    const maxBidQuantity = bids.length > 0 ? Math.max(...bids.map(bid => bid.quantity)) : 0;
    const maxQuantity = Math.max(maxAskQuantity, maxBidQuantity);
    
    // CSS 변수 설정을 위한 스타일 업데이트
    const style = document.documentElement.style;
    
    // 매도 호가 바 너비 설정
    asks.forEach((ask, index) => {
      const width = maxQuantity > 0 ? (ask.quantity / maxQuantity) * 100 : 0;
      style.setProperty(`--ask-width-${index}`, `${width}%`);
    });
    
    // 매수 호가 바 너비 설정
    bids.forEach((bid, index) => {
      const width = maxQuantity > 0 ? (bid.quantity / maxQuantity) * 100 : 0;
      style.setProperty(`--bid-width-${index}`, `${width}%`);
    });
  };

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

    // 🆕 매수 주문 시 가격과 수량 제한 검증
    if (orderForm.side === 'buy') {
      const buyPrice = parseFloat(orderForm.price);
      const buyQuantity = parseInt(orderForm.quantity);
      
      // 현재 상품의 매도 호가 확인
      if (orderBookData.asks.length === 0) {
        alert("현재 매도 호가가 없습니다.");
        return;
      }
      
      const currentAsk = orderBookData.asks[0];
      
      // 판매자가 설정한 가격과 수량 제한 확인
      if (buyPrice !== currentAsk.price) {
        alert(`판매자가 설정한 가격(${currentAsk.price.toLocaleString()}원)으로만 구매할 수 있습니다.`);
        return;
      }
      
      if (buyQuantity > currentAsk.quantity) {
        alert(`판매자가 설정한 수량(${currentAsk.quantity}개)을 초과하여 구매할 수 없습니다.`);
        return;
      }
    }

    // 🆕 매도 주문 시 가격 제한 검증 (구매자 재판매)
    if (orderForm.side === 'sell') {
      const sellPrice = parseFloat(orderForm.price);
      
      // 현재 상품의 원래 매도 가격 확인
      if (orderBookData.asks.length === 0) {
        alert("현재 매도 호가가 없습니다.");
        return;
      }
      
      const originalPrice = orderBookData.asks[0].price;
      const minSellPrice = originalPrice * 0.98; // 원래 가격의 -2%
      
      if (sellPrice < minSellPrice) {
        alert(`원래 구매가격(${originalPrice.toLocaleString()}원)의 최대 -2%인 ${minSellPrice.toLocaleString()}원까지만 판매할 수 있습니다.`);
        return;
      }
      
      if (sellPrice > originalPrice) {
        alert(`원래 구매가격(${originalPrice.toLocaleString()}원)보다 높은 가격으로는 판매할 수 없습니다.`);
        return;
      }
    }

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
    }
  };

  const handleQuantityChange = (quantity) => {
    const total = parseFloat(orderForm.price) * parseFloat(quantity);
    setOrderForm(prev => ({ ...prev, quantity, total }));
    
    // 🆕 실시간 수량 검증
    const error = validateQuantity(quantity);
    setQuantityError(error);
  };

  const handlePriceChange = (price) => {
    const total = parseFloat(price) * parseFloat(orderForm.quantity);
    setOrderForm(prev => ({ ...prev, price, total }));
    
    // 🆕 실시간 가격 검증
    const error = validatePrice(price);
    setPriceError(error);
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

  // 🆕 실시간 가격 검증
  const validatePrice = (price) => {
    if (!price || !orderBookData.asks.length) return "";
    
    const inputPrice = parseFloat(price);
    const originalPrice = orderBookData.asks[0].price;
    
    if (orderForm.side === 'buy') {
      if (inputPrice !== originalPrice) {
        return `판매자 설정가(${originalPrice.toLocaleString()}원)로만 구매 가능합니다`;
      }
    } else if (orderForm.side === 'sell') {
      const minPrice = originalPrice * 0.98;
      if (inputPrice < minPrice) {
        return `재판매 최저가(${minPrice.toLocaleString()}원) 이상으로 설정하세요`;
      }
      if (inputPrice > originalPrice) {
        return `원래 가격(${originalPrice.toLocaleString()}원) 이하로 설정하세요`;
      }
    }
    
    return "";
  };

  // 🆕 실시간 수량 검증
  const validateQuantity = (quantity) => {
    if (!quantity || !orderBookData.asks.length) return "";
    
    const inputQuantity = parseInt(quantity);
    const maxQuantity = orderBookData.asks[0].quantity;
    
    if (orderForm.side === 'buy') {
      if (inputQuantity > maxQuantity) {
        return `판매자 설정수량(${maxQuantity.toLocaleString()}개)을 초과할 수 없습니다`;
      }
    }
    
    return "";
  };

  return (
    <div className="order-book-container">
      <div className="order-book-header">
        <h2>호가창</h2>
        <div className="auto-refresh">
          <input
            type="checkbox"
            id="autoRefresh"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
          />
          <label htmlFor="autoRefresh">자동 새로고침</label>
        </div>
      </div>

      {/* 통합 호가창 */}
      <div className="unified-order-book">
        <div className="order-book-header-row">
          <div className="bid-header">매수수량</div>
          <div className="price-header">가격</div>
          <div className="ask-header">매도수량</div>
        </div>
        
        <div className="order-book-body">
          {/* 매도 호가 (위쪽부터) */}
          {orderBookData.asks.slice().reverse().map((ask, index) => (
            <div 
              key={`ask-${index}`} 
              className="order-row ask-row"
              style={{ '--ask-width': `var(--ask-width-${orderBookData.asks.length - 1 - index}, 0%)` }}
            >
              <div className="bid-quantity"></div>
              <div className="price ask-price">{formatPrice(ask.price)}</div>
              <div className="ask-quantity">{formatNumber(ask.quantity)}</div>
            </div>
          ))}
          
          {/* 현재가격 라인 */}
          {orderBookData.asks.length > 0 && (
            <div className="current-price-row">
              <div className="bid-quantity"></div>
              <div className="current-price">{formatPrice(orderBookData.asks[0].price)}</div>
              <div className="ask-quantity"></div>
            </div>
          )}
          
          {/* 매수 호가 (아래쪽부터) */}
          {orderBookData.bids.map((bid, index) => (
            <div 
              key={`bid-${index}`} 
              className="order-row bid-row"
              style={{ '--bid-width': `var(--bid-width-${index}, 0%)` }}
            >
              <div className="bid-quantity">{formatNumber(bid.quantity)}</div>
              <div className="price bid-price">{formatPrice(bid.price)}</div>
              <div className="ask-quantity"></div>
            </div>
          ))}
          
          {/* 매수 호가가 없을 때 */}
          {orderBookData.bids.length === 0 && (
            <div className="order-row empty-row">
              <div className="bid-quantity">매수 호가 없음</div>
              <div className="price"></div>
              <div className="ask-quantity"></div>
            </div>
          )}
        </div>
      </div>

      {/* 가격 제한 정보 */}
      {orderBookData.asks.length > 0 && (
        <div className="price-limit-info">
          <div className="limit-item">
            <span>판매자 설정가:</span>
            <span className="original-price">{formatPrice(orderBookData.asks[0].price)}원</span>
          </div>
          <div className="limit-item">
            <span>판매자 설정수량:</span>
            <span className="original-quantity">{formatNumber(orderBookData.asks[0].quantity)}개</span>
          </div>
          <div className="limit-item">
            <span>재판매 최저가:</span>
            <span className="min-sell-price">{formatPrice(orderBookData.asks[0].price * 0.98)}원</span>
          </div>
        </div>
      )}

      {/* 주문 폼 */}
      <div className="order-form">
        <h3>주문하기</h3>
        <div className="form-group">
          <label>주문 유형:</label>
          <div className="order-type-buttons">
            <button
              className={`order-type-btn ${orderForm.side === 'buy' ? 'active' : ''}`}
              onClick={() => {
                setOrderForm(prev => ({ ...prev, side: 'buy' }));
                setPriceError(validatePrice(orderForm.price));
                setQuantityError(validateQuantity(orderForm.quantity));
              }}
            >
              매수
            </button>
            <button
              className={`order-type-btn ${orderForm.side === 'sell' ? 'active' : ''}`}
              onClick={() => {
                setOrderForm(prev => ({ ...prev, side: 'sell' }));
                setPriceError(validatePrice(orderForm.price));
                setQuantityError(validateQuantity(orderForm.quantity));
              }}
            >
              매도
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>가격:</label>
          <input
            type="number"
            value={orderForm.price}
            onChange={(e) => handlePriceChange(e.target.value)}
            placeholder="가격을 입력하세요"
            className={priceError ? "error-input" : ""}
          />
          {priceError && <div className="error-message">{priceError}</div>}
        </div>

        <div className="form-group">
          <label>수량:</label>
          <input
            type="number"
            value={orderForm.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="수량을 입력하세요"
            className={quantityError ? "error-input" : ""}
          />
          {quantityError && <div className="error-message">{quantityError}</div>}
        </div>

        <div className="form-group">
          <label>총액:</label>
          <div className="total-amount">{isNaN(orderForm.total) ? '0' : orderForm.total.toLocaleString()}원</div>
        </div>

        <button className="place-order-btn" onClick={placeOrder}>
          주문하기
        </button>
      </div>
    </div>
  );
}
