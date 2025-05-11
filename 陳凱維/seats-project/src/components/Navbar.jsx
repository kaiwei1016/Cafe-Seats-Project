import React, { useState, useEffect, useRef } from 'react';
import './KCafe.css';

const Navbar = ({
  mode,
  menuOpen,
  setMenuOpen,
  setMode,
  positions,
  tables,
  addTable,
  pendingTable,
  cancelAddTable,
  confirmAddTable,
  startDeleteTableMode,
  deleteTableMode,
  selectedToDeleteTable,
  confirmDeleteTable,
  cancelDeleteTableMode,
  startMoveTableMode,
  moveTableMode,
  selectedToMoveTable,
  confirmMoveTable,
  cancelMoveTableMode,

}) => {
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState(''); 
  const menuRef = useRef(null);

  // 點擊漢堡以外區域自動關閉
  useEffect(() => {
    const onClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowQRCodeOptions(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen, setMenuOpen]);

  // 在桌子操作模式（刪除或移動）時鎖住漢堡選單
  const isTableAction = deleteTableMode || moveTableMode;

  return (
    <nav className="navbar" ref={menuRef}>
      {/* 模式顯示 */}
      <div className="mode-display">
        目前模式：{mode === 'business' ? '營業模式' : mode === 'edit' ? '編輯模式' : '觀察模式'}
      </div>

      {/* ☰ 漢堡選單 */}
      <button
        className="menu-button"
        onClick={() => {
          setShowQRCodeOptions(false);
          setMenuOpen(v => !v);
        }}
        disabled={isTableAction}
      >
        ☰
      </button>

      {/* 編輯模式下：新增／刪除／移動桌子 */}
      {mode === 'edit' && (
                /* 如果有 pendingTable，先顯示「確認新增／取消新增」 */
                pendingTable ? (
                  <>
                    <button onClick={confirmAddTable}>
                      確認新增
                    </button>
                    <button onClick={cancelAddTable}>
                      取消新增
                    </button>
                  </>
                ) : 
        moveTableMode ? (
          /* 移動桌子模式：顯示 確認移動／取消移動 */
          <>
            <button
              onClick={confirmMoveTable}
              disabled={selectedToMoveTable == null}
            >
              確認移動
            </button>
            <button onClick={cancelMoveTableMode}>
              取消移動
            </button>
          </>
        ) : deleteTableMode ? (
          /* 刪除桌子模式：顯示 確認刪除／取消刪除 */
          <>
            <button
              onClick={confirmDeleteTable}
              disabled={selectedToDeleteTable == null}
            >
              確認刪除
            </button>
            <button onClick={cancelDeleteTableMode}>
              取消刪除
            </button>
          </>
        ) : (
          /* 編輯預設：顯示 新增／刪除／移動 */
          <>
            <button onClick={addTable}>新增桌子</button>
            <button onClick={startDeleteTableMode}>刪除桌子</button>
            <button onClick={startMoveTableMode}>移動桌子</button>
          </>
        )
      )}

      {/* 漢堡選單內容 */}
      {menuOpen && (
        <div className="menu-dropdown">
          <button onClick={() => { setMode('business'); setMenuOpen(false); }}>營業模式</button>
          <button onClick={() => { setMode('edit');     setMenuOpen(false); }}>編輯模式</button>
          <button onClick={() => { setMode('view');     setMenuOpen(false); }}>觀察模式</button>
          <button onClick={() => setShowQRCodeOptions(v => !v)}>取得 QR code</button>

          {showQRCodeOptions && (
            <div className="qr-options">
              <select
                value={selectedTableForQR}
                onChange={e => setSelectedTableForQR(e.target.value)}
              >
                <option value="">選擇桌號</option>
                {tables.map(t => (
                  <option key={t.index} value={t.id}>
                    桌號 {t.id} (# {t.index})
                  </option>
                ))}
              </select>
              <button disabled={!selectedTableForQR}>
                下載
              </button>
            </div>
          )}
        </div>
      )}

      {/* 觀察模式：切到顧客版 */}
      {mode === 'view' && (
        <button
          className="go-guest-button"
          onClick={() => window.open('/guest', '_blank')}
        >
          查看顧客版
        </button>
      )}
    </nav>
  );
};

export default Navbar;
