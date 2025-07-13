import React from "react";
import "./Modal.css";

export default function SignupModal({ open, message, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop">
      <div className="modal-window">
        <div className="modal-content">{message}</div>
        <button className="modal-close-btn" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}