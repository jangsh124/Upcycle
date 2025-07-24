// src/pages/ProductDetail.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./ProductDetail.css";
import getImageUrl from "../utils/getImageUrl";
import OrderBook from "../components/OrderBook";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [user, setUser] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);
  const [purchased, setPurchased] = useState(0);

  useEffect(() => {
    const token = localStorage.getItem("token");

    // 1️⃣ 내 정보 가져오기 (있으면)
    if (token) {
      axios
        .get("/user/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => {
          const me = res.data.user || res.data;
          setUser(me);
        })
        .catch(() => {});
    }

    // 2️⃣ 상품 정보 가져오기
    console.log("🔍 ProductDetail 요청 ID:", id);
    axios
      .get(`/products/${id}`)
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
          navigate("/products", { replace: true });
        } else {
          alert("상품을 불러오는 데 실패했습니다. 다시 시도해주세요.");
          navigate("/products", { replace: true });
        }
      });

    // fetch purchased amount if endpoint available
    axios
      .get(`/products/${id}/purchased`)
      .then(res => {
        const amt = res.data.purchased ?? 0;
        setPurchased(amt);
      })
      .catch(() => setPurchased(0));
  }, [id, navigate]);

  if (!product) {
    return <div className="product-detail-loading">로딩 중…</div>;
  }

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
      await axios.delete(`/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("삭제되었습니다.");
      navigate("/mypage", { replace: true });
    } catch {
      alert("삭제에 실패했습니다.");
    }
  };

  const handlePurchase = async () => {
    if (purchaseQuantity < 1 || purchaseQuantity > remainingQuantity) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/login");
        return;
      }
      await axios.post(
        "/api/purchase",
        {
          productId: id,
          quantity: purchaseQuantity,
          unitPrice: product.unitPrice,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("구매 완료");
    } catch (err) {
      alert(err.response?.data?.error || "구매 실패");
    }
  };

  const handleBuyAll = () => {
    if (product.tokenSupply > 0) {
      navigate(`/products/${id}/payment?quantity=${product.tokenSupply}`);
    }
  };

const remainingQuantity = (product.shareQuantity || 0) - purchased;
  const remainingPct = product.shareQuantity
    ? Math.round((remainingQuantity / product.shareQuantity) * 100)
    : 0;
  const totalCost = purchaseQuantity * (product.unitPrice || 0);

  const images = Array.isArray(product.images) ? product.images : [];

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
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

      <div className="product-detail-info">
        <div className="product-detail-header">
          <h1>{product.title}</h1>
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
        <p className="location">
          {product.location?.sido} {product.location?.gugun}
        </p>
    
       <p className="price">{product.price.toLocaleString()}원</p>
 {!isOwner && remainingQuantity > 0 && (
          <div className="buy-all-section">
            <p>전체 구매 시 총액: {product.price.toLocaleString()}원</p>
            <button className="buy-btn" onClick={handleBuyAll}>전체 매수</button>
          </div>
        )}
       {remainingQuantity > 0 && (
          <div className="token-purchase">
            {/* ➊ 잔여 % 게이지 */}
    <div className="remaining-gauge-container">
      <div
        className="remaining-gauge-fill"
        style={{ width: `${remainingPct}%` }}
      />
    </div>
    <p className="remaining-info">
      남은 토큰: {remainingQuantity}개 ({remainingPct}%)
    </p>

    {/* ➋ 개당 가격 표시 */}
    <p className="unit-price">
      토큰 개당 가격: {product.unitPrice.toLocaleString()}원
    </p>

            <label>
              수량:
              <input
                type="number"
                min="1"
                max={remainingQuantity}
                value={purchaseQuantity}
                onChange={e =>
                  setPurchaseQuantity(Math.min(parseInt(e.target.value, 10) || 0, remainingQuantity))
                }
              />
            </label>
           <small>You can buy up to {remainingQuantity} tokens</small>
            <div>Total: {totalCost.toLocaleString()}원</div>
            <button
              onClick={handlePurchase}
              disabled={purchaseQuantity < 1 || purchaseQuantity > remainingQuantity}
            >
              구매하기
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="product-description-section">
      <p>{product.description}</p>
    </div>
    <OrderBook productId={id} />
  </div>
  );
}
