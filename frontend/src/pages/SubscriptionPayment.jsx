import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './SubscriptionPayment.css';

const SubscriptionPayment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiryMonth, setCardExpiryMonth] = useState('');
  const [cardExpiryYear, setCardExpiryYear] = useState('');
  const [cardCVC, setCardCVC] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [processing, setProcessing] = useState(false);

  // URL에서 구독 플랜 파라미터 가져오기
  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan') || 'premium';

  // 구독 플랜 정보
  const subscriptionPlans = {
    premium: {
      name: 'Premium',
      price: 15000,
      description: 'Free + Premium 작품 보기/등록',
      benefits: [
        'Free 작품 보기/등록',
        'Premium 작품 보기',
        'Premium 작품 등록',
        '우선 고객 지원'
      ]
    },
    vip: {
      name: 'VIP',
      price: 25000,
      description: '모든 작품 보기/등록',
      benefits: [
        '모든 등급 작품 보기',
        '모든 등급 작품 등록',
        '우선 고객 지원',
        '전용 VIP 혜택'
      ]
    }
  };

  const selectedPlan = subscriptionPlans[plan];

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

  useEffect(() => {
    // 구독 플랜 유효성 검사
    if (!subscriptionPlans[plan]) {
      setError('유효하지 않은 구독 플랜입니다.');
      return;
    }
    setLoading(false);
  }, [plan]);

  const handleCardPayment = async () => {
    if (!cardNumber || !cardExpiryMonth || !cardExpiryYear || !cardCVC || !cardHolderName) {
      alert('모든 카드 정보를 입력해주세요.');
      return;
    }

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      // 구독 결제 요청
      const response = await axios.post('/api/subscription/purchase', {
        plan: plan,
        paymentMethod: paymentMethod,
        cardInfo: {
          number: cardNumber.replace(/-/g, ''),
          expiryMonth: cardExpiryMonth,
          expiryYear: cardExpiryYear,
          cvc: cardCVC,
          holderName: cardHolderName
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('구독이 성공적으로 완료되었습니다! 기존 상품들이 Premium으로 업그레이드되었습니다.');
      navigate('/mypage');
    } catch (err) {
      console.error('구독 결제 실패:', err);
      alert('구독 결제에 실패했습니다: ' + (err.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return <div className="subscription-payment-loading">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="subscription-payment-error">
        <h2>오류</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/mypage')}>돌아가기</button>
      </div>
    );
  }

  return (
    <div className="subscription-payment-container">
      <div className="subscription-payment-header">
        <h1>구독 결제</h1>
        <p>디지털 갤러리 {selectedPlan.name} 구독</p>
      </div>

      <div className="subscription-payment-content">
        {/* 구독 플랜 정보 */}
        <div className="subscription-plan-info">
          <div className={`plan-card ${plan}`}>
            <h2>{selectedPlan.name} 플랜</h2>
            <div className="plan-price">
              <span className="price-amount">₩{selectedPlan.price.toLocaleString()}</span>
              <span className="price-period">/월</span>
            </div>
            <p className="plan-description">{selectedPlan.description}</p>
            <div className="plan-benefits">
              <h3>구독 혜택:</h3>
              <ul>
                {selectedPlan.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 결제 정보 */}
        <div className="payment-section">
          <h2>결제 정보</h2>
          
          <div className="payment-method">
            <h3>결제 방법</h3>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span>신용카드</span>
              </label>
            </div>
          </div>

          {paymentMethod === 'card' && (
            <div className="card-payment-form">
              <h3>카드 정보</h3>
              
              <div className="form-group">
                <label>카드 번호</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  placeholder="0000-0000-0000-0000"
                  maxLength="19"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>만료 월</label>
                  <select
                    value={cardExpiryMonth}
                    onChange={(e) => setCardExpiryMonth(e.target.value)}
                  >
                    <option value="">월</option>
                    {monthOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>만료 년</label>
                  <select
                    value={cardExpiryYear}
                    onChange={(e) => setCardExpiryYear(e.target.value)}
                  >
                    <option value="">년</option>
                    {yearOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>CVC</label>
                  <input
                    type="text"
                    value={cardCVC}
                    onChange={(e) => setCardCVC(e.target.value.replace(/\D/g, ''))}
                    placeholder="123"
                    maxLength="4"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>카드 소유자명</label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="홍길동"
                />
              </div>
            </div>
          )}
        </div>

        {/* 결제 요약 */}
        <div className="payment-summary">
          <h3>결제 요약</h3>
          <div className="summary-item">
            <span>구독 플랜:</span>
            <span>{selectedPlan.name}</span>
          </div>
          <div className="summary-item">
            <span>월 구독료:</span>
            <span>₩{selectedPlan.price.toLocaleString()}</span>
          </div>
          <div className="summary-item total">
            <span>총 결제 금액:</span>
            <span>₩{selectedPlan.price.toLocaleString()}</span>
          </div>
        </div>

        {/* 결제 버튼 */}
        <div className="payment-actions">
          <button
            className="payment-btn"
            onClick={handleCardPayment}
            disabled={processing}
          >
            {processing ? '처리 중...' : `₩${selectedPlan.price.toLocaleString()} 결제하기`}
          </button>
          <button
            className="cancel-btn"
            onClick={() => navigate('/mypage')}
            disabled={processing}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPayment;
