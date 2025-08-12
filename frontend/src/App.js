// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import axios from "axios";

import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProductList from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";
import MyPage from "./pages/Mypage";
import MyProductsPage from "./pages/MyProductsPage";
import ProductDetail from "./pages/ProductDetail";
import Payment from "./pages/Payment";
import SubscriptionPayment from "./pages/SubscriptionPayment";
import Home from "./pages/Home";

// ─── 아래 한 줄을 추가 ────────────────────────────────────
// 모든 axios 요청의 기본 URL을 빈 문자열로 설정하면,
// CRA의 proxy 설정을 통해 localhost:5001로 프록시됩니다.
axios.defaults.baseURL = "";

// 401 응답 시 자동 로그아웃
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("userEmail");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

function AppContent({
  userEmail,
  setUserEmail,
  walletAddress,
  setWalletAddress,
  authChecked,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const hideNav = location.pathname.startsWith("/reset-password");

  if (!authChecked) return <div>로딩 중...</div>;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    setUserEmail("");
    setWalletAddress("");
    navigate("/login");
  };

    return (
    <>
      <div className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductList userEmail={userEmail} />} />
          <Route path="/product-form" element={<ProductForm />} />
          <Route
            path="/login"
            element={<Login setUserEmail={setUserEmail} />}
          />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />
          <Route
            path="/reset-password"
            element={<ResetPassword setUserEmail={setUserEmail} />}
          />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/products/:id/payment" element={<Payment />} />
          <Route path="/payment" element={<SubscriptionPayment />} />

          {/* 내가 등록한 상품 전체보기 */}
          <Route
            path="/mypage/products"
            element={
              userEmail ? <MyProductsPage /> : <Navigate to="/login" replace />
            }
          />

          {/* 내 페이지 */}
          <Route
            path="/mypage"
            element={userEmail ? <MyPage /> : <Navigate to="/login" replace />}
          />

          {/* 기타: 홈페이지 */}
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {!hideNav && (
        <NavBar
          userEmail={userEmail}
          walletAddress={walletAddress}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}

function App() {
  const [userEmail, setUserEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setAuthChecked(true);
        return;
      }
      try {
        // 상대경로 '/api/user/me' 로 호출
        const res = await axios.get("/api/user/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data.user || res.data;
        setUserEmail(data.email);
        setWalletAddress(data.walletAddress || "");
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        setUserEmail("");
        setWalletAddress("");
      }
      setAuthChecked(true);
    };
    fetchUser();
  }, []);

  if (!authChecked) return <div>로딩 중...</div>;

  return (
    <Router>
      <AppContent
        userEmail={userEmail}
        setUserEmail={setUserEmail}
        walletAddress={walletAddress}
        setWalletAddress={setWalletAddress}
        authChecked={authChecked}
      />
    </Router>
  );
}

export default App;
