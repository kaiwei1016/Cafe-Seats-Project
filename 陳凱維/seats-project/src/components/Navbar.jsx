import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './KCafe.css';

const Navbar = ({
  mode,
  menuOpen,
  setMenuOpen,
  setMode,
  addSeat,
  pendingSeat,
  deleteMode,
  moveMode,
  startDeleteMode,
  confirmDelete,
  cancelDeleteMode,
  startMoveMode,
  confirmMove,
  cancelMoveMode,
  selectedToDelete,
  selectedToMove,
  tempMovePosition,
  confirmSeat,
  cancelAddSeat,
  checkOverlap,
  checkMoveOverlap,
  positions
}) => {
  const navigate = useNavigate();
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);
  const [selectedSeatForQR, setSelectedSeatForQR] = useState('');

  const isMenuLocked = pendingSeat !== null || deleteMode || moveMode;

  return (
    <nav className="navbar">
      {/* 模式顯示 */}
      <div className="mode-display">
        目前模式：{mode === 'business' ? '營業模式' : mode === 'edit' ? '編輯模式' : '觀察模式'}
      </div>

      {/* ☰ 漢堡選單按鈕 */}
      <button
        className="menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        disabled={isMenuLocked}
      >
        ☰
      </button>

      {/* 漢堡選單下拉功能表 */}
      {menuOpen && (
        <div className="menu-dropdown">
          <button onClick={() => { setMode('business'); setMenuOpen(false); }}>營業模式</button>
          <button onClick={() => { setMode('edit'); setMenuOpen(false); }}>編輯模式</button>
          <button onClick={() => { setMode('view'); setMenuOpen(false); }}>觀察模式</button>
          <button onClick={() => setShowQRCodeOptions(!showQRCodeOptions)}>取得 QR code</button>

          {/* QR code 下載區塊 */}
          {showQRCodeOptions && (
            <div className="qr-options">
              <select
                value={selectedSeatForQR}
                onChange={(e) => setSelectedSeatForQR(e.target.value)}
              >
                <option value="">選擇座位</option>
                {positions.map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    Seat {seat.id}
                  </option>
                ))}
              </select>
              <button onClick={() => { /* 尚未實作 */ }}>
                下載
              </button>
            </div>
          )}
        </div>
      )}

      {/* 顧客模式切換按鈕 */}
      {mode === 'view' && (
        <button className="go-guest-button" onClick={() => window.open('/guest', '_blank')}>
          切到顧客版
        </button>
      )}

      {/* 編輯模式下的控制按鈕區塊 */}
      {mode === 'edit' && (
        <div className="edit-controls">

          {/* 新增座位模式 */}
          {pendingSeat ? (
            <>
              <button onClick={confirmSeat} disabled={!checkOverlap()}>
                {checkOverlap() ? '確認新增' : <span className="error-text">座位重疊</span>}
              </button>
              <button onClick={cancelAddSeat}>取消新增</button>
            </>
          )

          /* 刪除座位模式 */
          : deleteMode ? (
            <>
              <button onClick={confirmDelete} disabled={selectedToDelete === null}>確認刪除</button>
              <button onClick={cancelDeleteMode}>取消刪除</button>
            </>
          )

          /* 移動座位模式 */
          : moveMode ? (
            <>
              <button onClick={confirmMove} disabled={selectedToMove === null || !tempMovePosition || !checkMoveOverlap()}>
                {selectedToMove === null || !tempMovePosition
                  ? '確認移動'
                  : (checkMoveOverlap()
                    ? '確認移動'
                    : <span className="error-text">座位重疊</span>
                  )}
              </button>
              <button onClick={cancelMoveMode}>取消移動</button>
            </>
          )

          /* 編輯預設狀態按鈕 */
          : (
            <>
              <button onClick={addSeat}>新增座位</button>
              <button onClick={startDeleteMode}>刪除座位</button>
              <button onClick={startMoveMode}>移動座位</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;