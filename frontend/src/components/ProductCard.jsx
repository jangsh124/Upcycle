// src/components/ProductCard.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./ProductCard.css";
import getImageUrl from "../utils/getImageUrl";

export default function ProductCard({ product, onEdit, onDelete, userEmail }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  if (!product) return null;

  // 프리미엄/VIP 작품인지 확인
  const isPremiumOrVip = product.tier === 'premium' || product.tier === 'vip';
  const isLoggedIn = !!userEmail;

  // 이미지 배열 처리
  const images = product.images && product.images.length > 0 
    ? product.images 
    : [];

  const handlePrevImage = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? images.length - 1 : prev - 1
      );
    }
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "어제";
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="instagram-post">
      {/* 포스트 헤더 */}
      <div className="post-header">
        <div className="post-user-info">
                  <div className="user-avatar">
          {(product.sellerId?.name || product.sellerId?.email)?.charAt(0).toUpperCase() || 'U'}
        </div>
          <div className="user-details">
            <span className="username">{product.sellerId?.name || product.sellerId?.email || '사용자'}</span>
            <span className="location">{product.location?.sido} {product.location?.gugun}</span>
          </div>
        </div>
        <div className="post-actions">
          {onEdit && (
            <>
              <button
                className="post-action-btn"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(product._id);
                }}
              >
                수정
              </button>
              <button
                className="post-action-btn delete"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(product._id);
                }}
              >
                삭제
              </button>
            </>
          )}
        </div>
      </div>

      {/* 이미지 영역 */}
      <div className={`post-image-container ${isPremiumOrVip ? 'premium-overlay' : ''}`}>
        <Link to={`/products/${product._id}`} className="post-image-link">
          <img
            className={`post-image ${isPremiumOrVip ? 'premium-blur' : ''}`}
            src={images.length > 0 ? getImageUrl(images[currentImageIndex]) : "/noimage.png"}
            alt={product.title}
          />
        </Link>
        
        {/* 프리미엄/VIP 오버레이 */}
        {isPremiumOrVip && (
          <div className="premium-overlay-content">
            <div className="premium-badge">
              {product.tier === 'premium' ? 'PREMIUM' : 'VIP'}
            </div>
            <div className="premium-message">
              {!isLoggedIn ? (
                <>
                  <h3>로그인이 필요합니다</h3>
                  <p>이 작품을 보려면 로그인하세요</p>
                  <Link to="/login" className="premium-btn login-btn">
                    로그인
                  </Link>
                  <Link to="/signup" className="premium-btn signup-btn">
                    가입하기
                  </Link>
                </>
              ) : (
                <>
                  <h3>구독이 필요합니다</h3>
                  <p>이 작품을 보려면 {product.tier === 'premium' ? 'Premium' : 'VIP'} 플랜에 가입하세요</p>
                  <button className="premium-btn subscribe-btn">
                    구독하기
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* 좌우 화살표 버튼 */}
        {images.length > 1 && (
          <>
            <button 
              className="image-nav-btn image-nav-left"
              onClick={handlePrevImage}
              aria-label="이전 이미지"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15,18 9,12 15,6"></polyline>
              </svg>
            </button>
            <button 
              className="image-nav-btn image-nav-right"
              onClick={handleNextImage}
              aria-label="다음 이미지"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9,18 15,12 9,6"></polyline>
              </svg>
            </button>
          </>
        )}
        
        {/* 이미지 인디케이터 */}
        {images.length > 1 && (
          <div className="image-indicators">
            {images.map((_, index) => (
              <div
                key={index}
                className={`indicator ${index === currentImageIndex ? 'active' : ''}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 포스트 내용 */}
      <div className="post-content">
        <div className="post-actions-bar">
          <div className="action-buttons">
            <button className="action-btn like-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <Link to={`/products/${product._id}`} className="action-btn comment-btn">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </Link>
          </div>
          <div className="post-price">
            {product.price?.toLocaleString()}원
          </div>
        </div>

        <div className="post-caption">
          <span className="caption-username">{product.sellerId?.name || product.sellerId?.email || '사용자'}</span>
          <span className="caption-text">{product.title}</span>
        </div>

        {product.description && (
          <div className="post-description">
            {product.description.length > 100 
              ? `${product.description.substring(0, 100)}...` 
              : product.description
            }
          </div>
        )}

        <div className="post-meta">
          <span className="post-date">{formatDate(product.createdAt)}</span>
          <Link to={`/products/${product._id}`} className="view-details-link">
            자세히 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
