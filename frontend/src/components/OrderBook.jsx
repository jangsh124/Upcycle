import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderBook.css";

export default function OrderBook({ productId }) {
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`/orders/book/${productId}`);
      setBuyOrders(res.data.buys || []);
      setSellOrders(res.data.sells || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (productId) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const placeOrder = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    try {
      await axios.post(
        "/orders",
        {
          productId,
          side,
          price: parseFloat(price),
          quantity: parseInt(quantity, 10),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrice("");
      setQuantity(1);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "주문 실패");
    }
  };

  return (
    <div className="order-book">
      <h3>오더북</h3>
      <div className="order-form">
        <select value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="buy">매수</option>
          <option value="sell">매도</option>
        </select>
        <input
          type="number"
          placeholder="가격"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
        <input
          type="number"
          min="1"
          placeholder="수량"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <button onClick={placeOrder}>주문하기</button>
      </div>
      <div className="order-lists">
        <div className="order-list">
          <h4>매수</h4>
          <ul>
            {buyOrders.map((o) => (
              <li key={o._id}>{o.price}원 ({o.quantity - o.filled})</li>
            ))}
          </ul>
        </div>
        <div className="order-list">
          <h4>매도</h4>
          <ul>
            {sellOrders.map((o) => (
              <li key={o._id}>{o.price}원 ({o.quantity - o.filled})</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}