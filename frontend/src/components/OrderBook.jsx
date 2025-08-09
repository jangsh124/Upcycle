// ── src/components/OrderBook.jsx ──
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderBook.css";

export default function OrderBook({ productId, product }) {
  const navigate = useNavigate();
  const [orderBookData, setOrderBookData] = useState({ bids: [], asks: [], spread: null, midPrice: null });
  const [orderForm, setOrderForm] = useState({ 
    side: "buy", 
    price: "", 
    quantity: "", 
    total: 0 
  });
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [priceError, setPriceError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [userHolding, setUserHolding] = useState({ quantity: 0, averagePrice: 0 });
  const [sellSummary, setSellSummary] = useState({ totalHolding: 0, openSellQuantity: 0, availableToSell: 0 });

  // 가격 입력 필드에 기본값 설정
  useEffect(() => {
    if (orderBookData.asks.length > 0 && !orderForm.price) {
      const defaultPrice = orderBookData.asks[0].price;
      setOrderForm(prev => ({ ...prev, price: defaultPrice.toString() }));
    }
  }, [orderBookData.asks, orderForm.price]);

  // 🆕 실제 주문 데이터를 가져와서 호가창 구성
  const fetchOrderBook = useCallback(async () => {
    if (!productId) { console.log("No productId available"); return; }
    try {
      // 실제 주문 데이터 가져오기
      const response = await axios.get(`/api/orders/book/${productId}`);
      const orderBook = response.data;
      
      console.log("✅ 실제 주문 데이터:", orderBook);
      
      // 상품 정보로 기본 매도 호가 생성 (아직 매도 주문이 없을 때)
      const productPrice = parseFloat(product?.price) || 0;
      const sharePercentage = parseFloat(product?.sharePercentage) || 0;
      const totalSaleAmount = productPrice * (sharePercentage / 100);
      const unitCount = Math.round(sharePercentage * 1000);
      const unitPrice = unitCount > 0 ? Math.round(totalSaleAmount / unitCount) : 0;
      
      let asks = orderBook.asks || [];
      let bids = orderBook.bids || [];
      
      // 백엔드에서 실제 주문 데이터만 사용 (기본 매도 호가는 백엔드에서 관리)
      console.log("📊 서버에서 받은 호가 데이터:", { asks, bids });
      
      setOrderBookData({ 
        bids, 
        asks, 
        spread: orderBook.spread || null, 
        midPrice: orderBook.midPrice || (asks.length > 0 ? asks[0].price : null) 
      });
      calculateVolumeBars(asks, bids);
    } catch (error) {
      console.error("❌ 주문 데이터 조회 실패:", error);
      // 에러 시 기본 데이터로 설정
      if (product) {
        const productPrice = parseFloat(product.price) || 0;
        const sharePercentage = parseFloat(product.sharePercentage) || 0;
        const totalSaleAmount = productPrice * (sharePercentage / 100);
        const unitCount = Math.round(sharePercentage * 1000);
        const unitPrice = unitCount > 0 ? Math.round(totalSaleAmount / unitCount) : 0;
        
        let asks = [];
        if (unitPrice > 0 && unitCount > 0) {
          asks = [{ 
            price: unitPrice,
            quantity: unitCount,
            coinName: product.title || `코인_${unitPrice}`,
            sharePercentage: sharePercentage
          }];
        }
        setOrderBookData({ bids: [], asks, spread: null, midPrice: asks.length > 0 ? asks[0].price : null });
        calculateVolumeBars(asks, []);
      }
    }
  }, [productId, product]);

  // 🆕 사용자 보유 지분 조회
  const fetchUserHolding = useCallback(async () => {
    if (!productId) return;
    
    const token = localStorage.getItem("token");
    if (!token) return;
    
    try {
      const response = await axios.get(`/api/holdings/user/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserHolding(response.data);
      console.log("✅ 사용자 보유 지분:", response.data);
      console.log("✅ 보유 지분율:", response.data.ownershipPercentage);
      console.log("✅ 전체 지분 수량:", response.data.totalShares);
      console.log("✅ 보유 수량:", response.data.quantity);
    } catch (error) {
      console.error("❌ 보유 지분 조회 실패:", error);
      setUserHolding({ quantity: 0, averagePrice: 0 });
    }
  }, [productId]);

  // 🆕 미체결 매도 합계 및 보유량 요약 조회
  const fetchOpenSellSummary = useCallback(async () => {
    if (!productId) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const { data } = await axios.get(`/api/orders/open-sell/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSellSummary(data);
    } catch (e) {
      // 무시: 비로그인/권한 없음 등
    }
  }, [productId]);

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
    fetchUserHolding();
    fetchOpenSellSummary();
    const interval = setInterval(() => {
      fetchOrderBook();
      fetchUserHolding();
      fetchOpenSellSummary();
    }, 2000);
    return () => clearInterval(interval);
  }, [fetchOrderBook, fetchUserHolding, fetchOpenSellSummary]);

  const placeOrder = async () => {
    if (!orderForm.price || !orderForm.quantity) {
      alert("가격과 수량을 입력해주세요.");
      return;
    }

    if (priceError || quantityError) {
      alert("입력값을 확인해주세요.");
      return;
    }

    // 토큰 확인
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }

    // 매수 주문인 경우 결제 페이지로 이동
    if (orderForm.side === 'buy') {
      const orderData = {
        productId,
        type: orderForm.side,
        price: parseFloat(orderForm.price),
        quantity: parseFloat(orderForm.quantity),
        total: orderForm.total
      };
      
      // 주문 정보를 세션 스토리지에 저장
      sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
      
      // 결제 페이지로 이동 (수량 파라미터 포함)
      navigate(`/products/${productId}/payment?quantity=${orderForm.quantity}`);
      return;
    }

    // 매도 주문은 기존 로직 유지 (즉시 처리)
    try {
      console.log(`📋 매도 주문 요청: ${orderForm.side} ${orderForm.price}원 x ${orderForm.quantity}개`);
      
      const response = await axios.post('/api/orders', {
        productId,
        type: orderForm.side,
        price: parseFloat(orderForm.price),
        quantity: parseFloat(orderForm.quantity)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('✅ 매도 주문 성공:', response.data);
      
      // 주문 성공 후 폼 초기화
      setOrderForm(prev => ({
        ...prev,
        price: orderBookData.asks.length > 0 ? orderBookData.asks[0].price.toString() : "",
        quantity: "",
        total: 0
      }));
      
      // 호가창 새로고침
      fetchOrderBook();
      
      alert(`매도 주문이 성공적으로 처리되었습니다! (체결: ${response.data.matches}건)`);
      
    } catch (error) {
      console.error('❌ 매도 주문 실패:', error);
      alert(`매도 주문 실패: ${error.response?.data?.error || error.message}`);
    }
  };

  const handlePriceChange = (value) => {
    const parsedPrice = parseFloat(value);
    const parsedQuantity = parseFloat(orderForm.quantity);
    let total = 0;
    if (!isNaN(parsedPrice) && !isNaN(parsedQuantity)) {
      // 0.001% 단위 총액 계산: 0.001% 지분당 가격 × 개수
      total = parsedPrice * parsedQuantity;
    }
    setOrderForm(prev => ({ ...prev, price: value, total }));
    setPriceError(validatePrice(value));
  };

  const handleQuantityChange = (value) => {
    const parsedPrice = parseFloat(orderForm.price);
    const parsedQuantity = parseFloat(value);
    let total = 0;
    if (!isNaN(parsedPrice) && !isNaN(parsedQuantity)) {
      // 0.001% 단위 총액 계산: 0.001% 지분당 가격 × 개수
      total = parsedPrice * parsedQuantity;
    }
    setOrderForm(prev => ({ ...prev, quantity: value, total }));
    setQuantityError(validateQuantity(value));
  };

  const handleOrderTypeChange = (side) => {
    let newPrice = orderForm.price;
    
    if (orderBookData.asks.length > 0) {
      const sellerPrice = orderBookData.asks[0].price;
      
      if (side === 'buy') {
        // 🆕 매수: 최저 매도 가격으로 자동 설정 (수정 불가)
        newPrice = sellerPrice.toString();
      } else if (side === 'sell') {
        // 매도: 최대 -2% 가격으로 설정
        const minSellPrice = Math.round(sellerPrice * 0.98);
        newPrice = minSellPrice.toString();
      }
    }
    
    setOrderForm(prev => ({ 
      ...prev, 
      side, 
      price: newPrice,
      total: 0 
    }));
  };

  const formatPrice = (price) => {
    return price ? price.toLocaleString() : "0";
  };

  // 🆕 실시간 가격 검증
  const validatePrice = (price) => {
    if (!price || !orderBookData.asks.length) return "";
    
    const inputPrice = parseFloat(price);
    const sellerPrice = orderBookData.asks[0].price;
    
    if (orderForm.side === 'buy') {
      // 🆕 매수 가격 자유화: 원하는 가격으로 매수 가능
      if (inputPrice <= 0) {
        return `가격은 0보다 커야 합니다`;
      }
      // 최대 매수가 제한 (판매자 가격의 120%까지)
      const maxBuyPrice = Math.round(sellerPrice * 1.2);
      if (inputPrice > maxBuyPrice) {
        return `최대 매수가는 ${maxBuyPrice.toLocaleString()}원입니다`;
      }
    } else if (orderForm.side === 'sell') {
      // 보유 지분 초과 매도 방지(프론트 가드)
      const q = parseFloat(orderForm.quantity);
      const maxSellable = userHolding.quantity;
      if (!isNaN(q) && q > maxSellable) {
        return `보유 지분 ${maxSellable.toLocaleString()}개를 초과하여 판매할 수 없습니다`;
      }
      // 🆕 매도 가격 제한: 100원 이상만 가능
      if (inputPrice < 100) {
        return `매도 가격은 100원 이상이어야 합니다`;
      }
      // 판매자 설정 가격 이하로 판매 불가
      if (inputPrice < sellerPrice) {
        return `판매 가격은 ${sellerPrice.toLocaleString()}원 이상이어야 합니다`;
      }
    }
    return "";
  };

  // 🆕 실시간 수량 검증 (지분 단위 시스템)
  const validateQuantity = (quantity) => {
    if (!quantity || !orderBookData.asks.length) return "";
    
    const inputQuantity = parseFloat(quantity); // 0.001% 단위 개수
    const maxQuantity = orderBookData.asks[0].quantity; // 판매자의 0.001% 단위 개수
    
    if (orderForm.side === 'buy') {
      if (inputQuantity > maxQuantity) {
        return `판매자가 설정한 개수(${maxQuantity.toLocaleString()}개)를 초과할 수 없습니다`;
      }
      if (inputQuantity < 1) { // 최소 1개 (0.001%)
        return `최소 1개(0.001%) 지분을 구매해야 합니다`;
      }
    } else if (orderForm.side === 'sell') {
      // 🆕 재판매 수량 검증: 보유 지분 확인
      if (inputQuantity < 1) {
        return `최소 1개(0.001%) 지분을 판매해야 합니다`;
      }
      if (inputQuantity > userHolding.quantity) {
        return `보유 지분(${userHolding.quantity.toLocaleString()}개)을 초과할 수 없습니다`;
      }
    }
    return "";
  };

  const formatShareUnits = (units) => {
    return units.toLocaleString(); // 0.001% 단위 개수로 표시
  };

  // 🆕 최저 매도가 및 판매 가능/추정 총액 계산
  const minAskPrice = orderBookData.asks.length > 0 ? orderBookData.asks[0].price : 0;
  const availableToSellCount = (sellSummary.availableToSell || Math.max(0, userHolding.quantity)) || 0;
  const sellAvailableKRW = minAskPrice * availableToSellCount;
  const estimatedOrderTotal = minAskPrice * (parseFloat(orderForm.quantity) || 0);

  const setPercentQuantity = (ratio) => {
    const q = Math.floor(availableToSellCount * ratio);
    handleQuantityChange(String(q));
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
          <div className="ask-header">매도수량</div>
          <div className="price-header">가격</div>
          <div className="bid-header">매수수량</div>
        </div>
        
        <div className="order-book-body">
          {/* 매도 호가 (높은 가격부터 위쪽) */}
          {orderBookData.asks.slice().reverse().map((ask, index) => (
            <div 
              key={`ask-${index}`} 
              className="order-row ask-row"
              style={{ '--ask-width': `var(--ask-width-${orderBookData.asks.length - 1 - index}, 0%)` }}
            >
              <div className="ask-quantity">{formatShareUnits(ask.quantity)}</div>
              <div className="price ask-price">{formatPrice(ask.price)}</div>
              <div className="bid-quantity"></div>
            </div>
          ))}
          
          {/* 현재가격 라인 - 제거 */}
          
          {/* 매수 호가 (높은 가격부터 위쪽) - 백엔드에서 이미 정렬됨 */}
          {orderBookData.bids.map((bid, index) => (
            <div 
              key={`bid-${index}`} 
              className="order-row bid-row"
              style={{ '--bid-width': `var(--bid-width-${index}, 0%)` }}
            >
              <div className="ask-quantity"></div>
              <div className="price bid-price">{formatPrice(bid.price)}</div>
              <div className="bid-quantity">{formatShareUnits(bid.quantity)}</div>
            </div>
          ))}
          
          {/* 매수 호가가 없을 때만 메시지 표시 */}
          {orderBookData.bids.length === 0 && (
            <div className="no-bids-message">
              <div className="ask-quantity"></div>
              <div className="price">매수 호가 없음</div>
              <div className="bid-quantity"></div>
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
            <span>판매자 설정지분:</span>
            <span className="original-quantity">{formatShareUnits(orderBookData.asks[0].quantity)}</span>
          </div>
          <div className="limit-item">
            <span>재판매 최저가:</span>
            <span className="min-sell-price">{formatPrice(orderBookData.asks[0].price * 0.98)}원</span>
          </div>
          {/* 🆕 사용자 보유 지분 정보 */}
          <div className="limit-item">
            <span>내 보유 지분:</span>
            <span className="user-holding">{formatShareUnits(userHolding.quantity)}개</span>
          </div>
          {userHolding.quantity > 0 && (
            <>
              <div className="limit-item">
                <span>평균 매수가:</span>
                <span className="avg-price">{formatPrice(userHolding.averagePrice)}원</span>
              </div>
              <div className="limit-item">
                <span>보유 지분율:</span>
                <span className="ownership-percentage">{userHolding.ownershipPercentage}%</span>
              </div>
            </>
          )}
          {userHolding.quantity === 0 && (
            <div className="limit-item">
              <span>보유 지분:</span>
              <span className="no-holding">보유한 지분이 없습니다</span>
            </div>
          )}
        </div>
      )}

      {/* 주문 폼 */}
      <div className="order-form">
        <h3>주문하기</h3>
        {orderForm.side === 'sell' && (
          <div className="sell-available-row">
            <div className="sell-available-label">판매 가능:</div>
            <div className="sell-available-value">
              <strong>{availableToSellCount.toLocaleString()}</strong>개
              <span className="approx"> ≈ {sellAvailableKRW.toLocaleString()}원</span>
              {minAskPrice > 0 && (
                <span className="basis"> (최저가 {minAskPrice.toLocaleString()}원 기준)</span>
              )}
            </div>
          </div>
        )}
        <div className="form-group">
          <label>주문 유형:</label>
          <div className="order-type-buttons">
            <button
              className={`order-type-btn ${orderForm.side === 'buy' ? 'active' : ''}`}
              onClick={() => handleOrderTypeChange('buy')}
            >
              매수
            </button>
            <button
              className={`order-type-btn ${orderForm.side === 'sell' ? 'active' : ''}`}
              onClick={() => handleOrderTypeChange('sell')}
            >
              매도
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>가격:</label>
          {orderForm.side === 'buy' ? (
            <div className="price-display">
              <input
                type="number"
                value={orderForm.price}
                disabled={true}
                className="disabled-input"
                placeholder="최저 매도 가격이 자동 설정됩니다"
              />
              <div className="price-hint">
                💡 최저 매도 가격: {orderBookData.asks.length > 0 ? formatPrice(orderBookData.asks[0].price) : '0'}원
              </div>
            </div>
          ) : (
            <>
              <input
                type="number"
                value={orderForm.price}
                onChange={(e) => handlePriceChange(e.target.value)}
                placeholder="재판매 가격을 입력하세요"
                className={priceError ? "error-input" : ""}
              />
              {priceError && <div className="error-message">{priceError}</div>}
            </>
          )}
        </div>

        <div className="form-group">
          <label>수량 :</label>
          <input
            type="number"
            step="1" // 1개 단위
            min="1" // 최소 1개
            max={orderBookData.asks.length > 0 ? orderBookData.asks[0].quantity : 1000000} // 동적 최대값
            value={orderForm.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            placeholder="1 ~ 판매자 설정 개수" // 업데이트된 플레이스홀더
            className={quantityError ? "error-input" : ""}
          />
          {quantityError && (<div className="error-message">{quantityError}</div>)}
          {orderForm.side === 'sell' && (
            <div className="percent-buttons">
              <button type="button" className="percent-btn" onClick={() => setPercentQuantity(0.1)}>10%</button>
              <button type="button" className="percent-btn" onClick={() => setPercentQuantity(0.25)}>25%</button>
              <button type="button" className="percent-btn" onClick={() => setPercentQuantity(0.5)}>50%</button>
              <button type="button" className="percent-btn" onClick={() => setPercentQuantity(1)}>100%</button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>총액:</label>
          <div className="total-amount">{isNaN(orderForm.total) ? '0' : orderForm.total.toLocaleString()}원</div>
          {orderForm.side === 'sell' && (
            <div className="price-hint" style={{marginTop: '6px'}}>
              추정 주문총액: {estimatedOrderTotal.toLocaleString()}원 (최저가 기준)
            </div>
          )}
        </div>

        <button className="place-order-btn" onClick={placeOrder}>
          주문하기
        </button>
      </div>
    </div>
  );
}
