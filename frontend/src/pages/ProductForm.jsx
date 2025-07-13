
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import { regionData, SIDO_LIST } from "../regionData";
import "./productForm.css";

export default function ProductForm() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const editId = params.get("edit");

  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [sido, setSido] = useState("");
  const [gugun, setGugun] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [msg, setMsg] = useState("");

  // 수정 모드면 기존 값 불러오기
  useEffect(() => {
    if (!editId) return;
    const token = localStorage.getItem("token");
    axios
      .get(`http://localhost:5001/api/products/${editId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(res => {
        const p = res.data;
        setTitle(p.title || "");
        setDesc(p.description || "");
        setPrice(p.price || "");
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

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("price", price);
    formData.append("sido", sido);
    formData.append("gugun", gugun);
    formData.append("mainImageIndex", mainImageIndex);
    formData.append("existingImages", JSON.stringify(existingImages));
    newFiles.forEach(f => formData.append("images", f));

    try {
      if (editId) {
        await axios.patch(
          `http://localhost:5001/api/products/${editId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMsg("상품이 성공적으로 수정되었습니다!");
        setTimeout(() => navigate(`/products/${editId}`), 1000);
      } else {
        await axios.post(
          "http://localhost:5001/api/products",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMsg("상품이 성공적으로 등록되었습니다!");
        setTimeout(() => navigate("/"), 1000);
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
          onChange={e => setDesc(e.target.value)}
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

        <input
          className="form-file-input"
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
        />

        {/* 이미지 미리보기와 대표 이미지 선택 기능 */}
        {(existingImages.length > 0 || newFiles.length > 0) && (
          <div className="image-preview-container">
            {[...existingImages, ...newFiles.map(f => URL.createObjectURL(f))]
              .map((src, idx) => (
                <div
                  key={idx}
                  className={`image-preview-item ${idx === mainImageIndex ? 'main-selected' : ''}`}
                >
                  <img
                    src={src}
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
              ))}
          </div>
        )}

        <button type="submit" className="form-submit-btn">
          {editId ? "수정 완료" : "등록 완료"}
        </button>
      </form>
      {msg && <div className="form-msg">{msg}</div>}
    </div>
  );
}
