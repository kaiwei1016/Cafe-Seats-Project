import React, { useState, useEffect } from 'react';
import Background from './Background';
import BackgroundForm from './BackgroundForm';
import Navbar from './Navbar';
import TableForm from './TableForm';
import '../styles/Global.css';
import '../styles/Navbar.css';
import '../styles/Background.css';
import '../styles/Table.css';
import '../styles/TableForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────────────────────

const GRID_UNIT_X = 2;
const GRID_UNIT_Y = 3.125;

function rectsOverlap(a, b) {
  const dx = Math.abs(a.left - b.left);
  const dy = Math.abs(a.top - b.top);
  const aHalfW = a.width * GRID_UNIT_X;
  const aHalfH = a.height * GRID_UNIT_Y;
  const bHalfW = b.width * GRID_UNIT_X;
  const bHalfH = b.height * GRID_UNIT_Y;
  if (dx >= aHalfW + bHalfW || dy >= aHalfH + bHalfH) return false;
  return true;
}

function anyOverlap(tables) {
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      if (rectsOverlap(tables[i], tables[j])) return true;
    }
  }
  return false;
}

function rotateTablesOnce(arr){
  return arr.map(t => ({
    ...t,
    left: 100 - t.top,
    top:  t.left,
    width:  t.height,
    height: t.width
  }));
}

const INITIAL_TABLES = [
  { table_id: '1F_01', floor: '1F', index: 1, name: 'A', left: 20, top: 20,
    width: 1, height: 1, capacity: 4, occupied: 2, extraSeatLimit: 0,
    tags: [], description: '', updateTime: null, available: true }
  // ...
];

