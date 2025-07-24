import React, { useEffect, useState } from "react";
import axios from "axios";
import "./OrderBook.css";

export default function OrderBook({ productId }) {
  const [buyOrders, setBuyOrders] = useState([]);
  const [sellOrders, setSellOrders] = useState([]);
  const [side, setSide] = useState("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [priceLimit, setPriceLimit] = useState(null);
  const [quantityLimit, setQuantityLimit] = useState(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`/api/orders/book/${productId}`);
      setBuyOrders(res.data.buyOrders || []);
      const sells = res.data.sells || [];
      sells.sort((a, b) => a.price - b.price);
      setSellOrders(sells);
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
        "/api/orders",
        {
          productId,
          type: side,
          price,
          quantity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPrice("");
      setQuantity(1);
      setPriceLimit(null);
      setQuantityLimit(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.error || "주문 실패");
    }
  };

  const handleSelectAsk = (order) => {
    const remaining = order.quantity - order.filled;
    setPrice(order.price.toString());
    setPriceLimit(order.price);
    setQuantity(1);
    setQuantityLimit(remaining);
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
          max={priceLimit ?? undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (priceLimit && parseFloat(v) > priceLimit) {
              setPrice(String(priceLimit));
            } else {
              setPrice(v);
            }
          }}
        />
        <input
          type="number"
          min="1"
          placeholder="수량"
          value={quantity}
          max={quantityLimit ?? undefined}
          onChange={(e) => {
            const v = e.target.value;
            if (quantityLimit && parseInt(v, 10) > quantityLimit) {
              setQuantity(quantityLimit);
            } else {
              setQuantity(v);
            }
          }}
        />
        <button onClick={placeOrder}>주문하기</button>
      </div>
      <div className="order-lists">
        <div className="order-list">
          <h4>매수</h4>
          <ul>
            {buyOrders.map((o) => (
              <li key={o._id}>{o.price}원 ({o.remainingQuantity})</li>
            ))}
          </ul>
        </div>
        <div className="order-list">
          <h4>매도</h4>
          <ul>
             {sellOrders.map((o) => {
              const remaining = o.quantity - o.filled;
              return (
                <li key={o._id} onClick={() => handleSelectAsk(o)}>
                  {o.price} → {remaining}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}