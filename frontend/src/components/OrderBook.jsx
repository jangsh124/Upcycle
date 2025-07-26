// ── src/components/OrderBook.jsx ──
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import OrderBookUtil from "../utils/OrderBook";
import "./OrderBook.css";

export default function OrderBook({ productId }) {
  // ① util 클래스 인스턴스 생성
  const bookRef = useRef(new OrderBookUtil());
  const [, redraw] = useState(0); // 강제 렌더링 트리거

  // 주문 폼 상태
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceLimit, setPriceLimit] = useState(null);
  const [quantityLimit, setQuantityLimit] = useState(null);

  // ② 주문장 데이터 불러오기(useEffect 내부에 정의)
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get(`/api/orders/book/${productId}`);
        bookRef.current.setBook({
          buyOrders:  res.data.buyOrders   || [],
          sellOrders: res.data.sellOrders  || []
        });
        redraw(n => n + 1);
      } catch (err) {
        console.error(err);
      }
    };
    if (productId) fetchOrders();
  }, [productId]);

  // ③ 주문 생성
  const placeOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      await axios.post(
        "/api/orders",
        { productId, type: side, price, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // 폼 초기화
      setPrice("");
      setQuantity(1);
      setPriceLimit(null);
      setQuantityLimit(null);
      // 주문장 갱신
      const res = await axios.get(`/api/orders/book/${productId}`);
      bookRef.current.setBook({
        buyOrders:  res.data.buyOrders   || [],
        sellOrders: res.data.sellOrders  || []
      });
      redraw(n => n + 1);
    } catch (err) {
      alert(err.response?.data?.error || "주문 실패");
    }
  };

  // ④ 매도호가 클릭 시 가격·수량 제한 설정
  const handleSelectAsk = (order) => {
    setSide("buy");
    setPrice(order.price.toString());
    setPriceLimit(order.price);
    setQuantity(1);
    setQuantityLimit(order.remaining);
  };

  // 렌더링할 데이터
  const buyOrders  = bookRef.current.bids;
  const sellOrders = bookRef.current.asks;

  return (
    <div className="order-book">
      <h3>오더북</h3>
      <div className="order-form">
        <select value={side} onChange={e => setSide(e.target.value)}>
          <option value="buy">매수</option>
          <option value="sell">매도</option>
        </select>
        <input
          type="number"
          placeholder="가격"
          value={price}
          max={priceLimit ?? undefined}
          onChange={e => {
            const v = e.target.value;
            setPrice(priceLimit && parseFloat(v) > priceLimit
              ? String(priceLimit)
              : v
            );
          }}
        />
        <input
          type="number"
          min="1"
          placeholder="수량"
          value={quantity}
          max={quantityLimit ?? undefined}
          onChange={e => {
            const v = e.target.value;
            setQuantity(quantityLimit && parseInt(v, 10) > quantityLimit
              ? quantityLimit
              : v
            );
          }}
        />
        <button onClick={placeOrder}>주문하기</button>
      </div>
      <div className="order-lists">
        <div className="order-list">
          <h4>매수</h4>
          <ul>
            {buyOrders.map((o, i) => (
              <li key={i}>
                {o.price.toLocaleString()}원 — 남은 {o.remaining}개
              </li>
            ))}
          </ul>
        </div>
        <div className="order-list">
          <h4>매도</h4>
          <ul>
            {sellOrders.map((o, i) => (
              <li key={i} onClick={() => handleSelectAsk(o)}>
                {o.price.toLocaleString()}원 — 남은 {o.remaining}개
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
