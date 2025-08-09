// ── src/pages/ProductDetail.jsx ──
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
    if (token) {
      axios
        .get("/api/user/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((res) => setUser(res.data.user || res.data))
        .catch(() => {});
    }

    axios
      .get(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.data);
        setMainImageIndex(0);
      })
      .catch((err) => {
        const status = err.response?.status;
        if (status === 401) navigate("/login", { replace: true });
        else navigate("/products", { replace: true });
      });

    axios
      .get(`/api/products/${id}/purchased`)
      .then((res) => setPurchased(res.data.purchased || 0))
      .catch(() => setPurchased(0));


  }, [id, navigate]);

  if (!product) return <div className="product-detail-loading">로딩 중…</div>;

  const ownerId =
    product.ownerId ||
    product.sellerId ||
    product.userId ||
    (product.user && product.user._id);
  const isOwner = user && user._id.toString() === ownerId?.toString();

  const images = Array.isArray(product.images) ? product.images : [];

  // 토큰 전체 수량이 없으면 tokenSupply, shareQuantity, 1 중 하나로 처리
  const totalQuantity =
    product.shareQuantity || product.tokenSupply || 1;
  const remainingQuantity = totalQuantity - purchased;
  const remainingPct = totalQuantity
    ? Math.round((remainingQuantity / totalQuantity) * 100)
    : 0;
  const totalCost = purchaseQuantity * (product.unitPrice || 0);

  const handleBuyAll = () => {
    navigate(`/products/${id}/payment?quantity=${remainingQuantity}`);
  };

  const handlePurchase = async () => {
    if (purchaseQuantity < 1 || purchaseQuantity > remainingQuantity) return;
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    
    // 디버깅: 이동할 URL 확인
    const paymentUrl = `/products/${id}/payment?quantity=${purchaseQuantity}`;
    console.log('🔍 ProductDetail - 이동할 URL:', {
      purchaseQuantity,
      paymentUrl,
      currentUrl: window.location.href
    });
    
    // 결제 페이지로 이동
    navigate(paymentUrl);
  };

  return (
    <div className="product-detail-page">
      <div className="product-detail-container">
        {/* 왼쪽: 상품 정보 */}
        <div className="product-detail-left">
          {/* 이미지 영역 */}
          <div className="product-detail-images">
            <div className="thumbnail-list">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={getImageUrl(img)}
                  alt={`썸네일 ${idx + 1}`}
                  className={idx === mainImageIndex ? "thumbnail active" : "thumbnail"}
                  onMouseEnter={() => setMainImageIndex(idx)}
                  onClick={() => setMainImageIndex(idx)}
                />
              ))}
            </div>
            <div className="main-image-wrapper">
              <img
                className="main-image"
                src={getImageUrl(images[mainImageIndex] || "")}
                alt="대표 이미지"
              />
            </div>
          </div>

          {/* 정보 영역 */}
          <div className="product-detail-info">
            <div className="product-detail-header">
              <h1>{product.title}</h1>
              {isOwner && (
                <div className="detail-actions">
                  <button className="edit-btn" onClick={() => navigate(`/product-form?edit=${id}`)}>
                    수정하기
                  </button>
                  <button className="delete-btn" onClick={async () => {
                      if (!window.confirm("정말 삭제하시겠습니까?")) return;
                      await axios.delete(`/products/${id}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });
                      navigate("/mypage", { replace: true });
                    }}>
                    삭제하기
                  </button>
                </div>
              )}
            </div>

            <p className="location">{product.location?.sido} {product.location?.gugun}</p>
            <p className="price">{product.price.toLocaleString()}원</p>
            
            {/* 업로드 날짜 표시 */}
            <p className="upload-date">
              업로드: {new Date(product.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>


          </div>

          {/* 설명 */}
          <div className="product-description-section">
            <p>{product.description}</p>
          </div>
        </div>

        {/* 오른쪽: 오더북 */}
        <div className="product-detail-right">
          <OrderBook productId={id} product={product} />

          {/* 전체 매수 버튼 */}
          {remainingQuantity > 0 && (
            <div className="buy-all-section">
              <p>전체 구매 시 총액: {product.price.toLocaleString()}원</p>
              <button className="buy-btn" onClick={handleBuyAll}>
                전체 매수
              </button>
            </div>
          )}

          {/* 수량 지정 매수 섹션 */}
          {remainingQuantity > 0 && (
            <div className="token-purchase">
              <div className="remaining-gauge-container">
                <div className="remaining-gauge-fill" style={{ width: `${remainingPct}%` }} />
              </div>
              <p className="remaining-info">
                남은 토큰: {remainingQuantity}개 ({remainingPct}%)
              </p>
              <p className="unit-price">토큰 개당 가격: {product.unitPrice.toLocaleString()}원</p>

              <label>
                수량:
                <input
                  type="number"
                  min="1"
                  max={remainingQuantity}
                  value={purchaseQuantity}
                  onChange={(e) => setPurchaseQuantity(parseInt(e.target.value) || 1)}
                />
              </label>
              <p>You can buy up to {remainingQuantity} tokens</p>
              <p>Total: {totalCost.toLocaleString()}원</p>
              <button onClick={() => {
                console.log('🔍 ProductDetail - 구매하기 버튼 클릭됨:', {
                  purchaseQuantity,
                  remainingQuantity,
                  id
                });
                handlePurchase();
              }}>구매하기</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
