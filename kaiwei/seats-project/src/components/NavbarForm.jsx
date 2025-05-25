// src/components/NavbarForm.jsx
import React, { useEffect, useState } from 'react';
import '../styles/Navbar.css';

export default function NavbarForm({ open, onClose, currentTitle, onSave }) {
  const [input, setInput] = useState(currentTitle);

  // Reset input when modal re-opens
  useEffect(() => { if (open) setInput(currentTitle); }, [open, currentTitle]);

  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal table-form">
        <h3>編輯商家資訊</h3>

        {/* Logo 圖片 */}
        <img
          src="/img/logo.png"
          alt="logo"
          style={{ display: 'block', margin: '0 auto', maxWidth: '120px' }}
        />

        {/* 標題輸入框 */}
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start', // ✨ 讓文字靠左
            gap: '0.5rem',
            marginTop: '1rem',
          }}
        >
          <span style={{ textAlign: 'left'}}>網頁標題</span>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Seats Viewer"
          />
        </label>

        {/* Modal Actions */}
        <div className="modal-actions">
          <button
            onClick={() => {
              const title = input.trim() || 'Seats Viewer';
              onSave(title);
              onClose();
            }}
          >
            儲存
          </button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  );
}