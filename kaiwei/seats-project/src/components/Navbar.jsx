// src/components/Navbar.jsx
import React, { useState, useEffect, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import '../styles/Navbar.css';
import NavbarForm from './Forms/NavbarForm';

// 全域常數
const isGuest = window.location.pathname.startsWith('/guest');

export default function Navbar({
  hideMenu, openBgForm, bgCropData, bgZoom,
  title, logo, setTitle, setLogo,

  defaultBgHidden, defaultGridHidden, defaultSeatIndex,
  viewBgHidden,    viewGridHidden,    viewSeatIndex,
  onToggleDefaultBg, onToggleDefaultGrid, onToggleDefaultSeat,
  onToggleViewBg,    onToggleViewGrid,    onToggleViewSeat,
  hideTables, onToggleHideTables,
  onSaveDisplaySettings,

  onImportData,
  mode,
  setMode,
  businessTab,
  setBusinessTab,
  menuOpen,
  setMenuOpen,

  tables,
  addTable,
  addSeat,

  pendingTable,
  cancelAddTable,
  confirmAddTable,
  hasOverlapAdd,

  startDeleteTableMode,
  deleteTableMode,
  selectedToDeleteList,
  confirmDeleteTable,
  cancelDeleteTableMode,

  startMoveTableMode,
  moveTableMode,
  selectedToMoveTable,
  confirmMoveTable,
  cancelMoveTableMode,
  hasOverlapMove
}) {
  /* ==========================================================================
     State & Refs
  ========================================================================== */
  const [leftMenuOpen,        setLeftMenuOpen]        = useState(false);
  const [showMerchantForm,    setShowMerchantForm]    = useState(false);
  const [showQRCodeOptions,   setShowQRCodeOptions]   = useState(false);
  const [selectedTableForQR,  setSelectedTableForQR]  = useState('');
  const [showDisplaySettings, setShowDisplaySettings] = useState(false);

  const [tmpBgHidden,          setTmpBgHidden]          = useState(defaultBgHidden);
  const [tmpGridHidden,        setTmpGridHidden]        = useState(defaultGridHidden);
  const [originalBgHidden,     setOriginalBgHidden]     = useState(defaultBgHidden);
  const [originalGridHidden,   setOriginalGridHidden]   = useState(defaultGridHidden);
  const [tmpSeatIndexShown,      setTmpSeatIndexShown]      = useState(defaultSeatIndex);
  const [originalSeatIndexShown, setOriginalSeatIndexShown] = useState(defaultSeatIndex);


  const [editSection, setEditSection] = useState('initial');

  const popupRef     = useRef(null);
  const fileInputRef = useRef(null);
  const leftMenuRef  = useRef(null);
  const hasDeletePick = selectedToDeleteList.length > 0;

  /* ==========================================================================
     Effects
  ========================================================================== */
  // 切換到編輯模式時重設 editSection
  useEffect(() => {
    if (mode === 'edit') setEditSection('initial');
  }, [mode]);

  // 打開「顯示設定」時同步暫存值
  useEffect(() => {
    if (showDisplaySettings) {
      setOriginalBgHidden(defaultBgHidden);
      setTmpBgHidden(defaultBgHidden);
      setOriginalGridHidden(defaultGridHidden);
      setTmpGridHidden(defaultGridHidden);
      setOriginalSeatIndexShown(defaultSeatIndex);
      setTmpSeatIndexShown(defaultSeatIndex);
    }
  }, [showDisplaySettings]);

  // 點擊外部關閉主選單與 QR 選項
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

  // 點擊外部關閉左側選單
  useEffect(() => {
    const handleClickOutsideLeft = e => {
      if (leftMenuOpen && leftMenuRef.current && !leftMenuRef.current.contains(e.target)) {
        setLeftMenuOpen(false);
      }
    };
    if (leftMenuOpen) document.addEventListener('mousedown', handleClickOutsideLeft);
    return () => document.removeEventListener('mousedown', handleClickOutsideLeft);
  }, [leftMenuOpen]);

  /* ==========================================================================
     Derived Values & Helpers
  ========================================================================== */
  const isTableAction = deleteTableMode || moveTableMode;
  const sortedTables = [...tables].sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );
  const qrRef = useRef(null);
   const generateQRCode = () => {
    if (!selectedTableForQR) {
      alert('請先選擇一個桌號');
      return;
    }
    // 1. 組出要編碼的 URL，例如 customer?table=<table_id>
    const targetUrl = `http://localhost:8001/customer?table_id=${encodeURIComponent(
      selectedTableForQR
    )}`;

    // 2. 先把隱藏的 QRCode <canvas> 更新為最新的值（因為 value 可能剛才才更新）
    //    再從 <canvas> 取得 data URL
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) {
      alert('QR Code 尚未渲染，請稍後再試');
      return;
    }
    // 使用 canvas.toDataURL() 取得 base64 的 PNG 圖片
    const dataUrl = canvas.toDataURL('image/png');

    // 3. 在新分頁打開一個視窗，並把 dataUrl 寫成 <img src="..." />
    const win = window.open(
      '',
      '_blank',
      'width=350,height=400,menubar=no,toolbar=no,location=no,status=no'
    );
    if (win) {
      win.document.write(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8" />
          <title>桌號 ${selectedTableForQR} 的 QR Code</title>
          <style>
            body { margin: 0; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f5f5f5; }
            img { max-width: 100%; max-height: 100%; }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="QR Code for ${targetUrl}" />
        </body>
        </html>
      `);
      win.document.close();
    }
  };


  /* ==========================================================================
     檔案匯入 (Import)
  ========================================================================== */
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

      // 1. 讀商家設定
      const [rawTitle, rawBgHidden, rawGridHidden, rawSeatIndexShown] = lines[1].split(',');
      const importedTitle      = rawTitle.replace(/^"|"$/g, '').replace(/""/g, '"');
      const importedBgHidden   = rawBgHidden === 'true';
      const importedGridHidden = rawGridHidden === 'true';
      const importedSeatShown  = rawSeatIndexShown === 'true';

      // 2. 讀背景裁切資訊
      const [cropX, cropY, cropW, cropH, cropZ] = lines[4]
        .split(',')
        .map((v) => parseFloat(v) || 0);
      const bgCrop         = { x: cropX, y: cropY, width: cropW, height: cropH };
      const bgZoomImported = cropZ;

      // 3. 讀桌位資料
      const header    = lines[6].split(',');
      const dataRows  = lines.slice(7).filter((l) => l.trim() !== '');
      const importedTables = dataRows.map((row) => {
        const cols = row.split(',');
        const obj  = {};
        header.forEach((h, i) => {
          let val = cols[i];
          if (val?.startsWith('"') && val.endsWith('"')) {
            val = val.slice(1, -1).replace(/""/g, '"');
          }
          const numOrZero = v => {
            const n = Number(v);
            return Number.isNaN(n) ? 0 : n;
          };
          switch (h) {
            case 'index': case 'left': case 'top':
            case 'width': case 'height': case 'capacity':
            case 'occupied': case 'extraSeatLimit':
              obj[h] = numOrZero(val);
              break;
            case 'available':           
              obj.available = val === 'true';
              break;
            case 'tags':
              obj.tags = val ? val.split(',') : [];
              break;
            case 'updateTime':
              obj.updateTime = val ? val : null;
              break;
            default:
              obj[h] = val;
          }
        });
        return obj;
      });

      // 4. 傳回資料
      onImportData({
        title:      importedTitle || 'Seats Viewer',
        bgHidden:   importedBgHidden,
        gridHidden: importedGridHidden,
        seatIndexShown: importedSeatShown,
        bgCrop,
        bgZoom:     bgZoomImported,
        tables:     importedTables,
        logo, 
      });
    };
    reader.readAsText(file, 'utf-8');
  };

  /* ==========================================================================
     檔案匯出 (Export CSV)
  ========================================================================== */
  const exportCSV = () => {
    // 商家設定
    const merchantHeader = ['topbar-title', 'bgHidden', 'gridHidden', 'seatIndexShown'].join(',');
    const merchantData   = [
      `"${title.replace(/"/g, '""')}"`,
      defaultBgHidden,
      defaultGridHidden,
      defaultSeatIndex
    ].join(',');

    // 背景裁切資訊
    const bgHeader = ['cropX','cropY','cropWidth','cropHeight','cropZoom'].join(',');
    const bgData   = [
      bgCropData?.x ?? '', bgCropData?.y ?? '',
      bgCropData?.width ?? '', bgCropData?.height ?? '',
      bgZoom ?? ''
    ].join(',');

    // 桌位表頭與資料
    const header = [
      'table_id','index','name','left','top','width','height',
      'capacity','occupied','extraSeatLimit','tags','description',
      'updateTime','available','floor'
    ].join(',');
    const rows = [...tables]                          // 直接用 tables
    .sort((a, b) => (a.table_id > b.table_id ? 1 : -1)) // 依 table_id 降冪
    .map(t => [
      t.table_id, t.index, `"${t.name.replace(/"/g,'""')}"`,
      t.left, t.top, t.width, t.height,
      t.capacity, t.occupied, t.extraSeatLimit,
      Array.isArray(t.tags)
        ? `"${t.tags.join(',').replace(/"/g,'""')}"`
        : '""',
      `"${(t.description||'').replace(/"/g,'""')}"`,
      t.updateTime||'', t.available, t.floor||'1F'
    ].join(','));

    // 組合 CSV
    const csvContent = [
      merchantHeader,
      merchantData,
      '',
      bgHeader,
      bgData,
      '',
      header,
      ...rows
    ].join('\r\n');

    const blob = new Blob([csvContent], { type:'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'table_data.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  /* ==========================================================================
     Render
  ========================================================================== */
  return (
    <>
      {/* TOP NAV BAR */}
      <div className="navbar-wrapper">
        <div className="topbar">
          {/* 左側 Logo & Title */}
          <div
            className="topbar-left"
            onClick={() => {
              if (!isGuest) {
                setLeftMenuOpen(v => !v);
                setShowMerchantForm(false);
              }
            }}
            style={{ cursor: !isGuest ? 'pointer' : 'default' }}
          >
            <img src={logo} alt="logo" className="topbar-logo" />
            <span className="topbar-title">{title}</span>

            {leftMenuOpen && !isGuest && (
              <div className="left-menu" ref={leftMenuRef}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setShowMerchantForm(true);
                    setLeftMenuOpen(false);
                  }}
                >
                  編輯商家資訊
                </button>
              </div>
            )}
          </div>

          {/* 右側模式按鈕與漢堡選單 */}
          <div className="topbar-right">
            {!hideMenu && (
              <>
                <button
                  disabled={isTableAction}
                  className={mode === 'business' ? 'active' : ''}
                  onClick={() => {
                    setMode('business');
                    setBusinessTab('seating');
                  }}
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
                  className={isGuest ? 'active' : ''}
                  onClick={() => {
                    window.open('/guest', '_blank');
                  }}
                >
                  顧客視角
                </button>
              </>
            )}

            {/* 漢堡選單 */}
            <div className="menu-container" ref={popupRef}>
              <button
                className="menu-button"
                disabled={isTableAction}
                onClick={() => {
                  setShowQRCodeOptions(false);
                  setMenuOpen(v => !v);
                }}
              >
                ☰
              </button>

              {menuOpen && (
                <div className="menu-dropdown">
                  <div className="menu-item">
                    <button onClick={e => { e.stopPropagation(); window.location.reload(); }}>
                      刷新座位狀態 🔄
                    </button>
                  </div>
                  {defaultSeatIndex && (
                    
                    <div className="menu-item">
                      <button onClick={onToggleViewSeat}>
                        顯示椅子座號
                        <input type="checkbox" checked={viewSeatIndex} readOnly />
                      </button>
                    </div>
                  )}               

                  {/* 非顧客觀察模式 */}
                  {!(mode === 'view' || isGuest) && (
                    <div className="menu-section">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleHideTables();
                        }}
                      >
                        暫時隱藏桌椅
                        <input
                          type="checkbox"
                          checked={hideTables}
                          readOnly
                        />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          setShowMerchantForm(true);
                          setLeftMenuOpen(false);
                        }}
                      >
                        編輯商家資訊
                      </button>
                      <button onClick={exportCSV}>備份桌位資料</button>
                      <button onClick={handleImportClick}>匯入桌位資料</button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                      />
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          if (!showQRCodeOptions) {
                            setSelectedTableForQR('');
                            setShowQRCodeOptions(true);       // 展開選單
                          } else {
                            generateQRCode();                 // 已展開 → 產生 QR Code
                          }
                        }}
                        /* 當已展開但尚未選桌號時禁用 */
                        disabled={showQRCodeOptions && !selectedTableForQR}
                        style={{ width: '100%' }}
                      >
                        {showQRCodeOptions ? '下載 QR code' : '取得 QR code'}
                      </button>
                      {showQRCodeOptions && (
                      <>
                      <select
                        value={selectedTableForQR}
                        onChange={e => setSelectedTableForQR(e.target.value)}
                        style={{
                          marginBottom: '0.5rem',
                          textAlign: 'center', 
                          textAlignLast: 'center' 
                        }}
                      >
                        <option
                          value=""
                          style={{ textAlign: 'center' }} 
                        >
                          選擇桌號
                        </option>
                        {tables
                          .filter(t => t.capacity > 0 && !t.table_id.startsWith('s_'))
                          .sort((a, b) =>
                            String(a.name).localeCompare(String(b.name))
                          )
                          .map(t => (
                            <option key={t.table_id} value={t.table_id}>
                              桌號 {t.name} ({t.table_id})
                            </option>
                          ))}
                      </select>

                      {/* 隱藏的 QRCode 元件*/}
                      <div
                        ref={qrRef}
                        style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}
                      >
                        <QRCodeCanvas
                          value={`http://localhost:8001/customer?table_id=${encodeURIComponent(
                            selectedTableForQR
                          )}`}
                          size={300}
                          includeMargin={true}
                        />
                      </div>
                     </>
                    )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        {mode !== 'view' && (
          <nav className="bottombar">
            {/* 營業模式 Tab */}
            {mode === 'business' && (
              <div className="business-tabs">
                <button
                  className={businessTab === 'seating' ? 'active' : ''}
                  onClick={() => setBusinessTab('seating')}
                >
                  桌位分布
                </button>
                <button
                  className={businessTab === 'info' ? 'active' : ''}
                  onClick={() => setBusinessTab('info')}
                >
                  座位管理
                </button>
                <button
                  className={businessTab === 'menu' ? 'active' : ''}
                  onClick={() => setBusinessTab('menu')}
                >
                  編輯菜單
                </button>
              </div>
            )}

            {/* 編輯模式 Bottom Bar */}
            {mode === 'edit' && (
              editSection === 'initial' ? (
                <>
                  <button onClick={() => setEditSection('table')} disabled={isTableAction}>
                    編輯桌椅
                  </button>
                  <button onClick={openBgForm} disabled={isTableAction}>
                    編輯背景
                  </button>
                  <button onClick={() => setShowDisplaySettings(true)} disabled={isTableAction}>
                    顯示設定
                  </button>
                </>
              ) : pendingTable ? (
                <>
                  <button
                    onClick={confirmAddTable}
                    disabled={hasOverlapAdd}
                    style={{ color: hasOverlapAdd ? 'red' : undefined }}
                  >
                    {hasOverlapAdd ? '桌椅重疊' : '確認新增'}
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
                    {hasOverlapMove ? '桌椅重疊' : '確認移動'}
                  </button>
                  <button onClick={cancelMoveTableMode}>取消移動</button>
                </>
              ) : deleteTableMode ? (
                <>
                  <button
                    onClick={confirmDeleteTable}
                    disabled={!hasDeletePick}
                  >
                    確認刪除 ({selectedToDeleteList.length})
                  </button>
                  <button onClick={cancelDeleteTableMode}>取消刪除</button>
                </>
              ) : (
                <>
                  <button onClick={addTable} disabled={isTableAction}>
                    新增桌子
                  </button>
                  <button onClick={addSeat} disabled={isTableAction}>
                    新增椅子
                  </button>
                  <button onClick={() => startMoveTableMode()} disabled={isTableAction}>
                    移動桌椅
                  </button>
                  <button onClick={() => startDeleteTableMode()} disabled={isTableAction}>
                    刪除桌椅
                  </button>

                  <button onClick={() => setEditSection('initial')} disabled={isTableAction}>
                    返回
                  </button>
                </>
              )
            )}
          </nav>
        )}

        {/* 觀察模式 Icon Tab */}
        {mode === 'view' && (
          <div className="view-tabs">
            <button
              className={businessTab === 'seating' ? 'active' : ''}
              onClick={() => setBusinessTab('seating')}
            >
              <span className="icon">🏠</span>
              <span className="label">桌位分布</span>
            </button>
            <button
              className={businessTab === 'info' ? 'active' : ''}
              onClick={() => setBusinessTab('info')}
            >
              <span className="icon">🪑</span>
              <span className="label">座位列表</span>
            </button>
            <button
              className={businessTab === 'menu' ? 'active' : ''}
              onClick={() => setBusinessTab('menu')}
            >
              <span className="icon">☕️</span>
              <span className="label">菜單資訊</span>
            </button>
          </div>
        )}
      </div>

      {/* DISPLAY SETTINGS Modal */}
      {showDisplaySettings && (
        <div className="modal-backdrop">
          <div className="modal table-form">
            <h3>顯示設定</h3>
            <div style={{
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              gap: '1rem', margin: '1rem 0'
            }}>
              {/* 椅子座號 切換 */}
              <div style={{
                display:'flex', justifyContent:'center',
                alignItems:'flex-start', gap:'0.5rem'
              }}>
                <span>顯示椅子座號</span>
                <label style={{ position:'relative', width:'40px', height:'24px' }}>
                  <input
                    type="checkbox"
                    checked={tmpSeatIndexShown}
                    onChange={() => {
                      setTmpSeatIndexShown(v => !v);
                      onToggleDefaultSeat();
                    }}
                    style={{ opacity:0, width:0, height:0 }}
                  />
                  <span style={{
                    position:'absolute', inset:'2px',
                    backgroundColor: tmpSeatIndexShown ? '#4cd964' : '#ccc',
                    borderRadius:'999px', transition:'0.4s'
                  }}/>
                  <span style={{
                    position:'absolute', top:'2px',
                    left: tmpSeatIndexShown ? 'calc(100% - 22px)' : '2px',
                    width:'20px', height:'20px', background:'#fff',
                    borderRadius:'50%', transition:'0.4s',
                    boxShadow:'0 1px 2px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.6)'
                  }}/>
                </label>
              </div>

              {/* 背景圖片 切換 */}
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span>啟用背景圖片</span>
                <label style={{ position: 'relative', width: '40px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={!tmpBgHidden}
                    onChange={() => {
                      setTmpBgHidden(v => !v);
                      onToggleDefaultBg();
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: '2px',
                    backgroundColor: tmpBgHidden ? '#ccc' : '#4cd964',
                    borderRadius: '999px', transition: '0.4s'
                  }}/>
                  <span style={{
                    position: 'absolute', top: '2px',
                    left: tmpBgHidden ? '2px' : 'calc(100% - 22px)',
                    width: '20px', height: '20px', backgroundColor: '#fff',
                    borderRadius: '50%', transition: '0.4s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}/>
                </label>
              </div>

              {/* 格線 切換 */}
              <div style={{
                display: 'flex', justifyContent: 'center',
                alignItems: 'flex-start', gap: '0.5rem'
              }}>
                <span>桌子內部格線</span>
                <label style={{ position: 'relative', width: '40px', height: '24px' }}>
                  <input
                    type="checkbox"
                    checked={!tmpGridHidden}
                    onChange={() => {
                      setTmpGridHidden(v => !v);
                      onToggleDefaultGrid();
                    }}
                    style={{ opacity: 0, width: 0, height: 0 }}
                  />
                  <span style={{
                    position: 'absolute', inset: '2px',
                    backgroundColor: tmpGridHidden ? '#ccc' : '#4cd964',
                    borderRadius: '999px', transition: '0.4s'
                  }}/>
                  <span style={{
                    position: 'absolute', top: '2px',
                    left: tmpGridHidden ? '2px' : 'calc(100% - 22px)',
                    width: '20px', height: '20px', backgroundColor: '#fff',
                    borderRadius: '50%', transition: '0.4s',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.6)'
                  }}/>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button onClick={() => {
                onSaveDisplaySettings({
                  bgHidden: tmpBgHidden,
                  gridHidden: tmpGridHidden,
                  seatIndex: tmpSeatIndexShown
                });
               setShowDisplaySettings(false);
              }}>
              儲存
              </button>
              <button onClick={() => {
                if (defaultBgHidden !== originalBgHidden)     onToggleDefaultBg();
                if (defaultGridHidden !== originalGridHidden) onToggleDefaultGrid();
                if (defaultSeatIndex !== originalSeatIndexShown) onToggleDefaultSeat();
                setShowDisplaySettings(false);
              }}>取消</button>
            </div>
          </div>
        </div>
      )}

      {/* Merchant Form */}
      <NavbarForm
        open={showMerchantForm}
        onClose={() => setShowMerchantForm(false)}
        currentTitle={title}
        currentLogo={logo}
        onSave={({ title: newTitle, logo: newLogo }) => {
          setTitle(newTitle || 'Seats Viewer');
          setLogo(newLogo);
          handleSaveDisplaySettings({
            title: newTitle || 'Seats Viewer',
            logo: newLogo
          });
        }}
      />
    </>
  );
}
