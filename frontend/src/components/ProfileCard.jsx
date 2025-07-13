import React from "react";
import "./ProfileCard.css";

export default function ProfileCard({ user, onEditClick }) {
  const getImageSrc = () => {
    if (!user.profileImage) return "/default-profile.png";
    if (user.profileImage.startsWith("/uploads")) {
      return `http://localhost:5001${user.profileImage}`;
    }
    return user.profileImage;
  };

  // undefined가 아닐 때만 출력!
  if (user && user.profileImage) {
    console.log("user.profileImage:", user.profileImage);
  }

  return (
    <div className="profile-card">
      <div className="profile-img">
        <img src={getImageSrc()} alt="Profile" />
      </div>
      <div className="profile-name">{user.name || user.email?.split("@")[0]}</div>
      <div className="profile-email">{user.email}</div>
      {onEditClick && (
        <button className="edit-profile-btn" onClick={onEditClick}>
          프로필 편집
        </button>
      )}
    </div>
  );
}
