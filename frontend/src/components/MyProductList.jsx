import React from "react";
import ProductCard from "./ProductCard";
import "./MyProductList.css";

// onEdit, onDelete를 props로 받아서 하위에 전달!
export default function MyProductList({ products, onEdit, onDelete }) {
  if (!products.length) return <div className="no-product">아직 등록한 상품이 없습니다.</div>;
  return (
    <div className="my-product-list">
      {products.map(prod => (
        <ProductCard
          key={prod._id}
          product={prod}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
