import React, { useState, useRef } from "react";
import "./ProfileEditModal.css";

export default function ProfileEditModal({ user, onClose, onSave }) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState(user.bio || "");
  const [previewImage, setPreviewImage] = useState(
            user.profileImage ? `${user.profileImage}` : "/default-profile.png"
  );
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result); // 미리보기 이미지
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("bio", bio);
    if (selectedFile) {
      formData.append("profileImage", selectedFile); // 파일 포함
    }
    onSave(formData); // formData로 전달
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>프로필 수정</h3>

        <div className="profile-edit-image-wrapper">
          <img
            src={previewImage}
            alt="Preview"
            className="profile-preview-img"
            style={{
              width: "100px",
              height: "100px",
              borderRadius: "50%",
              objectFit: "cover",
              display: "block",
              margin: "0 auto"
            }}
          />
          <button
            onClick={() => fileInputRef.current.click()}
            className="edit-image-btn"
            style={{
              marginTop: "10px",
              padding: "6px 12px",
              background: "#2471e7",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            이미지 선택
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        <label>이름</label>
        <input value={name} onChange={(e) => setName(e.target.value)} />

        <label>소개</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} />

        <div className="modal-actions">
          <button onClick={onClose}>취소</button>
          <button onClick={handleSubmit}>저장</button>
        </div>
      </div>
    </div>
  );
}
