import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "./Home.css";
import getImageUrl from "../utils/getImageUrl";

export default function Home() {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentProducts = async () => {
      try {
        const response = await axios.get("/api/products?sort=createdAt_desc");
        const products = Array.isArray(response.data) ? response.data : [];
        setRecentProducts(products.slice(0, 3)); // 최근 3개만 가져오기
      } catch (error) {
        console.error("최근 상품 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentProducts();
  }, []);

  return (
    <div 
      className="landing-container"
      style={{
        background: `
          url('/hombackground.jpg'),
          linear-gradient(135deg, 
            rgba(102, 126, 234, 0.6) 0%, 
            rgba(118, 75, 162, 0.6) 100%)
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              디지털 갤러리
            </h1>
            <p className="hero-subtitle">
              예술 작품을 디지털 토큰으로 소유하고<br />
              투자하는 새로운 경험
            </p>
            <p className="hero-description">
              블록체인 기술로 보장되는 진정한 소유권과<br />
              투명한 거래로 예술 투자의 새로운 패러다임을 만나보세요
            </p>
          </div>
          
          <div className="hero-visual">
            <div className="visual-container">
              <div className="artwork-preview">
                {loading ? (
                  // 로딩 중일 때 기본 카드들 표시
                  <>
                    <div className="artwork-card">
                      <div className="artwork-image"></div>
                      <div className="artwork-info">
                        <span className="artwork-title">로딩 중...</span>
                        <span className="artwork-price">₩-</span>
                      </div>
                    </div>
                    <div className="artwork-card">
                      <div className="artwork-image"></div>
                      <div className="artwork-info">
                        <span className="artwork-title">로딩 중...</span>
                        <span className="artwork-price">₩-</span>
                      </div>
                    </div>
                    <div className="artwork-card">
                      <div className="artwork-image"></div>
                      <div className="artwork-info">
                        <span className="artwork-title">로딩 중...</span>
                        <span className="artwork-price">₩-</span>
                      </div>
                    </div>
                  </>
                ) : recentProducts.length > 0 ? (
                  // 실제 상품 데이터 표시
                  recentProducts.map((product, index) => (
                    <Link 
                      key={product._id} 
                      to={`/products/${product._id}`} 
                      className="artwork-card-link"
                    >
                      <div className="artwork-card">
                        <div 
                          className="artwork-image"
                          style={{
                            backgroundImage: product.images && product.images.length > 0 
                              ? `url(${getImageUrl(product.images[0])})`
                              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                          }}
                        ></div>
                        <div className="artwork-info">
                          <span className="artwork-title">{product.title}</span>
                          <span className="artwork-price">₩{product.price?.toLocaleString()}</span>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  // 상품이 없을 때 기본 카드들 표시
                  <>
                    <div className="artwork-card">
                      <div className="artwork-image"></div>
                      <div className="artwork-info">
                        <span className="artwork-title">새로운 작품을 기다리는 중</span>
                        <span className="artwork-price">₩-</span>
                      </div>
                    </div>
                    <div className="artwork-card">
                      <div className="artwork-image"></div>
                      <div className="artwork-info">
                        <span className="artwork-title">새로운 작품을 기다리는 중</span>
                        <span className="artwork-price">₩-</span>
                      </div>
                    </div>
                    <div className="artwork-card">
                      <div className="artwork-image"></div>
                      <div className="artwork-info">
                        <span className="artwork-title">새로운 작품을 기다리는 중</span>
                        <span className="artwork-price">₩-</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="benefits-content">
          <h2 className="section-title">왜 디지털 갤러리인가요?</h2>
          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">🔒</div>
              <h3>진정한 소유권</h3>
              <p>블록체인으로 보장되는<br />투명하고 안전한 소유권</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">📈</div>
              <h3>투자 기회</h3>
              <p>예술 작품의 가치 상승을<br />통한 수익 창출</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌍</div>
              <h3>글로벌 접근</h3>
              <p>언제 어디서나<br />세계의 예술 작품에 투자</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🎨</div>
              <h3>예술 지원</h3>
              <p>아티스트를 직접 지원하며<br />예술 생태계 발전에 기여</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>지금 시작하세요</h2>
          <p>디지털 예술 투자의 새로운 세계로 여러분을 초대합니다</p>
          <div className="cta-buttons">
            <Link to="/signup" className="cta-primary">
              회원가입
            </Link>
            <Link to="/login" className="cta-secondary">
              로그인
            </Link>
            <Link to="/products" className="cta-skip">
              둘러보기
            </Link>
          </div>
          <Link to="/about" className="learn-more">
            더 알아보기
          </Link>
        </div>
      </section>
    </div>
  );
}