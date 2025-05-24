import React, { useState, useEffect, useRef } from 'react';
import '../styles/Navbar.css';

export default function Navbar({
  hideMenu,
  isEditingBg,
  startBgEdit,
  cancelBgEdit,
  confirmBgEdit,
  zoom,
  setZoom,
  offsetPx, 
  mode,
  menuOpen,
  setMenuOpen,
  setMode,
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
  hasOverlapAdd,
  hasOverlapMove
}) {
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState('');
  const popupRef = useRef(null);

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

  // 匯出 CSV
  const exportCSV = () => {
    // ① 背景設定（offset & zoom）
    const bgHeader = ['offset_x', 'offset_y', 'zoom'];
    const bgRow    = [offsetPx.x, offsetPx.y, zoom];
  
    // ② 桌位表頭
    const tableHeader = [
      'table_id', 'index', 'name', 'left', 'top', 'width', 'height',
      'capacity', 'occupied', 'extraSeatLimit', 'tags',
      'description', 'updateTime', 'available', 'floor'
    ];
    const FLOOR = '1F';
  
    // ③ 桌位資料列
    const tableRows = sortedTables.map(t => [
      t.table_id,
      t.index,
      `"${t.name.replace(/"/g, '""')}"`,
      t.left,
      t.top,
      t.width,
      t.height,
      t.capacity,
      t.occupied,
      t.extraSeatLimit,
      Array.isArray(t.tags)
        ? `"${t.tags.join(',').replace(/"/g, '""')}"` : '""',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.updateTime || '',
      t.available,
      t.floor || FLOOR
    ]);
  
    // ④ 組合 CSV 文字
    const csvLines = [
      [...bgHeader, ...tableHeader].join(','),   // 全表頭
      [...bgRow,    ...Array(tableHeader.length).fill('')].join(','), // 背景設定列
      ...tableRows.map(r => ['', '', '', ...r].join(','))            // 每列桌子資料
    ];
    const csvText = csvLines.join('\r\n');
  
    // ⑤ 下載
    const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'table_data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  

  return (
    <div className="navbar-wrapper">
      {/* 上層 TopBar */}
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
              disabled={isTableAction}
            >
              營業模式
            </button>
            <button
              className={mode === 'edit' ? 'active' : ''}
              onClick={() => setMode('edit')}
              disabled={isTableAction}
            >
              編輯模式
            </button>
            <button
              className={mode === 'view' ? 'active' : ''}
              onClick={() => setMode('view')}
              disabled={isTableAction}
            >
              觀察模式
            </button>

            {/* 漢堡選單：匯出 & QR */}
            <div className="menu-container" ref={popupRef}>
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

              {menuOpen && (
                <div className="menu-dropdown">
                  <button onClick={exportCSV}>匯出桌位資料</button>
                  <button
                    onClick={() => setShowQRCodeOptions(v => !v)}
                  >
                    取得 QR code
                  </button>
                  {showQRCodeOptions && (
                    <div className="qr-options">
                      <select
                        value={selectedTableForQR}
                        onChange={e => setSelectedTableForQR(e.target.value)}
                      >
                        <option value="">選擇桌號</option>
                        {sortedTables.map(t => (
                          <option key={t.table_id} value={t.table_id}>
                            桌號 {t.name} ({t.table_id})
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
            </div>
          </div>
        )}
      </div>

      {/* 下層 BottomBar */}
      <nav className="bottombar">
        <div className="mode-display">
          {mode === 'business'
            ? '目前模式：營業模式'
            : mode === 'edit'
            ? ''
            : ''}
        </div>

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
              <button
                onClick={confirmDeleteTable}
                disabled={!selectedToDeleteTable}
              >
                確認刪除
              </button>
              <button onClick={cancelDeleteTableMode}>取消刪除</button>
            </>
          ) : isEditingBg ? (
            <>
              <button onClick={confirmBgEdit}>儲存變更</button>
              <button onClick={cancelBgEdit}>取消變更</button>
              <label className="zoom-slider">
              縮放：
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.01"
                value={zoom}
                onChange={e => setZoom(parseFloat(e.target.value))}
              />
              {zoom.toFixed(2)}×
            </label>
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
              <button onClick={startBgEdit}>背景圖片</button>
            </>
          )
        )}

        {mode === 'view' && (
          <button
            className="go-guest-button"
            onClick={() => window.open('/guest', '_blank')}
          >
            查看顧客視角
          </button>
        )}
      </nav>
    </div>
  );
}
