import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './Payment.css';

const Payment = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState('');
  const [cardExpiryYear, setCardExpiryYear] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // 5분 타이머 관련 상태
  const [timeLeft, setTimeLeft] = useState(300); // 5분 = 300초
  const [timerActive, setTimerActive] = useState(false);

  // URL에서 수량 파라미터 가져오기
  const searchParams = new URLSearchParams(location.search);
  const quantity = parseInt(searchParams.get('quantity')) || 1;
  const orderId = searchParams.get('orderId');
  
  // 디버깅: URL 파라미터 확인
  console.log('🔍 URL 파라미터 확인:', {
    search: location.search,
    quantity: searchParams.get('quantity'),
    parsedQuantity: quantity,
    orderId: orderId
  });

  // 카드번호 포맷팅 함수
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join('-');
    } else {
      return v;
    }
  };

  // 카드번호 입력 핸들러
  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardNumber(formatted);
  };

  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return { value: month.toString().padStart(2, '0'), label: month.toString().padStart(2, '0') };
  });

  // 년도 옵션 생성 (현재 년도부터 10년)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = currentYear + i;
    return { value: year.toString(), label: year.toString() };
  });

  // 5분 타이머 useEffect
  useEffect(() => {
    let timer;
    
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 시간이 다 되면 자동 취소
            handleTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [timerActive, timeLeft]);

  // 타이머 시작 함수
  const startTimer = () => {
    setTimeLeft(300); // 5분으로 리셋
    setTimerActive(true);
  };

  // 타이머 정지 함수
  const stopTimer = () => {
    setTimerActive(false);
  };

  // 시간 초과 처리 함수
  const handleTimeout = async () => {
    stopTimer();
    setProcessing(false);
    
    // 주문 취소 처리
    if (orderId) {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await axios.post(`/api/orders/${orderId}/cancel`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('⏰ 시간 초과로 주문이 자동 취소되었습니다');
        }
      } catch (error) {
        console.error('주문 취소 처리 실패:', error);
      }
    }
    
    alert('결제 시간이 초과되어 주문이 취소되었습니다.');
    navigate(`/products/${id}`);
  };

  // 시간 포맷팅 함수
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`/api/products/${id}`);
        setProduct(response.data);
        
        // 결제 페이지 진입 시 주문을 processing 상태로 변경
        const token = localStorage.getItem('token');
        if (token && orderId) {
          try {
            await axios.post(`/api/orders/${orderId}/processing`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ 주문을 처리 중 상태로 변경했습니다');
            // 주문 처리 시작 시 타이머 시작
            startTimer();
          } catch (error) {
            console.log('⚠️ 주문 상태 변경 실패 (이미 처리 중이거나 주문이 없음):', error.response?.data?.error || error.message);
          }
        }
      } catch (err) {
        setError('상품 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleCardPayment = async () => {
    if (!cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCVC || !cardHolderName) {
      alert('모든 카드 정보를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      // 주문 정보 생성 - 판매 지분에 따른 개당 가격 계산
      const totalSaleAmount = product.price * (product.sharePercentage / 100);
      // shareQuantity가 0이면 sharePercentage * 1000으로 계산 (0.001% 단위)
      const totalQuantity = product.shareQuantity || (product.sharePercentage * 1000);
      const unitPrice = Math.round(totalSaleAmount / totalQuantity);
      
      // 수수료(1%) 계산: 원단위 올림, 최소 1원, 수수료 VAT 10% 별도 부과
      const feeRate = 0.01;
      const subtotal = unitPrice * quantity;
      const feeAmount = Math.max(1, Math.ceil(subtotal * feeRate));
      const feeVatRate = 0.1;
      const feeVat = Math.ceil(feeAmount * feeVatRate);
      const totalAmount = subtotal + feeAmount + feeVat;
      
      const orderData = {
        productId: id,
        type: 'buy',
        price: unitPrice, // 개당 가격
        quantity: quantity,
        // 결제 요약 정보 포함 (백엔드 사용 여부와 무관하게 전송)
        subtotal,
        feeRate,
        feeAmount,
        feeVatRate,
        feeVat,
        totalAmount,
        currency: 'KRW',
        paymentMethod: 'card',
        cardNumber: cardNumber.replace(/\s/g, '').slice(-4), // 마지막 4자리만 저장
        cardHolderName: cardHolderName
      };
      
      const response = await axios.post('/api/orders', orderData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // 결제 성공 시 타이머 정지
        stopTimer();
        
        // 주문 상태를 filled로 업데이트
        try {
          const orderId = response.data.orderId;
          await axios.patch(`/api/orders/${orderId}/complete`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('✅ 주문 상태를 완료로 업데이트했습니다');
        } catch (error) {
          console.log('⚠️ 주문 상태 업데이트 실패:', error.response?.data?.error || error.message);
        }
        
        alert('카드 결제가 완료되었습니다!');
        navigate(`/products/${id}`);
      }
    } catch (err) {
      console.error('카드 결제 실패:', err);
      alert('카드 결제에 실패했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = () => {
    // 취소 시 타이머 정지
    stopTimer();
    navigate(`/products/${id}`);
  };

  if (loading) return <div className="payment-loading">로딩 중...</div>;
  if (error) return <div className="payment-loading">{error}</div>;
  if (!product) return <div className="payment-loading">상품을 찾을 수 없습니다.</div>;

  // 판매 지분에 따른 개당 가격 계산
  const totalSaleAmount = product.price * (product.sharePercentage / 100);
  // shareQuantity가 0이면 sharePercentage * 1000으로 계산 (0.001% 단위)
  const totalQuantity = product.shareQuantity || (product.sharePercentage * 1000);
  const unitPrice = Math.round(totalSaleAmount / totalQuantity);
  // 수수료(1%) 계산 및 총 결제금액
  const feeRate = 0.01;
  const subtotal = unitPrice * quantity;
  const feeAmount = Math.max(1, Math.ceil(subtotal * feeRate));
  const feeVatRate = 0.1;
  const feeVat = Math.ceil(feeAmount * feeVatRate);
  const totalAmount = subtotal + feeAmount + feeVat;

  return (
    <div className="payment-wrapper">
      {/* 왼쪽 영역 */}
      <div className="payment-left">
        <h2>💳 결제 방법 선택</h2>
        
        <div className="payment-methods">
          <div className="method-buttons">
            <button 
              className={`method-btn ${paymentMethod === 'card' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              💳 카드 결제
            </button>
            <button 
              className={`method-btn ${paymentMethod === 'crypto' ? 'active' : 'coming-soon'}`}
              onClick={() => setPaymentMethod('crypto')}
            >
              ₿ 암호화폐 결제
            </button>
          </div>
        </div>

        {paymentMethod === 'card' && (
          <div className="card-payment-form">
            <h3>카드 정보 입력</h3>
            <div className="form-group">
              <label>카드 소유자명:</label>
              <input
                type="text"
                value={cardHolderName}
                onChange={(e) => setCardHolderName(e.target.value)}
                placeholder="홍길동"
                maxLength="50"
              />
            </div>
            <div className="form-group">
              <label>카드 번호:</label>
              <input
                type="text"
                value={cardNumber}
                onChange={handleCardNumberChange}
                placeholder="1234-5678-9012-3456"
                maxLength="19"
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>만료 월:</label>
                <select
                  value={cardExpiryMonth}
                  onChange={(e) => setCardExpiryMonth(e.target.value)}
                  className="expiry-select"
                >
                  <option value="">월 선택</option>
                  {monthOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>만료 년도:</label>
                <select
                  value={cardExpiryYear}
                  onChange={(e) => setCardExpiryYear(e.target.value)}
                  className="expiry-select"
                >
                  <option value="">년도 선택</option>
                  {yearOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>CVC:</label>
              <input
                type="text"
                value={cardCVC}
                onChange={(e) => setCardCVC(e.target.value)}
                placeholder="123"
                maxLength="3"
              />
            </div>
            <button 
              className="pay-button" 
              onClick={handleCardPayment}
              disabled={processing}
            >
              {processing ? '처리 중...' : '카드로 결제하기'}
            </button>
          </div>
        )}

        {paymentMethod === 'crypto' && (
          <div className="crypto-payment-form">
            <div className="coming-soon-container">
              <div className="coming-soon-icon">🚧</div>
              <h3>Coming Soon</h3>
              <p className="coming-soon-text">
                암호화폐 결제 기능이 곧 출시됩니다!
              </p>
              <p className="coming-soon-desc">
                Bitcoin, Ethereum, USDT 등 다양한 암호화폐로 결제할 수 있는 기능을 준비 중입니다.
              </p>
              <button 
                className="method-btn"
                onClick={() => setPaymentMethod('card')}
              >
                💳 카드 결제로 돌아가기
              </button>
            </div>
          </div>
        )}

        <div className="payment-actions">
          <button className="payment-btn cancel" onClick={handleCancel}>
            취소
          </button>
        </div>
      </div>

      {/* 오른쪽 영역 */}
      <div className="payment-summary">
        {/* 5분 타이머 */}
        {timerActive && (
          <div className="payment-timer">
            <div className="timer-icon">⏰</div>
            <div className="timer-info">
              <div className="timer-label">결제 제한 시간</div>
              <div className={`timer-display ${timeLeft <= 60 ? 'warning' : ''}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        )}
        
        <h3>🧾 주문 요약</h3>
        <p><strong>{product.title || product.name}</strong></p>
        <p>수량: {quantity.toLocaleString()}개</p>
        <p>개당 가격: {unitPrice.toLocaleString()}원</p>
        <p>소계: {subtotal.toLocaleString()}원</p>
        <p>플랫폼 거래 수수료 (1%): {feeAmount.toLocaleString()}원</p>
        <p>부가세 (수수료의 10%): {feeVat.toLocaleString()}원</p>
        <hr />
        <p className="total-price">총 결제 금액 (수수료·부가세 포함): <strong>{totalAmount.toLocaleString()}원</strong></p>
        <p className="legal-note" style={{ marginTop: '6px', color: '#6b7280', fontSize: '12px', lineHeight: 1.5 }}>
          플랫폼 거래 수수료 1% 및 해당 수수료의 부가가치세 10%가 부과됩니다.
          작품에 대한 부가세 부과 여부와 세율은 판매자 유형(일반과세/간이과세/면세)에 따라 달라질 수 있습니다.
        </p>
        
        {/* 결제 안내 */}
        <div className="payment-info">
          <h4>💡 결제 안내</h4>
          <ul>
            <li>• 안전한 SSL 암호화 결제</li>
            <li>• 3D Secure 인증 지원</li>
            <li>• 즉시 결제 처리</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Payment;
