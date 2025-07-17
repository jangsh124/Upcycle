import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";

const KRW_TO_USDC = 1300; // fixed rate

export default function Payment() {
  const { id } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const quantity = parseInt(new URLSearchParams(search).get("quantity"), 10) || 1;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch(() => {
        alert("상품 정보를 불러오지 못했습니다.");
        navigate(-1);
      });
  }, [id, navigate]);

  const handlePayment = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `/products/${id}/purchase`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("구매 완료");
      navigate(`/products/${id}`);
    } catch (err) {
      alert(err.response?.data?.error || "구매 실패");
      setLoading(false);
    }
  };

  if (!product) return <div className="payment-loading">로딩 중…</div>;

  const totalPrice = product.tokenPrice * quantity;
  const usdcAmount = (totalPrice / KRW_TO_USDC).toFixed(2);

  return (
    <div className="payment-container">
      <h2>{product.title}</h2>
      <p>수량: {quantity}</p>
      <p>
        가격: {totalPrice.toLocaleString()}원 (약 {usdcAmount} USDC)
      </p>
      <button onClick={handlePayment} disabled={loading}>
        결제하기
      </button>
    </div>
  );
}