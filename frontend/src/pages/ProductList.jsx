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
          "http://localhost:5001/api/products",
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
    <div className="product-list-container">
      {userEmail && (
        <div className="product-add-container">
          <Link to="/product-form" className="product-add-button">
            상품 등록
          </Link>
        </div>
      )}

      {/* 정렬 드롭다운 */}
      <div className="sort-container">
        <label htmlFor="sort-select">정렬:</label>
        <select
          id="sort-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
        >
          {SORT_OPTIONS.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <h2>상품 목록</h2>
      {loading ? (
        <div className="loading">로딩 중…</div>
      ) : products.length === 0 ? (
        <div className="no-products">등록된 상품이 없습니다.</div>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
