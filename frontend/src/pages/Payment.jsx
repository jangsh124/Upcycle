import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import "./Payment.css";

const KRW_TO_USDC = 1300;

export default function Payment() {
  const { id } = useParams();
  const { search } = useLocation();
  const navigate = useNavigate();
  const quantity = parseInt(new URLSearchParams(search).get("quantity"), 10) || 1;

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [selectedToken, setSelectedToken] = useState("usdc");

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

    if (!buyerName || !buyerAddress || !buyerPhone || !walletAddress) {
      alert("필수 정보를 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `/products/${id}/purchase`,
        {
          quantity,
          name: buyerName,
          address: buyerAddress,
          phone: buyerPhone,
          email: buyerEmail,
          wallet: walletAddress,
          paymentToken: selectedToken,
        },
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
    <div className="payment-wrapper">
      {/* 왼쪽 영역 */}
      <div className="payment-left">
        <h2>배송 및 결제 정보</h2>
        <input type="text" placeholder="이름" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} />
        <input type="text" placeholder="주소" value={buyerAddress} onChange={(e) => setBuyerAddress(e.target.value)} />
        <input type="text" placeholder="전화번호" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} />
        <input type="email" placeholder="이메일 (선택)" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} />
        <input type="text" placeholder="지갑 주소 (0x...)" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
        
        <label className="payment-label">결제 토큰 선택:</label>
        <select value={selectedToken} onChange={(e) => setSelectedToken(e.target.value)} className="token-select">
          <option value="usdc">USDC</option>
          <option value="eth">ETH</option>
          <option value="klay">KLAY</option>
        </select>

        <button className="pay-button" onClick={handlePayment} disabled={loading}>
          {loading ? "결제 처리 중..." : "크립토로 결제하기"}
        </button>
        <p className="money-back">💸 30일 환불 보장</p>
      </div>

      {/* 오른쪽 영역 */}
      <div className="payment-summary">
        <h3>🧾 주문 요약</h3>
        <p><strong>{product.title}</strong></p>
        <p>수량: {quantity}</p>
        <p>가격: {totalPrice.toLocaleString()} 원</p>
        <p>환산가: ≈ {usdcAmount} USDC</p>
        <hr />
        <p className="total-price">총 결제 금액: <strong>{usdcAmount} {selectedToken.toUpperCase()}</strong></p>
      </div>
    </div>
  );
}
