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

export default function ProductList({ userEmail }) {
  const [products, setProducts] = useState([]);
  const [sort, setSort]         = useState("createdAt_desc");
  const [loading, setLoading]   = useState(false);

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

  return (
    <div className="instagram-feed-container">
      {/* 헤더 영역 */}
      <div className="feed-header">
        <div className="header-content">
          <h1 className="feed-title">디지털 갤러리</h1>
          {userEmail && (
            <Link to="/product-form" className="add-post-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </Link>
          )}
        </div>
        
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
      </div>

      {/* 피드 영역 */}
      <div className="feed-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>로딩 중...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-feed">
            <div className="empty-icon">📦</div>
            <h3>아직 등록된 상품이 없어요</h3>
            <p>첫 번째 상품을 등록해보세요!</p>
            {userEmail && (
              <Link to="/product-form" className="empty-add-button">
                상품 등록하기
              </Link>
            )}
          </div>
        ) : (
          <div className="instagram-feed">
            {products.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
