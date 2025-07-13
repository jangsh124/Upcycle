// src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./ProductCard.css";

// 이미지 URL이 절대경로가 아닐 때만 백엔드 서버 주소를 붙여주는 헬퍼
const getImageUrl = (path) =>
  path.startsWith("http") ? path : `http://localhost:5001${path}`;

export default function ProductCard({ product, onEdit, onDelete }) {
  if (!product) return null;

  // 대표 이미지 결정
  const mainImage =
    product.images && product.images.length > 0
      ? product.images[product.mainImageIndex ?? 0]
      : null;

  return (
    <div className="product-card">
      <Link to={`/products/${product._id}`} className="product-card-link">
        <img
          className="product-card-img"
          src={
            mainImage
              ? getImageUrl(mainImage)
              : "https://via.placeholder.com/150"
          }
          alt={product.title}
        />
        <div className="product-card-info">
          <h4 className="product-title">{product.title}</h4>
          <p className="product-desc">{product.description}</p>
          <div className="product-card-price">
            {product.price?.toLocaleString()}원
          </div>
        </div>
      </Link>

      {onEdit && (
        <div className="product-card-actions">
          <button
            className="product-edit-btn"
            onClick={(e) => {
              e.preventDefault();
              onEdit(product._id);
            }}
          >
            수정
          </button>
          <button
            className="product-delete-btn"
            onClick={(e) => {
              e.preventDefault();
              onDelete(product._id);
            }}
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
