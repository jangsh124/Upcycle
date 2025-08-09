// src/pages/Mypage.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import ProfileCard from "../components/ProfileCard";
import ProfileEditModal from "../components/ProfileEditModal";
import "./Mypage.css";
import getImageUrl from "../utils/getImageUrl";


export default function MyPage() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // 유저 정보 불러오기
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        const res = await axios.get(
          "/api/user/me",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = res.data.user || res.data;
        setUser(data);
      } catch (err) {
        console.error("유저 정보 로드 오류:", err);
        if (err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
          navigate("/login");
        }
      }
    };

    // 내 상품 정보 불러오기
    const fetchProducts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await axios.get(
          "/api/products/my",
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const prods = Array.isArray(res.data.products)
          ? res.data.products
          : Array.isArray(res.data)
          ? res.data
          : [];
        setProducts(prods.slice(0, 3));
      } catch (err) {
        console.error("내 상품 로드 오류:", err);
        if (err.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("userEmail");
          navigate("/login");
        }
      }
    };

    fetchUser();
    fetchProducts();
  }, [navigate]);

  if (!user) return <div className="mypage-loading">로딩중...</div>;

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask가 설치되어 있지 않습니다.");
      return;
    }
    try {
      setLoading(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const walletAddress = accounts[0];
      const token = localStorage.getItem("token");
      await axios.patch(
        "/api/user/wallet",
        { walletAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(prev => ({ ...prev, walletAddress }));
      alert("지갑이 성공적으로 연결되었습니다!");
    } catch (err) {
      console.error("지갑 연결 오류:", err);
      alert("지갑 연결 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileEdit = async (formData) => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        "/api/user/profile",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );
      setUser(res.data.user);
      setIsEditing(false);
      alert("프로필이 성공적으로 수정되었습니다!");
    } catch (err) {
      console.error("프로필 수정 실패:", err);
      alert("프로필 수정에 실패했습니다.");
    }
  };

  return (
    <div className="mypage-main">
      {/* 왼쪽 - 프로필 카드/지갑 */}
      <div className="mypage-profile-col">
        <ProfileCard user={user} onEditClick={() => setIsEditing(true)} />
        <div className="wallet-info">
          <b>지갑 주소:</b>{" "}
          {user.walletAddress
            ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
            : "없음"}
          <button
            className="wallet-btn"
            onClick={handleConnectWallet}
            disabled={loading}
          >
            {user.walletAddress ? "지갑 변경" : "지갑 연결"}
          </button>
        </div>
      </div>

      {/* 오른쪽 - 최근 상품 */}
      <div className="mypage-products-col">
        <h3>내가 등록한 상품</h3>
        <div className="mypage-products-list">
          {products.length === 0 ? (
            <div className="no-products">아직 상품이 없습니다.</div>
          ) : (
            products.map(item => (
              <Link
                key={item._id}
                to={`/products/${item._id}`}
                className="mypage-product-item"
              >
                <div
                  className="mypage-product-thumb"
                  style={{
                    backgroundImage: item.images && item.images.length
                      ? `url(${getImageUrl(item.images[0])})`
                      : `url(/noimage.png)`
                  }}
                />
                <div className="mypage-product-info">
                  <div className="mypage-product-title">{item.title}</div>
                  <div className="mypage-product-price">
                    {item.price?.toLocaleString()}원
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
        <button
          className="mypage-products-all-btn"
          onClick={() => navigate("/mypage/products")}
        >
          전체보기 &gt;
        </button>
      </div>

      {/* 프로필 수정 모달 */}
      {isEditing && (
        <ProfileEditModal
          user={user}
          onClose={() => setIsEditing(false)}
          onSave={handleProfileEdit}
        />
      )}
    </div>
  );
}
