// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetail.css";

// helper: 서버가 넘겨주는 path가 절대 URL 아닐 때만 prefix
const getImageUrl = (path) =>
  path.startsWith("http") ? path : `/uploads/${path}`;

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 1️⃣ 내 정보 가져오기 (있으면)
    if (token) {
      axios
        .get("/api/user/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const me = res.data.user || res.data;
          setUser(me);
        })
        .catch(() => {
          // 이미 인터셉터에서 401 처리해줄 거라면 생략해도 됩니다.
        });
    }

    // 2️⃣ 상품 정보 가져오기
    axios
      .get(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setMainImageIndex(0);
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401) {
          alert("로그인이 필요합니다.");
          navigate("/login", { replace: true });
        } else if (status === 404) {
          alert("존재하지 않는 상품입니다.");
          navigate("/", { replace: true });
        } else {
          alert("상품을 불러오는 데 실패했습니다. 다시 시도해주세요.");
          navigate("/", { replace: true });
        }
      });
  }, [id, navigate]);

  if (!product) {
    return <div className="product-detail-loading">로딩 중…</div>;
  }

  // ownerId 판단
  const ownerId =
    product.ownerId ||
    product.sellerId ||
    product.userId ||
    (product.user && product.user._id);

  const isOwner =
    Boolean(user && ownerId) &&
    user._id.toString() === ownerId.toString();

  const handleEdit = () => navigate(`/product-form?edit=${id}`);
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제되었습니다.");
      navigate("/mypage", { replace: true });
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const images = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="product-detail-container">
      {/* Images */}
      <div className="product-detail-images">
        <div className="thumbnail-list">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={getImageUrl(img)}
              alt={`썸네일 ${idx + 1}`}
              className={
                idx === mainImageIndex ? "thumbnail active" : "thumbnail"
              }
              onMouseEnter={() => setMainImageIndex(idx)}
              onClick={() => setMainImageIndex(idx)}
            />
          ))}
        </div>
        <div className="main-image-wrapper">
          <img
            className="main-image"
            src={
              images[mainImageIndex]
                ? getImageUrl(images[mainImageIndex])
                : "https://via.placeholder.com/400"
            }
            alt="대표 이미지"
          />
        </div>
      </div>

      {/* Info + Actions */}
      <div className="product-detail-info">
        <h1>{product.title}</h1>
        <p className="location">
          {product.location?.sido} {product.location?.gugun}
        </p>
        <p>{product.description}</p>
        <p className="price">{product.price.toLocaleString()}원</p>

        {isOwner && (
          <div className="detail-actions">
            <button className="edit-btn" onClick={handleEdit}>
              수정하기
            </button>
            <button className="delete-btn" onClick={handleDelete}>
              삭제하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
