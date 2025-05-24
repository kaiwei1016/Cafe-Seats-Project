// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Navbar.css';

export default function Navbar({
  hideMenu,
  openBgForm,
  bgCropData,
  onImportData,
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
  const fileInputRef = useRef(null);

  // 觸發檔案選擇
  const handleImportClick = () => {
    fileInputRef.current.value = null; 
    fileInputRef.current.click();
  };

  // 讀檔並解析
  const handleFileChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const lines = evt.target.result.split(/\r?\n/);
      // 1. 讀背景裁切資料
      const [cropX, cropY, cropW, cropH] = lines[1]
        .split(',')
        .map(v => parseFloat(v) || 0);
      const bgCrop = { x: cropX, y: cropY, width: cropW, height: cropH };

      // 2. 讀桌子欄位名稱（第 4 列）
      const header = lines[3].split(',');

      // 3. 讀桌子資料（第 5 列以後）
      const tableRows = lines.slice(4).filter(l => l.trim() !== '');
      const importedTables = tableRows.map(row => {
        const cols = row.split(',');
        const obj = {};
        header.forEach((h, i) => {
          let val = cols[i];
          // 去掉字串前後雙引號並還原雙引號
          if (val.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          switch (h) {
            case 'index':
            case 'left': case 'top':
            case 'width': case 'height':
            case 'capacity': case 'occupied':
            case 'extraSeatLimit': case 'available':
              obj[h] = Number(val);
              break;
            case 'tags':
              obj.tags = val ? val.split(',') : [];
              break;
            default:
              obj[h] = val;
          }
        });
        return obj;
      });

      // 4. 呼叫父層回調
      onImportData({ bgCrop, tables: importedTables });
    };
    reader.readAsText(file, 'utf-8');
  };

  // 匯出 CSV
  const exportCSV = () => {
    const bgHeader = ['cropX','cropY','cropWidth','cropHeight'].join(',');
    const bgData = [
      bgCropData?.x ?? '',
      bgCropData?.y ?? '',
      bgCropData?.width ?? '',
      bgCropData?.height ?? ''
    ].join(',');

     const header = [
       'table_id',
       'index',
       'name',
       'left',
       'top',
       'width',
       'height',
       'capacity',
       'occupied',
       'extraSeatLimit',
       'tags',
       'description',
       'updateTime',
       'available',
       'floor'
     ].join(',');

    const rows = sortedTables.map(t => [
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
         ? `"${t.tags.join(',').replace(/"/g, '""')}"`
         : '""',
       `"${(t.description||'').replace(/"/g, '""')}"`,
       t.updateTime || '',
       t.available,
       t.floor || '1F'
    ].join(','));

    // 組合所有列：背景欄位 → 背景值 → 空行 → 桌子欄位 → 桌子資料
    const csvContent = [
      bgHeader,
      bgData,
      '',
      header,
      ...rows
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
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
            >
              營業模式
            </button>
            <button
              className={mode === 'edit' ? 'active' : ''}
              onClick={() => setMode('edit')}
            >
              編輯模式
            </button>
            <button
              className={mode === 'view' ? 'active' : ''}
              onClick={() => setMode('view')}
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
                  <button onClick={handleImportClick}>匯入桌位資料</button>
                  {/* 隱藏的 File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                  />
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
              <button onClick={openBgForm}>背景圖片</button>
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