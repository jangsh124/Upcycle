// ── src/components/OrderBook.jsx ──
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "./OrderBook.css";

export default function OrderBook({ productId, product }) {
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [], spread: null, midPrice: null });
  const [orderForm, setOrderForm] = useState({ side: "buy", price: "", quantity: "", total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [quantityError, setQuantityError] = useState("");

  // 🆕 현재 상품의 정보를 매도 호가로 변환
  const fetchOrderBook = useCallback(async () => {
    try {
      // 현재 상품 정보가 없으면 빈 호가창 표시
      if (!product) {
        setOrderBookData({ bids: [], asks: [], spread: null, midPrice: null });
        return;
      }

      console.log('📦 현재 상품 정보:', product);
      
      // 현재 상품의 가격과 수량을 매도 호가로 변환
      const price = product.unitPrice || product.tokenPrice || product.price || 0;
      const quantity = product.shareQuantity || product.tokenSupply || product.tokenCount || 0;
      
      console.log(`🔍 상품 처리: ${product.title} - 가격: ${price}, 수량: ${quantity}`);
      
      let asks = [];
      if (price > 0 && quantity > 0) {
        asks = [{
          price,
          quantity,
          coinName: product.title || `코인_${price}`
        }];
        console.log(`✅ 매도 호가 생성: ${product.title} - ${price}원 x ${quantity}개`);
      } else {
        console.log(`❌ 유효하지 않은 상품: ${product.title} - 가격: ${price}, 수량: ${quantity}`);
      }
      
      // 매수 호가는 빈 배열로 설정 (실제 매수 주문이 있을 때만 표시)
      const bids = [];
      
      // 스프레드와 중간가격 계산
      const spread = null;
      const midPrice = asks.length > 0 ? asks[0].price : null;
      
      setOrderBookData({ bids, asks, spread, midPrice });
      
      console.log('🔄 오더북 데이터 업데이트:', {
        asks: asks.map(ask => `${ask.coinName} | ${ask.price}원 | ${ask.quantity}개`),
        totalAsks: asks.length
      });
      
    } catch (error) {
      console.error("오더북 데이터 가져오기 실패:", error);
      setOrderBookData({ bids: [], asks: [], spread: null, midPrice: null });
    }
  }, [product]);

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
            <span>코인명</span>
            <span>가격</span>
            <span>수량</span>
          </div>
          <div className="order-levels">
            {orderBookData.bids.map((bid, index) => (
              <div 
                key={`bid-${index}`} 
                className="order-level bid-level"
                onClick={() => handlePriceClick(bid.price, bid.quantity, 'buy')}
              >
                <span className="level-coin-name">{bid.coinName || '매수주문'}</span>
                <span className="level-price">{formatPrice(bid.price)}</span>
                <span className="level-quantity">{formatNumber(bid.quantity)}</span>
              </div>
            ))}
            {orderBookData.bids.length === 0 && (
              <div className="no-orders">
                <span>매수 호가가 없습니다</span>
              </div>
            )}
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
            <span>코인명</span>
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
                <span className="level-coin-name">{ask.coinName}</span>
                <span className="level-price">{formatPrice(ask.price)}</span>
                <span className="level-quantity">{formatNumber(ask.quantity)}</span>
              </div>
            ))}
            {orderBookData.asks.length === 0 && (
              <div className="no-orders">
                <span>매도 호가가 없습니다</span>
              </div>
            )}
          </div>
          {/* 🆕 가격 제한 정보 표시 */}
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
              onClick={() => {
                setOrderForm(prev => ({ ...prev, side: 'buy' }));
                // 🆕 주문 유형 변경 시 검증 다시 실행
                if (orderForm.price) {
                  const error = validatePrice(orderForm.price);
                  setPriceError(error);
                }
                if (orderForm.quantity) {
                  const error = validateQuantity(orderForm.quantity);
                  setQuantityError(error);
                }
              }}
            >
              매수
            </button>
            <button
              type="button"
              className={orderForm.side === 'sell' ? 'active' : ''}
              onClick={() => {
                setOrderForm(prev => ({ ...prev, side: 'sell' }));
                // 🆕 주문 유형 변경 시 검증 다시 실행
                if (orderForm.price) {
                  const error = validatePrice(orderForm.price);
                  setPriceError(error);
                }
                if (orderForm.quantity) {
                  const error = validateQuantity(orderForm.quantity);
                  setQuantityError(error);
                }
              }}
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
            className={priceError ? "error-input" : ""}
          />
        </div>
        {priceError && (
          <div className="error-message">
            {priceError}
          </div>
        )}
        
        <div className="form-row">
          <label>수량:</label>
          <input
            type="number"
            value={orderForm.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="수량을 입력하세요"
            min="1"
            className={quantityError ? "error-input" : ""}
          />
        </div>
        {quantityError && (
          <div className="error-message">
            {quantityError}
          </div>
        )}
        
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
