// src/pages/ProductList.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import "./ProductList.css";

// 정렬 옵션 목록       
const SORT_OPTIONS = [
  { label: "최신순",     value: "createdAt_desc" },
  { label: "오래된순",   value: "createdAt_asc"  },
  { label: "가격 낮은순", value: "price_asc"      },
  { label: "가격 높은순", value: "price_desc"     },
];

export default function ProductList({ userEmail, onLogout }) {
  const [products, setProducts] = useState([]);
  const [sort, setSort]         = useState("createdAt_desc");
  const [loading, setLoading]   = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("name"); // name, artist
  const [priceRange, setPriceRange] = useState({ min: "", max: "" });
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [priceFilterType, setPriceFilterType] = useState("total"); // "total" or "perToken"
  const [userSubscription, setUserSubscription] = useState(null);
  const [userLoading, setUserLoading] = useState(true);

  // 사용자 구독 정보 가져오기
  useEffect(() => {
    const fetchUserSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const res = await axios.get('/api/subscription/info', {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserSubscription(res.data.subscription);
        } else {
          // 비회원인 경우 구독 정보를 null로 설정
          setUserSubscription(null);
        }
      } catch (err) {
        console.error('구독 정보 로드 오류:', err);
        setUserSubscription(null);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserSubscription();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      console.log("▶ fetch sort:", sort);
      try {
        const res = await axios.get(
          "/api/products",
          { params: { sort } }
        );
        console.log("◀ 응답 data:", res.data);
        setProducts(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("상품 목록 로드 오류:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [sort]);

  // 검색 및 가격 필터링
  const filteredProducts = products.filter(product => {
    // 검색어 필터링
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      switch (searchType) {
        case "name":
          if (!product.title?.toLowerCase().includes(term)) return false;
          break;

        case "artist":
          if (!product.sellerId?.name?.toLowerCase().includes(term) && 
              !product.sellerId?.email?.toLowerCase().includes(term)) return false;
          break;
        default:
          break;
      }
    }
    
    // 가격 범위 필터링
    if (priceRange.min) {
      const minPrice = parseInt(priceRange.min);
      if (priceFilterType === "total") {
        if (product.price < minPrice) return false;
      } else if (priceFilterType === "perToken") {
        // 지분당 가격 계산 (전체 가격 × 0.001%)
        const sharePrice = Math.round(product.price * 0.00001);
        if (sharePrice < minPrice) return false;
      }
    }
    if (priceRange.max) {
      const maxPrice = parseInt(priceRange.max);
      if (priceFilterType === "total") {
        if (product.price > maxPrice) return false;
      } else if (priceFilterType === "perToken") {
        // 지분당 가격 계산 (전체 가격 × 0.001%)
        const sharePrice = Math.round(product.price * 0.00001);
        if (sharePrice > maxPrice) return false;
      }
    }
    
    return true;
  });

  // 사용자가 Premium/VIP 구독자인지 확인
  const canViewPremium = userSubscription && (userSubscription.tier === 'premium' || userSubscription.tier === 'vip') && userSubscription.isActive;
  
  // 사용자가 로그인했는지 확인
  const isLoggedIn = !!localStorage.getItem('token');

  // Free와 Premium 상품 분리 (권한에 따라)
  const freeProducts = filteredProducts.filter(product => !product.tier || product.tier === 'free');
  const premiumProducts = canViewPremium 
    ? filteredProducts.filter(product => product.tier === 'premium' || product.tier === 'vip')
    : []; // Premium 구독자가 아니면 Premium 상품을 아예 표시하지 않음

  // 디버깅용 로그
  console.log('🔍 Premium 접근 권한 확인:', {
    userSubscription,
    canViewPremium,
    isLoggedIn,
    freeProductsCount: freeProducts.length,
    premiumProductsCount: premiumProducts.length
  });

  const handleSearch = (e) => {
    e.preventDefault();
    // 검색 로직은 이미 필터링으로 처리됨
  };

  const handlePriceFilterToggle = () => {
    setShowPriceFilter(!showPriceFilter);
  };

  const handlePriceRangeChange = (type, value) => {
    // 숫자만 추출
    const numericValue = value.replace(/[^\d]/g, '');
    setPriceRange(prev => ({
      ...prev,
      [type]: numericValue
    }));
  };

  const formatPriceDisplay = (value) => {
    if (!value) return '';
    return parseInt(value).toLocaleString();
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setPriceRange({ min: "", max: "" });
    setShowPriceFilter(false);
    setPriceFilterType("total");
  };



  return (
    <div className="instagram-feed-container">
      {/* 헤더 영역 */}
      <div className="feed-header">
        <div className="header-content">
          <h1 className="feed-title">디지털 갤러리</h1>
          <div className="header-actions">
            {userEmail ? (
              <div className="user-menu">
                <Link to="/mypage" className="user-name-link">
                  <span className="user-name">{userEmail}</span>
                </Link>
                <button 
                  onClick={onLogout}
                  className="logout-btn"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="auth-buttons">
                <Link to="/login" className="auth-btn login-btn">
                  로그인
                </Link>
                <Link to="/signup" className="auth-btn signup-btn">
                  가입
                </Link>
              </div>
            )}
          </div>
        </div>
        
        {/* 검색 및 정렬 영역 */}
        <div className="search-section">
          <div className="search-sort-container">
            {/* 정렬 옵션 */}
            <div className="sort-container">
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="sort-select"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 검색 폼 */}
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-group">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="search-type-select"
                >
                  <option value="name">작품명</option>
                  <option value="artist">작가명</option>
                </select>
                <input
                  type="text"
                  placeholder="검색어를 입력하세요..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
                <button type="submit" className="search-button">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </button>
              </div>
              
              {/* 필터기능 드롭다운 */}
              <div className="price-filter-container">
                <button 
                  type="button"
                  onClick={handlePriceFilterToggle}
                  className={`price-filter-toggle ${showPriceFilter ? 'active' : ''}`}
                >
                  필터기능
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                  </svg>
                </button>
                
                {showPriceFilter && (
                  <div className="price-filter-dropdown">
                    {/* 가격 타입 선택 */}
                    <div className="price-type-selection">
                      <label className="price-type-label">가격 필터 타입</label>
                      <div className="price-type-options">
                        <label className="price-type-option">
                          <input
                            type="radio"
                            name="priceType"
                            value="total"
                            checked={priceFilterType === "total"}
                            onChange={(e) => setPriceFilterType(e.target.value)}
                          />
                          <span>전체 가격</span>
                          <div className="radio-custom"></div>
                        </label>
                        <label className="price-type-option">
                          <input
                            type="radio"
                            name="priceType"
                            value="perToken"
                            checked={priceFilterType === "perToken"}
                            onChange={(e) => setPriceFilterType(e.target.value)}
                          />
                          <span>지분당 가격 (0.001%)</span>
                          <div className="radio-custom"></div>
                        </label>
                      </div>
                    </div>
                    
                    <div className="price-range-inputs">
                      <div className="price-input-group">
                        <label>최소 가격</label>
                        <div className="price-input-wrapper">
                          <input
                            type="text"
                            placeholder="0"
                            value={formatPriceDisplay(priceRange.min)}
                            onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                            className="price-input"
                          />
                          <span className="price-unit">원</span>
                        </div>
                      </div>
                      <div className="price-input-group">
                        <label>최대 가격</label>
                        <div className="price-input-wrapper">
                          <input
                            type="text"
                            placeholder="무제한"
                            value={formatPriceDisplay(priceRange.max)}
                            onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                            className="price-input"
                          />
                          <span className="price-unit">원</span>
                        </div>
                      </div>
                    </div>
                    <div className="price-filter-actions">
                      <button 
                        type="button" 
                        onClick={clearAllFilters}
                        className="clear-filters-btn"
                      >
                        필터 초기화
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 피드 영역 */}
      <div className="feed-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>로딩 중...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">🔍</div>
            <h3>검색 결과가 없어요</h3>
            <p>다른 검색어를 시도해보세요</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm("")} 
                className="clear-search-btn"
              >
                검색 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="gallery-sections">
            {/* 일반 상품 섹션 */}
            {freeProducts.length > 0 && (
              <div className="free-section">
                <div className="instagram-feed">
                              {freeProducts.map(product => (
              <ProductCard key={product._id} product={product} userEmail={userEmail} userSubscription={userSubscription} />
            ))}
                </div>
              </div>
            )}

            {/* Premium 상품 섹션 - Premium 구독자에게만 표시 */}
            {canViewPremium && premiumProducts.length > 0 && (
              <div className="premium-section">
                <h2 className="section-title">⭐ Premium 작품</h2>
                <div className="instagram-feed">
                  {premiumProducts.map(product => (
                    <ProductCard key={product._id} product={product} userEmail={userEmail} userSubscription={userSubscription} />
                  ))}
                </div>
              </div>
            )}

            {/* Premium 구독 안내 섹션 - Premium 구독자가 아닌 경우 */}
            {!canViewPremium && (
              <div className="premium-info-section">
                <div className="premium-info-content">
                  <div className="premium-info-icon">⭐</div>
                  <h3>Premium 작품이 더 있습니다</h3>
                  <p>Premium 구독으로 더 많은 작품을 만나보세요</p>
                  {isLoggedIn ? (
                    <Link to="/subscription?plan=premium" className="premium-subscribe-btn">
                      Premium 구독하기
                    </Link>
                  ) : (
                    <Link to="/signup" className="premium-subscribe-btn">
                      회원가입 및 구독
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* 검색 결과가 없을 때 */}
            {freeProducts.length === 0 && premiumProducts.length === 0 && (
              <div className="empty-feed">
                <div className="empty-icon">🔍</div>
                <h3>검색 결과가 없어요</h3>
                <p>다른 검색어를 시도해보세요</p>
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")} 
                    className="clear-search-btn"
                  >
                    검색 초기화
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
