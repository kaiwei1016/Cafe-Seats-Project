import React, { useState, useEffect, useRef } from 'react';
import '../styles/Navbar.css';

export default function Navbar({
  hideMenu,
  mode, menuOpen, setMenuOpen, setMode, tables,
  addTable, pendingTable, cancelAddTable, confirmAddTable,
  startDeleteTableMode, deleteTableMode, selectedToDeleteTable,
  confirmDeleteTable, cancelDeleteTableMode,
  startMoveTableMode, moveTableMode, selectedToMoveTable,
  confirmMoveTable, cancelMoveTableMode,
  hasOverlapAdd, hasOverlapMove
}) {
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState('');
  const popupRef = useRef(null);

  // 點擊外部關閉
  useEffect(() => {
    const onClickOutside = e => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowQRCodeOptions(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen, setMenuOpen]);

  const isTableAction = deleteTableMode || moveTableMode;
  const sortedTables = [...tables].sort((a, b) => a.index - b.index);

  return (
    <div className="navbar-wrapper">
      {/* ─────── 上層 TopBar ─────── */}
      <div className="topbar">
        <div className="topbar-left">
          <img src="/img/logo.png" alt="logo" className="topbar-logo" />
          <span className="topbar-title">Seats Viewer</span>
        </div>

        {!hideMenu && (
          <div className="topbar-right">
            <button
              className={mode === 'business' ? 'active' : ''}
              onClick={() => setMode('business')}
            >營業模式</button>
            <button
              className={mode === 'edit' ? 'active' : ''}
              onClick={() => setMode('edit')}
            >編輯模式</button>
            <button
              className={mode === 'view' ? 'active' : ''}
              onClick={() => setMode('view')}
            >觀察模式</button>

            {/* 漢堡選單容器 (只剩 QR) */}
            <div className="menu-container" ref={popupRef}>
              <button
                className="menu-button"
                onClick={() => {
                  setShowQRCodeOptions(false);
                  setMenuOpen(v => !v);
                }}
                disabled={isTableAction}
              >☰</button>

              {menuOpen && (
                <div className="menu-dropdown">
                  <button
                    onClick={() => setShowQRCodeOptions(v => !v)}
                  >取得 QR code</button>

                  {showQRCodeOptions && (
                    <div className="qr-options">
                      <select
                        value={selectedTableForQR}
                        onChange={e => setSelectedTableForQR(e.target.value)}
                      >
                        <option value="">選擇桌號</option>
                        {sortedTables.map(t => (
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
            </div>
          </div>
        )}
      </div>

      {/* ─────── 下層 BottomBar （舊 Navbar） ─────── */}
      {!hideMenu && (
        <nav className="bottombar">
          {/* 目前模式顯示 */}
          <div className="mode-display">
            {mode === 'business'
              ? '目前模式：營業模式'
              : mode === 'edit'
                ? ''
                : ''}
          </div>

          {/* 編輯模式操作按鈕 */}
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
                  disabled={!selectedToMoveTable || hasOverlapMove}
                  style={{ color: hasOverlapMove ? 'red' : undefined }}
                >
                  {hasOverlapMove ? '桌子重疊' : '確認移動'}
                </button>
                <button onClick={cancelMoveTableMode}>取消移動</button>
              </>
            ) : deleteTableMode ? (
              <>
                <button onClick={confirmDeleteTable} disabled={!selectedToDeleteTable}>
                  確認刪除
                </button>
                <button onClick={cancelDeleteTableMode}>取消刪除</button>
              </>
            ) : (
              <>
                <button onClick={addTable}>新增桌子</button>
                <button onClick={() => { startDeleteTableMode(); setMenuOpen(false); }}>刪除桌子</button>
                <button onClick={() => { startMoveTableMode(); setMenuOpen(false); }}>移動桌子</button>
              </>
            )
          )}


          {/* 觀察模式顧客版按鈕 */}
          {mode === 'view' && (
            <button className="go-guest-button" onClick={() => window.open('/guest', '_blank')}>
              查看顧客視角
            </button>
          )}
        </nav>
      )}
    </div>
  );
}
