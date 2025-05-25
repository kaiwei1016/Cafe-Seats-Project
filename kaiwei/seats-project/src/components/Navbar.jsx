// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import '../styles/Navbar.css';
import NavbarForm from './NavbarForm'

const isGuest = window.location.pathname.startsWith('/guest');

export default function Navbar({
  hideMenu,
  openBgForm,
  bgCropData,
  bgZoom,
  bgHidden,
  onToggleBgHidden,
  gridHidden,
  onToggleGridHidden,
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
  /* ------------------------------------------------------------------ */
  /* State & Refs                                                       */
  /* ------------------------------------------------------------------ */
  const [title, setTitle] = useState(() => localStorage.getItem('kcafe_title') || 'Seats Viewer');
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);            // 新增：左側選單
  const [showMerchantForm, setShowMerchantForm] = useState(false);
  
  const [showQRCodeOptions, setShowQRCodeOptions] = useState(false);
  const [selectedTableForQR, setSelectedTableForQR] = useState('');
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);
  const [tmpBgHidden, setTmpBgHidden] = useState(bgHidden);
  const [tmpGridHidden, setTmpGridHidden] = useState(gridHidden);
  const [originalBgHidden, setOriginalBgHidden] = useState(bgHidden);
  const [originalGridHidden, setOriginalGridHidden] = useState(gridHidden);
  const [editSection, setEditSection] = useState('initial');

  const popupRef = useRef(null);
  const fileInputRef = useRef(null);
  const leftMenuRef = useRef(null);

  /* ------------------------------------------------------------------ */
  /* Effects                                                             */
  /* ------------------------------------------------------------------ */
  // Reset edit menu when switching to edit mode
  useEffect(() => {
    if (mode === 'edit') setEditSection('initial');
  }, [mode]);

  // Sync temp display settings with props when modal opens
  useEffect(() => {
    if (showDisplaySettings) {
      setOriginalBgHidden(bgHidden);
      setTmpBgHidden(bgHidden);
      setOriginalGridHidden(gridHidden);
      setTmpGridHidden(gridHidden);
    }
  }, [showDisplaySettings]);

  // Close menu when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setMenuOpen(false);
        setShowQRCodeOptions(false);
        setLeftMenuOpen(false);
      }
    };

    if (menuOpen) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen, setMenuOpen]);

  /* ------------------------------------------------------------------ */
  /* Derived values & helpers                                            */
  /* ------------------------------------------------------------------ */
  const isTableAction = deleteTableMode || moveTableMode;
  const sortedTables = [...tables].sort((a, b) => a.index - b.index);

  /* --------------------------- Import / Export ----------------------- */
  const handleImportClick = () => {
    fileInputRef.current.value = null;
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const lines = evt.target.result.split(/\r?\n/);

      /* ───────── 1. 讀商家設定 ───────── */
      // 第 0 列：topbar-title,bgHidden,gridHidden
      // 第 1 列：      值       , true/false , true/false
      const [rawTitle, rawBgHidden, rawGridHidden] = lines[1].split(',');
      const importedTitle      = rawTitle.replace(/^"|"$/g, '').replace(/""/g, '"');
      const importedBgHidden   = rawBgHidden === 'true';
      const importedGridHidden = rawGridHidden === 'true';

      /* ───────── 2. 讀背景裁切資訊 ───────── */
      // 第 3 列：cropX,cropY,cropWidth,cropHeight,cropZoom
      // 第 4 列：  值
      const [cropX, cropY, cropW, cropH, cropZ] = lines[4]
        .split(',')
        .map((v) => parseFloat(v) || 0);
      const bgCrop = { x: cropX, y: cropY, width: cropW, height: cropH };
      const bgZoomImported = cropZ;

      /* ───────── 3. 讀桌位資料 ───────── */
      // 第 6 列：header
      // 第 7 起：rows
      const header = lines[6].split(',');
      const tableRows = lines.slice(7).filter((l) => l.trim() !== '');
      const importedTables = tableRows.map((row) => {
        const cols = row.split(',');
        const obj = {};
        header.forEach((h, i) => {
          let val = cols[i];
          if (val?.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          switch (h) {
            case 'index':
            case 'left':
            case 'top':
            case 'width':
            case 'height':
            case 'capacity':
            case 'occupied':
            case 'extraSeatLimit':
            case 'available':
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

      /* ───────── 4. 回傳給上層 ───────── */
      onImportData({
        title:      importedTitle || 'Seats Viewer',
        bgHidden:   importedBgHidden,
        gridHidden: importedGridHidden,
        bgCrop,
        bgZoom:     bgZoomImported,
        tables:     importedTables,
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  const exportCSV = () => {
     const merchantHeader = ['topbar-title', 'bgHidden', 'gridHidden'].join(',');
      const merchantData   = [
        `"${title.replace(/"/g, '""')}"`,
        bgHidden,
        gridHidden
      ].join(',');

      /* ② 背景裁切資訊 */
      const bgHeader = ['cropX','cropY','cropWidth','cropHeight','cropZoom'].join(',');
      const bgData   = [
        bgCropData?.x??'', bgCropData?.y??'',
        bgCropData?.width??'', bgCropData?.height??'',
        bgZoom??''
      ].join(',');

      /* ③ 桌位表頭與資料 */
      const header = [
        'table_id','index','name','left','top','width','height',
        'capacity','occupied','extraSeatLimit','tags','description',
        'updateTime','available','floor'
      ].join(',');

      const rows = sortedTables.map(t => [
        t.table_id, t.index, `"${t.name.replace(/"/g,'""')}"`,
        t.left, t.top, t.width, t.height,
        t.capacity, t.occupied, t.extraSeatLimit,
        Array.isArray(t.tags) ? `"${t.tags.join(',').replace(/"/g,'""')}"` : '""',
        `"${(t.description||'').replace(/"/g,'""')}"`,
        t.updateTime||'', t.available, t.floor||'1F'
      ].join(','));

      /* ④ 組合 CSV */
      const csvContent = [
        merchantHeader,
        merchantData,
        '',               // 空行
        bgHeader,
        bgData,
        '',               // 再空一行
        header,
        ...rows
      ].join('\r\n');

      const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8;'});
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'table_data.csv'; a.click();
      URL.revokeObjectURL(url);
    };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <>
      {/* ──────────────────────── TOP NAV BAR ─────────────────────── */}
      <div className="navbar-wrapper">
        <div className="topbar">
          {/* Logo & Title — 點擊左側區域可開啟左側選單（非顧客視角）*/}
          <div
            className="topbar-left"
            onClick={() => {
              if (!isGuest) {
                setLeftMenuOpen((v) => !v);
                setShowMerchantForm(false);
              }
            }}
            style={{ cursor: !isGuest ? 'pointer' : 'default' }}
          >
            <img src="/img/logo.png" alt="logo" className="topbar-logo" />
            <span className="topbar-title">{title}</span>

            {leftMenuOpen && !isGuest && (
            <div className="left-menu" ref={leftMenuRef}>
              <button
                  onClick={e => {
                    e.stopPropagation();      /* 避免冒泡關閉 */
                    setShowMerchantForm(true);
                    setLeftMenuOpen(false);
                  }}
                >
                編輯商家資訊
              </button>
            </div>
            )}

          </div>

          {/* Mode Buttons & Hamburger */}
          <div className="topbar-right">
           {!hideMenu && (
              <>
                <button
                  disabled={isTableAction}
                  className={mode === 'business' ? 'active' : ''}
                  onClick={() => setMode('business')}
                >
                  營業模式
                </button>
                <button
                  disabled={isTableAction}
                  className={mode === 'edit' ? 'active' : ''}
                  onClick={() => setMode('edit')}
                >
                  編輯模式
                </button>
                <button
                  disabled={isTableAction}
                  className={mode === 'view' ? 'active' : ''}
                  onClick={() => setMode('view')}
                >
                  觀察模式
                </button>
              </>
            )}


              {/* Hamburger Menu */}
              <div className="menu-container" ref={popupRef}>
                <button
                  className="menu-button"
                  disabled={isTableAction}
                  onClick={() => {
                    setShowQRCodeOptions(false);
                    setMenuOpen((v) => !v);
                  }}
                >
                  ☰
                </button>

                {menuOpen && (
                  <div className="menu-dropdown">
                    {isGuest ? (
                      /* ----------------- Guest View Menu ---------------- */
                      <>
                        <div className="menu-item">
                          <button onClick={onToggleBgHidden}>
                            顯示背景圖片
                            <input type="checkbox" checked={!bgHidden} readOnly />
                          </button>
                        </div>
                        <div className="menu-item">
                            <button onClick={onToggleGridHidden}>
                            顯示桌子格線
                            <input type="checkbox" checked={!gridHidden} readOnly />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* --------------- Business / Edit Menu -------------- */
                      <>
                        <button onClick={exportCSV}>匯出桌位資料</button>
                        <button onClick={handleImportClick}>匯入桌位資料</button>
                        {/* Hidden File Input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          style={{ display: 'none' }}
                          onChange={handleFileChange}
                        />
                        <button onClick={() => setShowQRCodeOptions((v) => !v)}>取得 QR code</button>

                        {showQRCodeOptions && (
                          <div className="qr-options">
                            <select
                              value={selectedTableForQR}
                              onChange={(e) => setSelectedTableForQR(e.target.value)}
                            >
                              <option value="">選擇桌號</option>
                              {sortedTables.map((t) => (
                                <option key={t.table_id} value={t.table_id}>
                                  桌號 {t.name} ({t.table_id})
                                </option>
                              ))}
                            </select>
                            <button disabled={!selectedTableForQR}>下載</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
          </div>
        </div>

        {/* ──────────────────────── BOTTOM BAR ──────────────────────── */}
        <nav className="bottombar">
          {/* Mode indicator */}
          <div className="mode-display">
            {mode === 'business' ? '目前模式：營業模式' : mode === 'edit' ? '' : ''}
          </div>

          {/* Edit mode bottom bar ------------------------------------------------ */}
          {mode === 'edit' && (
            editSection === 'initial' ? (
              <>
                <button onClick={() => setEditSection('table')} disabled={isTableAction}>
                  編輯桌位分布
                </button>
                <button onClick={openBgForm} disabled={isTableAction}>
                  編輯背景圖片
                </button>
                <button onClick={() => setShowDisplaySettings(true)} disabled={isTableAction}>
                  編輯顯示風格
                </button>
              </>
            ) : pendingTable ? (
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
                <button onClick={addTable} disabled={isTableAction}>
                  新增桌子
                </button>
                <button onClick={() => startDeleteTableMode()} disabled={isTableAction}>
                  刪除桌子
                </button>
                <button onClick={() => startMoveTableMode()} disabled={isTableAction}>
                  移動桌子
                </button>
                <button onClick={() => setEditSection('initial')} disabled={isTableAction}>
                  返回
                </button>
              </>
            )
          )}

          {/* View mode guest link ----------------------------------------------- */}
          {mode === 'view' && (
            <button className="go-guest-button" onClick={() => window.open('/guest', '_blank')}>
              查看顧客視角
            </button>
          )}
        </nav>
      </div>

      {/* ───────────────────── DISPLAY SETTINGS MODAL ───────────────────── */}
      {showDisplaySettings && (
        <div className="modal-backdrop">
          <div className="modal table-form">
            <h3>編輯顯示風格</h3>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '1rem',
                margin: '1rem 0'
              }}
            >
              {/* Toggle background image */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: '0.5rem'
                }}
              >
                <span>顯示背景圖片</span>
                <label style={{ position: 'relative', width: '40px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={!tmpBgHidden}
                    onChange={() => {
                      setTmpBgHidden((v) => !v);
                      onToggleBgHidden();
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: '2px',
                      backgroundColor: tmpBgHidden ? '#ccc' : '#4cd964',
                      borderRadius: '999px',
                      transition: '0.4s'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: tmpBgHidden ? '2px' : 'calc(100% - 22px)',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transition: '0.4s'
                    }}
                  />
                </label>
              </div>

              {/* Toggle grid lines */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: '0.5rem'
                }}
              >
                <span>顯示桌子格線</span>
                <label style={{ position: 'relative', width: '40px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={!tmpGridHidden}
                    onChange={() => {
                      setTmpGridHidden((v) => !v);
                      onToggleGridHidden();
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      inset: '2px',
                      backgroundColor: tmpGridHidden ? '#ccc' : '#4cd964',
                      borderRadius: '999px',
                      transition: '0.4s'
                    }}
                  />
                  <span
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: tmpGridHidden ? '2px' : 'calc(100% - 22px)',
                      width: '20px',
                      height: '20px',
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transition: '0.4s'
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-actions">
              <button onClick={() => setShowDisplaySettings(false)}>儲存</button>
              <button
                onClick={() => {
                  if (bgHidden !== originalBgHidden) onToggleBgHidden();
                  if (gridHidden !== originalGridHidden) onToggleGridHidden();
                  setShowDisplaySettings(false);
                }}
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
      <NavbarForm
        open={showMerchantForm}
        onClose={() => setShowMerchantForm(false)}
        currentTitle={title}
        onSave={(newTitle) => {
          const t = (newTitle || 'Seats Viewer');
          setTitle(t);
          localStorage.setItem('kcafe_title', t);
        }}
      />
    </>
  );
}
