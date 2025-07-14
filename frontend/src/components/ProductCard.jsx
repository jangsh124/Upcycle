// src/components/ProductCard.jsx
import React from "react";
import { Link } from "react-router-dom";
import "./ProductCard.css";

import getImageUrl from "../utils/getImageUrl";

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