const getCroppedImg = (imageSrc, pixelCrop) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        pixelCrop.width, pixelCrop.height,
        0, 0, pixelCrop.width, pixelCrop.height
      );
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas is empty'));
        resolve(URL.createObjectURL(blob));
      }, 'image/jpeg');
    };
    image.onerror = reject;
  });

  const rotateImage = (src, angle) =>
    new Promise((resolve, reject) => {
      const deg = ((angle % 360) + 360) % 360;
      if (deg === 0) return resolve(src); // 無需旋轉

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = src;
      img.onload = () => {
        const swap = deg === 90 || deg === 270;
        const canvas = document.createElement('canvas');
        canvas.width = swap ? img.height : img.width;
        canvas.height = swap ? img.width : img.height;
        const ctx = canvas.getContext('2d');
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((deg * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);
        canvas.toBlob((b) => {
          if (!b) return reject(new Error('canvas empty'));
          resolve(URL.createObjectURL(b));
        }, 'image/jpeg');
      };
      img.onerror = reject;
    });

const DEFAULT_CROP = { x: 0, y: 0, width: 1000, height: 640 };
const DEFAULT_ZOOM = 1;

const KCafe = ({ hideMenu = false }) => {

  const [rotateCount, setRotateCount] = useState(hideMenu ? 1 : 0);
  const [showBgForm, setShowBgForm] = useState(false);
  const [bgHidden, setBgHidden] = useState(() => {
   if (!hideMenu) return false;
   return localStorage.getItem('kcafe_guest_bgHidden') === 'true';
 });
  const [gridHidden, setGridHidden] = useState(() => {
   if (!hideMenu) return false;
   return localStorage.getItem('kcafe_guest_gridHidden') === 'true';
 });
  const [bgOffset] = useState({ x: 50, y: 50 });

  // Background image managed via crop data, not persisted blob URLs
  const [bgImage, setBgImage] = useState('');
  const [bgCropData, setBgCropData] = useState(() =>
    JSON.parse(localStorage.getItem('kcafe_bg_crop') || JSON.stringify(DEFAULT_CROP))
  );
  const [bgZoom, setBgZoom] = useState(() => {
    const z = localStorage.getItem('kcafe_bg_zoom');
    return z !== null ? parseFloat(z) : DEFAULT_ZOOM;
  });

  const toggleBgHidden = () =>
   setBgHidden(prev => {
     const next = !prev;
     if (hideMenu) localStorage.setItem('kcafe_guest_bgHidden', next);
     return next;
   });

 const toggleGridHidden = () =>
   setGridHidden(prev => {
     const next = !prev;
     if (hideMenu) localStorage.setItem('kcafe_guest_gridHidden', next);
     return next;
   });

  // Generate cropped background on mount and when crop changes
  useEffect(() => {
    let prevUrl;
    getCroppedImg('/img/KCafe.jpg', bgCropData)
      .then((url) => rotateImage(url, rotateCount * 90))
      .then((finalUrl) => {
        setBgImage(finalUrl);
        prevUrl = finalUrl;
      })
      .catch(console.error);

    return () => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
    };
  }, [bgCropData, rotateCount]);

  // Handlers for background form
  const openBgForm = () => setShowBgForm(true);
  const cancelBgForm = () => setShowBgForm(false);
  const saveBgForm = ({ url, crop, zoom }) => {
    if (!url) return;
    setBgCropData(crop);
    setBgZoom(zoom);
    localStorage.setItem('kcafe_bg_crop', JSON.stringify(crop));
    localStorage.setItem('kcafe_bg_zoom', zoom.toString());
    setShowBgForm(false);
  };

  // Import data: update tables and background crop/zoom params only
  const handleImportData = async ({ bgCrop, bgZoom: impZoom, tables: newTables }) => {
    setBgZoom(impZoom);
    localStorage.setItem('kcafe_bg_zoom', impZoom.toString());
    setTables(newTables);
    newTables.forEach(t =>
      localStorage.setItem(`kcafe_table_${t.table_id}`, JSON.stringify(t))
    );
    setBgCropData(bgCrop);
    localStorage.setItem('kcafe_bg_crop', JSON.stringify(bgCrop));
  };

  // ----- State Hooks -----
  // Tables loaded from localStorage or default
  const [tables, setTables] = useState(() => {
    const restored = [];
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('kcafe_table_')) {
        try { restored.push(JSON.parse(localStorage.getItem(k))); } catch {}
      }
    });
    const base = restored.length ? restored : INITIAL_TABLES;
    return hideMenu ? rotateTablesOnce(base) : base;  // 顧客視角先旋轉
  });
  // Persist to localStorage on every change
  useEffect(() => {
    if (hideMenu) return; 
    tables.forEach(t =>
      localStorage.setItem(`kcafe_table_${t.table_id}`, JSON.stringify(t))
    );
  }, [tables]);

  // Pending / form states for Add/Edit
  const [pendingTable, setPendingTable]         = useState(null);
  const [showAddForm, setShowAddForm]           = useState(false);
  const [newTableInput, setNewTableInput]       = useState(
    {
      table_id: '',
      floor: '1F',
      index: 0,
      name: '',
      left: 50,
      top: 50,
      width: 1,
      height: 1,
      capacity: 4,
      occupied: 0,
      extraSeatLimit: 0,
      tags: [],
      description: '',
      updateTime: null,
      available: true
    }    
  );
  const [showEditForm, setShowEditForm]         = useState(false);
  const [editTableInput, setEditTableInput]     = useState(
    {
      table_id: '',
      floor: '1F',
      index: 0,
      name: '',
      left: 50,
      top: 50,
      width: 1,
      height: 1,
      capacity: 4,
      occupied: 0,
      extraSeatLimit: 0,
      tags: [],
      description: '',
      updateTime: null,
      available: true
    }
  );

  // Delete / Move modes
  const [deleteTableMode, setDeleteTableMode]           = useState(false);
  const [selectedToDeleteTable, setSelectedToDeleteTable] = useState(null);
  const [moveTableMode, setMoveTableMode]               = useState(false);
  const [selectedToMoveTable, setSelectedToMoveTable]     = useState(null);
  const [backupTables, setBackupTables]                 = useState(null);

  // Drag state
  const [draggingTable, setDraggingTable] = useState(null);
  const [offset, setOffset]               = useState({ x: 0, y: 0 });

  // Clock & UI mode
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode]               = useState('business'); // 'business' | 'edit' | 'view'
  const [menuOpen, setMenuOpen]       = useState(false);

  // ----- Effects -----
  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  // Auto-switch to view & reload if hideMenu
  useEffect(() => {
    if (!hideMenu) return;
    setMode('view');
    const id = setInterval(() => window.location.reload(), 30000);
    return () => clearInterval(id);
  }, [hideMenu]);

  // ----- Computed Helpers -----
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalOccupied = tables.reduce((sum, t) => sum + t.occupied, 0);
  const getNextTableIndex = () => {
    const used = tables.map(t => t.index);
    let idx = 1;
    while (used.includes(idx)) idx++;
    return idx;
  };
  const DEFAULT_FLOOR = '1F';
  function makeTableId(floor, index) {
    return `${floor}_${String(index).padStart(2, '0')}`;
  }

  // Increment/decrement occupied
  const updateTableOccupied = (tableId, delta) => {
    setTables(tables.map(t => {
      if (t.table_id !== tableId) return t;
      const maxOcc = t.capacity + (t.extraSeatLimit || 0);
      return {
        ...t,
        occupied: Math.min(maxOcc, Math.max(0, t.occupied + delta)),
        updateTime: delta > 0 ? new Date().toISOString() : t.updateTime
      };
    }));
  };

  const rotateLayout = () => {
    setTables(prev => rotateTablesOnce(prev));
    setRotateCount(c => (c + 1) % 4);
  };

  // ----- Drag Handlers -----
  const handleTableMouseDown = (tableId, e) => {
    if (mode !== 'edit') return;
    const isPend = pendingTable?.table_id === tableId;
    if (!isPend && !moveTableMode) return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingTable(tableId);
    if (moveTableMode && !isPend) setSelectedToMoveTable(tableId);
  };

  const handleTableMouseMove = e => {
    if (draggingTable == null || mode !== 'edit') return;
    const bg = document.querySelector('.background').getBoundingClientRect();
    const rawX = ((e.clientX - bg.left - offset.x) / bg.width)  * 100;
    const rawY = ((e.clientY - bg.top  - offset.y) / bg.height) * 100;
    const snapX = Math.round(rawX / GRID_UNIT_X) * GRID_UNIT_X;
    const snapY = Math.round(rawY / GRID_UNIT_Y) * GRID_UNIT_Y;
    const clamped = pct => Math.max(0, Math.min(100, pct));

    const isPend = pendingTable?.table_id === draggingTable;
    if (!isPend && !moveTableMode) return;

    if (isPend) {
      setPendingTable(prev => ({
        ...prev,
        left: clamped(snapX),
        top:  clamped(snapY)
      }));
    } else {
      setTables(tables.map(t =>
        t.table_id === draggingTable
          ? { ...t, left: clamped(snapX), top: clamped(snapY) }
          : t
      ));
    }
  };

  const handleTableMouseUp = () => setDraggingTable(null);

  // ----- Add Table Flow -----
  const openAddForm = () => {
    if (mode !== 'edit' || deleteTableMode || moveTableMode || pendingTable) return;
    const idx       = getNextTableIndex();
       const floor = DEFAULT_FLOOR;
       const tid   = makeTableId(floor, idx);                 // e.g. "1F_04"
       const name  = String.fromCharCode(65 + ((idx - 1) % 26)); // "A","B"…
       setShowAddForm(true);
       setNewTableInput({
         table_id: tid,
         floor,
         index: idx,
         name,
         left: 50, top: 50,
         width:2, height:2,
         capacity:4, occupied:0,
         extraSeatLimit:0,
         tags: [], description:'',
         updateTime: null,
         available: true
       });
    setMenuOpen(false);
  };
  const cancelAddForm = () => setShowAddForm(false);
  const submitAddForm = () => {
    const idx = getNextTableIndex();
    // 預設 name：A, B, C…
    const defaultName = String.fromCharCode(65 + ((idx - 1) % 26));
    const name = newTableInput.name.trim() || defaultName;

    setPendingTable({
      ...newTableInput,
      name,
      index: idx,
      table_id: makeTableId(DEFAULT_FLOOR, idx)
    });
    setShowAddForm(false);
  };
  const cancelAddTable = () => setPendingTable(null);
  const confirmAddTable = () => {
    if (!pendingTable) return;
    setTables(tables => [...tables, pendingTable]);
    setPendingTable(null);
  };

  // ----- Delete Table Flow -----
  const startDeleteTableMode = () => {
    if (mode !== 'edit') return;
    setDeleteTableMode(true);
    setSelectedToDeleteTable(null);
  };
  const confirmDeleteTable = () => {
    if (selectedToDeleteTable == null) return;
    localStorage.removeItem(`kcafe_table_${selectedToDeleteTable}`);
    setTables(prev => prev.filter(t => t.table_id !== selectedToDeleteTable));
    setDeleteTableMode(false);
    setSelectedToDeleteTable(null);
  };
  const cancelDeleteTableMode = () => {
    setDeleteTableMode(false);
    setSelectedToDeleteTable(null);
  };

  // ----- Move Table Flow -----
  const startMoveTableMode = () => {
    if (mode !== 'edit') return;
    setBackupTables(tables.map(t => ({ ...t })));
    setMoveTableMode(true);
    setSelectedToMoveTable(null);
  };
  const confirmMoveTable = () => {
    setMoveTableMode(false);
    setSelectedToMoveTable(null);
    setBackupTables(null);
  };
  const cancelMoveTableMode = () => {
    setTables(backupTables);
    setMoveTableMode(false);
    setSelectedToMoveTable(null);
    setBackupTables(null);
  };

  // ----- Edit Table Flow -----
  const openEditForm = tableId => {
    const t = tables.find(x => x.table_id === tableId);
    if (!t) return;
    setEditTableInput({ ...t });
    setShowEditForm(true);
  };
  const cancelEditForm = () => setShowEditForm(false);
  const saveEditForm = () => {
    setTables(tables.map(t => {
      if (t.table_id !== editTableInput.table_id) return t;
      // 如果 name 空白，就保留原來的 t.name
      const name = editTableInput.name.trim() || t.name;
      return {
        ...editTableInput,
        name
      };
    }));
    setShowEditForm(false);
  };

  // Overlap checks
  const hasOverlapAdd  = !!pendingTable && tables.some(t => rectsOverlap(t, pendingTable));
  const hasOverlapMove = moveTableMode && anyOverlap(tables);

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="kcafe-container"
      onMouseMove={handleTableMouseMove}
      onMouseUp={handleTableMouseUp}
    >
      <Navbar
        hideMenu={hideMenu}
        mode={mode}
        openBgForm={openBgForm}
        bgCropData={bgCropData}
        bgZoom={bgZoom}
        bgHidden={bgHidden}
        onToggleBgHidden={toggleBgHidden}
        gridHidden={gridHidden}
        onToggleGridHidden={toggleGridHidden}
        onImportData={handleImportData}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        setMode={setMode}
        tables={tables}
        addTable={openAddForm}
        pendingTable={pendingTable}
        cancelAddTable={cancelAddTable}
        confirmAddTable={confirmAddTable}
        startDeleteTableMode={startDeleteTableMode}
        deleteTableMode={deleteTableMode}
        selectedToDeleteTable={selectedToDeleteTable}
        confirmDeleteTable={confirmDeleteTable}
        cancelDeleteTableMode={cancelDeleteTableMode}
        startMoveTableMode={startMoveTableMode}
        moveTableMode={moveTableMode}
        selectedToMoveTable={selectedToMoveTable}
        confirmMoveTable={confirmMoveTable}
        cancelMoveTableMode={cancelMoveTableMode}
        hasOverlapAdd={hasOverlapAdd}
        hasOverlapMove={hasOverlapMove}
      />


      {/* Table Form Modals */}
      {(showAddForm || showEditForm) && (
        <TableForm
          mode={showAddForm ? 'add' : 'edit'}
          tableInput={showAddForm ? newTableInput : editTableInput}
          nextIndex={getNextTableIndex()}
          onInputChange={(f,v) =>
            showAddForm
              ? setNewTableInput(prev => ({ ...prev, [f]: v }))
              : setEditTableInput(prev => ({ ...prev, [f]: v }))
          }
          onSubmit={showAddForm ? submitAddForm : saveEditForm}
          onCancel={showAddForm ? cancelAddForm : cancelEditForm}
        />
      )}
      <div className="main-content">
        {/* Background + Tables */}
        <Background
          tables={tables}
          pendingTable={pendingTable}
          updateTableOccupied={updateTableOccupied}
          mode={mode}
          bgOffset={bgOffset}
          hideImage={bgHidden}
          hideGrid={gridHidden}
          bgImage={bgImage || '/img/KCafe.jpg'}
          handleRotate={rotateLayout}
          rotateCount={rotateCount}
          handleTableMouseDown={handleTableMouseDown}
          deleteTableMode={deleteTableMode}
          selectedToDeleteTable={selectedToDeleteTable}
          onSelectDeleteTable={setSelectedToDeleteTable}
          onEditTable={openEditForm}
          moveTableMode={moveTableMode}
          selectedToMoveTable={selectedToMoveTable}
          draggingTable={draggingTable}
        />

        {showBgForm && (
          <BackgroundForm
            srcOriginal="/img/KCafe.jpg"
            initialCrop={bgCropData}
            initialZoom={bgZoom}
            onSave={saveBgForm}
            onCancel={cancelBgForm}
          />
        )}


        {/* Header */}
        <h2>
          現在時間：{currentTime.toLocaleString()}
          <br />
          目前座位：<span className="remaining">{totalOccupied}</span>/{totalCapacity}
        </h2>

      </div>
    </div>

    

  );
};

export default KCafe;