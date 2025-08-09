
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { regionData, SIDO_LIST } from "../regionData";
import getImageUrl from "../utils/getImageUrl";
import "./productForm.css";

export default function ProductForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const editId = params.get("edit");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tokenCount, setTokenCount] = useState(10000);
  const [sharePercentage, setSharePercentage] = useState(30);
  const [msg, setMsg] = useState("");
  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const sharePctValid = (sharePercentage >= 30 && sharePercentage <= 49) || sharePercentage === 100;
  const formValid = sharePctValid;
  const getFileInfoText = () => {
    const parts = [];
    if (newFiles.length) parts.push(newFiles.map(f => f.name).join(', '));
    if (existingImages.length) parts.push(`기존 이미지 ${existingImages.length}개`);
    return parts.length ? parts.join(', ') : '선택된 파일이 없습니다.';
  };

  useEffect(() => {
    // 0.001% 단위 계산은 calculateUnitPrice 함수에서 처리
  }, [price, sharePercentage]);

  // 0.001% 단위 계산 함수
  const calculateShareUnits = () => {
    const pct = parseFloat(sharePercentage) / 100 || 0;
    return Math.round(pct * 100000); // 0.001% 단위로 변환 (소수점 3자리)
  };

  const calculateUnitPrice = () => {
    const p = parseFloat(price) || 0;
    const pct = parseFloat(sharePercentage) / 100 || 0;
    const totalSale = p * pct; // 총 판매 금액
    const units = calculateShareUnits(); // 0.001% 단위 개수
    return units > 0 ? Math.round(totalSale / units) : 0; // 0.001% 단위당 가격
  };
  // 수정 모드면 기존 값 불러오기
  useEffect(() => {
    if (!editId) return;
    const token = localStorage.getItem("token");
    axios
              .get(`/api/products/${editId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const p = res.data;
        setTitle(p.title || "");
        setDescription(p.description || "");
        setPrice(p.price || "");
        setTokenCount(p.tokenCount || 10000);
        if (p.sharePercentage !== undefined) {
          setSharePercentage(p.sharePercentage);
        }
        setSido(p.location?.sido || "");
        setGugun(p.location?.gugun || "");
        setMainImageIndex(p.mainImageIndex ?? 0);
        setExistingImages(Array.isArray(p.images) ? p.images : []);
      })
      .catch(() => setMsg("상품 정보를 불러오는 데 실패했습니다."));
  }, [editId]);

  const handleImageChange = e => {
    const files = Array.from(e.target.files);
    if (existingImages.length + newFiles.length + files.length > 6) {
      setMsg("최대 6개의 이미지를 선택할 수 있습니다.");
      return;
    }
    setNewFiles(prev => [...prev, ...files]);
    e.target.value = "";
  };

  const removeExistingImage = idx => {
    setExistingImages(imgs => imgs.filter((_, i) => i !== idx));
    if (idx === mainImageIndex) setMainImageIndex(0);
    else if (idx < mainImageIndex) setMainImageIndex(mi => mi - 1);
  };

  const removeNewFile = idx => {
    const di = existingImages.length + idx;
    setNewFiles(fs => fs.filter((_, i) => i !== idx));
    if (di === mainImageIndex) setMainImageIndex(0);
    else if (di < mainImageIndex) setMainImageIndex(mi => mi - 1);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) { setMsg("로그인이 필요합니다."); return; }
    if (existingImages.length + newFiles.length < 2) {
      setMsg("최소 2개의 이미지를 선택해주세요."); return;
    }
    if (!sido || !gugun) {
      setMsg("지역을 선택해주세요."); return;
    }
    if (!sharePctValid) {
      setMsg("판매 비율은 30-49% 또는 100%만 가능합니다.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("tokenCount", tokenCount);
    const supply = calculateShareUnits(); // 0.01% 단위로 변환된 수량
    const pricePerToken = calculateUnitPrice(); // 0.01% 단위당 가격
    formData.append('tokenSupply', supply.toString());
    formData.append('tokenPrice', pricePerToken.toString());
    formData.append('sharePercentage', sharePercentage.toString());
    formData.append('unitPrice', pricePerToken.toString());
// 변경: location 단일 키로 JSON 문자열을 전송
    formData.append("location", JSON.stringify({ sido, gugun }));
    formData.append("mainImageIndex", mainImageIndex);
    formData.append("existingImages", JSON.stringify(existingImages));
    newFiles.forEach(f => formData.append("images", f));

    try {
      if (editId) {
        await axios.patch(
          `/api/products/${editId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMsg("상품이 성공적으로 수정되었습니다!");
        setTimeout(() => navigate(`/products/${editId}`), 1000);
      } else {
        await axios.post(
          "/api/products",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMsg("상품이 성공적으로 등록되었습니다!");
        setTimeout(() => navigate("/products"), 1000);
      }
    } catch (err) {
      setMsg("전송에 실패했습니다: " + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="product-form-container">
      <h2 className="form-title">{editId ? "상품 수정" : "상품 등록"}</h2>
      <form className="product-form" onSubmit={handleSubmit}>
        <input
          className="form-input"
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <textarea
          className="form-textarea"
          placeholder="설명"
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />

        <div className="location-select">
          <select
            value={sido}
            onChange={e => { setSido(e.target.value); setGugun(""); }}
            required
          >
            <option value="">시/도 선택</option>
            {SIDO_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={gugun}
            onChange={e => setGugun(e.target.value)}
            required
            disabled={!sido}
          >
            <option value="">구/군 선택</option>
            {(regionData[sido] || []).map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div className="price-input-container">
          <input
            className="form-input"
            placeholder="가격"
            type="text"
            value={price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            onChange={e => {
              const v = e.target.value.replace(/,/g, '');
              if (/^\d*$/.test(v)) setPrice(v);
            }}
            required
          />
          <span className="price-unit">원</span>
        </div>

        <div className="share-percentage-container">
          <label>
            판매할 지분 선택
            <select
              value={sharePercentage}
              onChange={e => setSharePercentage(Number(e.target.value))}
            >
              {Array.from({ length: 20 }, (_, i) => 30 + i).map(v => (
                <option key={v} value={v}>{v}%</option>
              ))}
              <option value={100}>100%</option>
            </select>
          </label>
          {!sharePctValid && (
            <div className="helper-text">30~49% 또는 100%만 선택 가능합니다.</div>
          )}
        </div>

        <div className="token-price-info">
          <div>상품 가격: {parseFloat(price || 0).toLocaleString()}원</div>
          <div>판매 지분: {sharePercentage}%</div>
          <div>0.001% 지분당 가격: {calculateUnitPrice().toLocaleString()}원</div>
          <div>총 판매 금액: {(parseFloat(price || 0) * sharePercentage / 100).toLocaleString()}원</div>
        </div>


<div className="token-count-container">
          <input
            type="range"
            min="50"
            max="10000"
            value={tokenCount}
            onChange={e => setTokenCount(Number(e.target.value))}
          />
          
        </div>

        <input
          className="form-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />
        <div className="file-info">{getFileInfoText()}</div>

        {/* 이미지 미리보기와 대표 이미지 선택 기능 */}
        {(existingImages.length > 0 || newFiles.length > 0) && (
          <div className="image-preview-container">
            {[...existingImages, ...newFiles.map(f => URL.createObjectURL(f))]
              .map((src, idx) => {
                const url = idx < existingImages.length ? getImageUrl(src) : src;
                return (
                  <div
                    key={idx}
                    className={`image-preview-item ${idx === mainImageIndex ? 'main-selected' : ''}`}
                  >
                    <img
                      src={url}
                      alt={`preview-${idx}`}
                      onClick={() => setMainImageIndex(idx)}
                    />
                    <button
                      type="button"
                      className="image-remove-btn"
                      onClick={() => (idx < existingImages.length ? removeExistingImage(idx) : removeNewFile(idx - existingImages.length))}
                    >×</button>
                    {idx === mainImageIndex && <span className="main-badge">대표</span>}
                  </div>
                );
              })}
          </div>
        )}

        <button type="submit" className="form-submit-btn" disabled={!formValid}>
          {editId ? "수정 완료" : "등록 완료"}
        </button>
      </form>
      {msg && <div className="form-msg">{msg}</div>}
    </div>
  );
}
