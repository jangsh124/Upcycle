// src/pages/MyProductsPage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import MyProductList from "../components/MyProductList";
import "./MyProductsPage.css";

export default function MyProductsPage() {
  const [products, setProducts] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("로그인 후 이용해주세요.");
      return;
    }

    axios
      .get("http://localhost:5001/api/products/my", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        setProducts(res.data.products || []);
      })
      .catch(err => {
        console.error("내 상품 로드 오류:", err);
        setMsg("내 상품을 불러오는 데 실패했습니다.");
      });
  }, []);

  if (msg) {
    return <div className="my-products-msg">{msg}</div>;
  }

  return (
    <div className="my-products-page">
      <h2>내가 등록한 모든 상품</h2>
      {/* onEdit, onDelete 없이 products만 전달 */}
      <MyProductList products={products} />
    </div>
  );
}
