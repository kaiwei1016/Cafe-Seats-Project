import React, { useState, useEffect, useRef } from 'react';
import './KCafe.css';

// Navbar: 頂部導覽列，包含模式切換、桌子操作按鈕、QR Code 生成選單
const Navbar = ({
  mode, menuOpen, setMenuOpen, setMode, tables,
  addTable, pendingTable, cancelAddTable, confirmAddTable,
  startDeleteTableMode, deleteTableMode, selectedToDeleteTable,
  confirmDeleteTable, cancelDeleteTableMode,
  startMoveTableMode, moveTableMode,selectedToMoveTable,
  confirmMoveTable,cancelMoveTableMode,
  hasOverlapAdd, hasOverlapMove
}) => {
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState('');
  const menuRef = useRef(null);

  // 點擊漢堡選單外部時，關閉選單和 QR Code 選項
  useEffect(() => {
    const onClickOutside = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowQRCodeOptions(false);
      }
    };
    if (menuOpen) {
      document.addEventListener('mousedown', onClickOutside);
    }
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen, setMenuOpen]);

  // 桌子操作模式下鎖住選單按鈕
  const isTableAction = deleteTableMode || moveTableMode;

  return (
    <nav className="navbar" ref={menuRef}>
      {/* 顯示目前模式 */}
      <div className="mode-display">
        目前模式：{mode === 'business' ? '營業模式' : mode === 'edit' ? '編輯模式' : '觀察模式'}
      </div>

      {/* 漢堡選單按鈕 */}
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

      {/* 編輯模式的桌子操作按鈕 */}
      {mode === 'edit' && (
        pendingTable ? (
          <>
            <button
              onClick={confirmAddTable}
              disabled={hasOverlapAdd}
              style={{ color: hasOverlapAdd ? 'red' : undefined }}
            >
              {hasOverlapAdd ? '桌子重疊' : '確認新增'}
            </button>
            <button onClick={cancelAddTable}>取消新增</button>
          </>
        ) : moveTableMode ? (
          <>
      <button
        onClick={confirmMoveTable}
        disabled={selectedToMoveTable == null || hasOverlapMove}
        style={{ color: hasOverlapMove ? 'red' : undefined }}
      >
        {hasOverlapMove ? '桌子重疊' : '確認移動'}
      </button>
      <button onClick={cancelMoveTableMode}>取消移動</button>
    </>
        ) : deleteTableMode ? (
          <>
            <button onClick={confirmDeleteTable} disabled={selectedToDeleteTable == null}>確認刪除</button>
            <button onClick={cancelDeleteTableMode}>取消刪除</button>
          </>
        ) : (
<>
  <button onClick={addTable}>新增桌子</button>
  <button
    onClick={() => {
      startDeleteTableMode();
      setMenuOpen(false);
    }}
  >
    刪除桌子
  </button>
  <button
    onClick={() => {
      startMoveTableMode();
      setMenuOpen(false);
    }}
  >
    移動桌子
  </button>
</>
        )
      )}

      {/* 漢堡選單下拉內容 */}
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
              <button disabled={!selectedTableForQR}>下載</button>
            </div>
          )}
        </div>
      )}

      {/* 觀察模式：顧客版鏈結 */}
      {mode === 'view' && (
        <button className="go-guest-button" onClick={() => window.open('/guest', '_blank')}>查看顧客視角</button>
      )}
    </nav>
  );
};

export default Navbar;
