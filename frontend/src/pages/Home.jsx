import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1>UpcycleFuture</h1>
          <p>버려지는 자원을 새로운 가치로 바꾸는 마켓</p>
          <Link to="/products" className="hero-button">상품 보러가기</Link>
        </div>
      </section>
      <section className="features">
        <div className="feature">
          <h3>품질 보장</h3>
          <p>선별된 업사이클 제품만을 제공합니다.</p>
        </div>
        <div className="feature">
          <h3>친환경</h3>
          <p>지속 가능한 소비로 환경을 지켜요.</p>
        </div>
        <div className="feature">
          <h3>커뮤니티</h3>
          <p>모두가 함께 만들어가는 업사이클 생태계.</p>
        </div>
      </section>
    </div>
  );
}