// src/pages/Mypage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import ProfileEditModal from "../components/ProfileEditModal";
import "./Mypage.css";
import getImageUrl from "../utils/getImageUrl";


export default function MyPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  // 구독 정보 상태
  const [subscription, setSubscription] = useState({
    tier: 'free',
    isActive: false,
    startDate: null,
    endDate: null
  });

  // 대시보드 데이터 상태
  const [holdings, setHoldings] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [totalAssets, setTotalAssets] = useState(0);

  useEffect(() => {
    // 유저 정보 불러오기
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get(
          "/api/user/me",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data.user || res.data;
        setUser(data);
        setSubscription(data.subscription || { tier: 'free', isActive: false });
      } catch (err) {
        console.error("유저 정보 로드 오류:", err);
        if (err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
          navigate("/login");
        }
      }
    };

    // 내 상품 정보 불러오기
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(
          "/api/products/my",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const prods = Array.isArray(res.data.products)
          ? res.data.products
          : Array.isArray(res.data)
          ? res.data
          : [];
        setProducts(prods.slice(0, 3));
      } catch (err) {
        console.error("내 상품 로드 오류:", err);
        if (err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
          navigate("/login");
        }
      }
    };

    // 보유 자산 정보 불러오기
    const fetchHoldings = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        console.log("🔍 보유 자산 조회 시작");
        const res = await axios.get(
          "/api/holdings",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const holdingsData = Array.isArray(res.data) ? res.data : [];
        console.log("📊 받은 holdings 데이터:", holdingsData);
        
        setHoldings(holdingsData);
        
        // 총 자산 계산 (구매한 총 금액)
        let totalPurchaseValue = 0;
        holdingsData.forEach(holding => {
          totalPurchaseValue += (holding.totalPurchaseValue || 0);
          console.log(`  - ${holding.productTitle}: ${holding.quantity}개 x ₩${holding.averagePrice} = ₩${holding.totalPurchaseValue} (내 작품: ${holding.isMyProduct})`);
        });
        setTotalAssets(totalPurchaseValue);
        console.log(`💰 총 구매 금액: ₩${totalPurchaseValue.toLocaleString()}`);
      } catch (err) {
        console.error("보유 자산 로드 오류:", err);
      }
    };

    // 최근 거래 내역 불러오기
    const fetchRecentTransactions = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(
          "/api/orders/my/recent",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const transactions = Array.isArray(res.data) ? res.data : [];
        setRecentTransactions(transactions.slice(0, 3)); // 최근 3개만
      } catch (err) {
        console.error("최근 거래 로드 오류:", err);
      }
    };

    fetchUser();
    fetchProducts();
    fetchHoldings();
    fetchRecentTransactions();
  }, [navigate]);

  if (!user) return <div className="mypage-loading">로딩중...</div>;

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask가 설치되어 있지 않습니다.");
      return;
    }
    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts[0];
      const token = localStorage.getItem("token");
      await axios.patch(
        "/api/user/wallet",
        { walletAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(prev => ({ ...prev, walletAddress }));
      alert("지갑이 성공적으로 연결되었습니다!");
    } catch (err) {
      console.error("지갑 연결 오류:", err);
      alert("지갑 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileEdit = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        "/api/user/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      setUser(res.data.user);
      setIsEditing(false);
      alert("프로필이 성공적으로 수정되었습니다!");
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      alert("프로필 수정에 실패했습니다.");
    }
  };

  // 구독 관리 함수들
  const handleSubscribe = (plan) => {
    // 결제 페이지로 이동
    navigate(`/payment?plan=${plan}`);
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("구독을 해지하시겠습니까?")) return;
    
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        "/api/user/subscription/cancel",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSubscription(prev => ({ ...prev, isActive: false, tier: 'free' }));
      alert("구독이 해지되었습니다.");
    } catch (err) {
      console.error("구독 해지 실패:", err);
      alert("구독 해지에 실패했습니다.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "없음";
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSubscriptionStatus = () => {
    if (!subscription.isActive) return "Free";
    return subscription.tier === 'premium' ? 'Premium' : 'VIP';
  };

  const getSubscriptionBenefits = () => {
    switch (subscription.tier) {
      case 'premium':
        return ['Free + Premium 작품 보기', 'Free + Premium 작품 등록'];
      case 'vip':
        return ['모든 작품 보기', '모든 등급 작품 등록'];
      default:
        return ['Free 작품만 보기/등록'];
    }
  };

  // 거래 내역 포맷팅 함수들
  const formatTransactionType = (type) => {
    return type === 'buy' ? '매수' : '매도';
  };

  const formatTransactionStatus = (status) => {
    switch (status) {
      case 'filled': return '체결완료';
      case 'partial': return '부분체결';
      case 'open': return '대기중';
      case 'cancelled': return '취소됨';
      default: return status;
    }
  };

  return (
    <div className="mypage-main">
      {/* 상단 - 자산 요약 */}
      <div className="mypage-assets-summary">
        <div className="assets-card">
          <div className="assets-header">
            <h2>💰 자산 요약</h2>
          </div>
          <div className="assets-content">
            <div className="asset-item">
              <div className="asset-label">총 구매 금액</div>
              <div className="asset-value">₩{totalAssets.toLocaleString()}</div>
              <div className="asset-description">구매한 총 금액</div>
            </div>
            <div className="asset-item">
              <div className="asset-label">보유 작품 수</div>
              <div className="asset-value">{holdings.length}개</div>
              <div className="asset-description">구매한 작품</div>
            </div>
          </div>
          
          {/* 보유 작품별 지분율 */}
          {holdings.length > 0 && (
            <div className="holdings-details">
              <h4>📊 보유 작품별 지분율</h4>
              <div className="holdings-list">
                {holdings.map(holding => {
                  const ownershipPercentage = ((holding.quantity / 49000) * 100).toFixed(2);
                  return (
                    <Link 
                      key={holding._id} 
                      to={`/products/${holding.productId}`}
                      className="holding-item-link"
                    >
                      <div className="holding-item">
                        <div className="holding-info">
                          <div className="holding-title">{holding.productTitle}</div>
                          <div className="holding-stats">
                            <span className="holding-quantity">{holding.quantity.toLocaleString()}개</span>
                            <span className="holding-percentage">{ownershipPercentage}%</span>
                          </div>
                        </div>
                        <div className="holding-progress">
                          <div 
                            className="holding-progress-bar" 
                            style={{ width: `${ownershipPercentage}%` }}
                          ></div>
                        </div>
                        <div className="holding-arrow">→</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="mypage-content">
        {/* 왼쪽 - 프로필 카드/지갑/구독 */}
        <div className="mypage-profile-col">
          <ProfileCard user={user} onEditClick={() => setIsEditing(true)} />
          
          {/* 구독 관리 섹션 */}
          <div className="subscription-section">
            <h3>구독 관리</h3>
            <div className="subscription-info">
              <div className="subscription-status">
                <span className="status-label">현재 구독:</span>
                <span className={`status-value ${subscription.tier}`}>
                  {getSubscriptionStatus()}
                </span>
              </div>
              
              {subscription.isActive && (
                <>
                  <div className="subscription-dates">
                    <div>시작일: {formatDate(subscription.startDate)}</div>
                    <div>만료일: {formatDate(subscription.endDate)}</div>
                  </div>
                  <div className="subscription-benefits">
                    <h4>구독 혜택:</h4>
                    <ul>
                      {getSubscriptionBenefits().map((benefit, index) => (
                        <li key={index}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
              
              {!subscription.isActive && (
                <div className="subscription-benefits">
                  <h4>현재 혜택:</h4>
                  <ul>
                    {getSubscriptionBenefits().map((benefit, index) => (
                      <li key={index}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="subscription-actions">
              {!subscription.isActive ? (
                <>
                  <button 
                    className="subscribe-btn premium"
                    onClick={() => handleSubscribe('premium')}
                  >
                    Premium 구독하기 (월 15,000원)
                  </button>
                  <button 
                    className="subscribe-btn vip"
                    onClick={() => handleSubscribe('vip')}
                  >
                    VIP 구독하기 (월 25,000원)
                  </button>
                </>
              ) : (
                <>
                  {subscription.tier === 'premium' && (
                    <button 
                      className="upgrade-btn"
                      onClick={() => handleSubscribe('vip')}
                    >
                      VIP로 업그레이드
                    </button>
                  )}
                  <button 
                    className="cancel-btn"
                    onClick={handleCancelSubscription}
                  >
                    구독 해지
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="wallet-info">
            <b>지갑 주소:</b>{" "}
            {user.walletAddress
              ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
              : "없음"}
            <button
              className="wallet-btn"
              onClick={handleConnectWallet}
              disabled={loading}
            >
              {user.walletAddress ? "지갑 변경" : "지갑 연결"}
            </button>
          </div>
        </div>

        {/* 오른쪽 - My Gallery & 최근 거래 */}
        <div className="mypage-right-col">
          {/* My Gallery */}
          <div className="mypage-gallery-section">
            <h3>My Gallery</h3>
            <div className="mypage-products-list">
              {products.length === 0 ? (
                <div className="no-products">아직 상품이 없습니다.</div>
              ) : (
                products.map(item => (
                  <Link
                    key={item._id}
                    to={`/products/${item._id}`}
                    className="mypage-product-item"
                  >
                    <div
                      className="mypage-product-thumb"
                      style={{
                        backgroundImage: item.images && item.images.length
                          ? `url(${getImageUrl(item.images[0])})`
                          : `url(/noimage.png)`
                      }}
                    />
                    <div className="mypage-product-info">
                      <div className="mypage-product-title">{item.title}</div>
                      <div className="mypage-product-price">
                        {item.price?.toLocaleString()}원
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
            <button
              className="mypage-products-all-btn"
              onClick={() => navigate("/mypage/products")}
            >
              전체보기 &gt;
            </button>
          </div>

          {/* 최근 거래 내역 */}
          <div className="mypage-transactions-section">
            <h3>📊 최근 거래 내역</h3>
            <div className="transactions-list">
              {recentTransactions.length === 0 ? (
                <div className="no-transactions">아직 거래 내역이 없습니다.</div>
              ) : (
                recentTransactions.map(transaction => (
                  <div key={transaction._id} className="transaction-item">
                    <div className="transaction-header">
                      <span className={`transaction-type ${transaction.type}`}>
                        {formatTransactionType(transaction.type)}
                      </span>
                      <span className={`transaction-status ${transaction.status}`}>
                        {formatTransactionStatus(transaction.status)}
                      </span>
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-product">
                        {transaction.productTitle || '상품명 없음'}
                      </div>
                      <div className="transaction-info">
                        <span>{transaction.quantity}개</span>
                        <span>₩{transaction.price?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="transaction-date">
                      {formatDate(transaction.createdAt)}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button
              className="transactions-all-btn"
              onClick={() => navigate("/mypage/transactions")}
            >
              전체 거래 보기 &gt;
            </button>
          </div>
        </div>
      </div>

      {/* 프로필 수정 모달 */}
      {isEditing && (
        <ProfileEditModal
          user={user}
          onClose={() => setIsEditing(false)}
          onSave={handleProfileEdit}
        />
      )}
    </div>
  );
}
