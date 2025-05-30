import React, { useState, useEffect } from 'react';
import BackgroundForm from './Forms/BackgroundForm';
import TableForm from './Forms/TableForm';
import Background from './Background';
import Navbar from './Navbar';
import TableList from './TableList'
import '../styles/Global.css';
import '../styles/Navbar.css';
import '../styles/Background.css';
import '../styles/Table.css';
import '../styles/TableForm.css';
import '../styles/TableList.css';

const API_URL = "http://localhost:8002";

const GRID_UNIT_X = 2;
const GRID_UNIT_Y = 3.125;
const getPoint = e =>
  e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
            : { x: e.clientX,           y: e.clientY };


function rectsOverlap(a, b) {
  const dx = Math.abs(a.left - b.left);
  const dy = Math.abs(a.top - b.top);
  const aHalfW = a.width  * GRID_UNIT_X;
  const aHalfH = a.height * GRID_UNIT_Y;
  const bHalfW = b.width  * GRID_UNIT_X;
  const bHalfH = b.height * GRID_UNIT_Y;
  return !(dx >= aHalfW + bHalfW || dy >= aHalfH + bHalfH);
}

function anyOverlap(tables) {
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      if (rectsOverlap(tables[i], tables[j])) return true;
    }
  }
  return false;
}

function rotateTablesOnce(arr) {
  return arr.map(t => ({
    ...t,
    left:   100 - t.top,
    top:    t.left,
    width:  t.height,
    height: t.width
  }));
}

const INITIAL_TABLES = [
  {
    table_id: '1F_01', floor: '1F', index: 1, name: 'A',
    left: 20, top: 20, width: 1, height: 1,
    capacity: 4, occupied: 2, extraSeatLimit: 0,
    tags: [], description: '', updateTime: null, available: true
  }
  // ...
];

const getCroppedImg = (imageSrc, pixelCrop) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = pixelCrop.width;
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
    if (deg === 0) return resolve(src);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = src;
    img.onload = () => {
      const swap   = deg === 90 || deg === 270;
      const canvas = document.createElement('canvas');
      canvas.width  = swap ? img.height : img.width;
      canvas.height = swap ? img.width  : img.height;
      const ctx = canvas.getContext('2d');

      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      canvas.toBlob(b => {
        if (!b) return reject(new Error('canvas empty'));
        resolve(URL.createObjectURL(b));
      }, 'image/jpeg');
    };
    img.onerror = reject;
  });

const modules = import.meta.glob(
  '../assets/menu/*.{png,jpg,jpeg,svg,webp}', 
  { eager: true,  /* 立刻載入 */ 
    as: 'url'     /* 直接回傳檔案 URL */ }
);
const menuImages = Object.values(modules);

const DEFAULT_CROP = { x: 408, y: 146, width: 1105, height: 707 };
const DEFAULT_ZOOM = 1.411;


// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const KCafe = ({ hideMenu = false }) => {

  // ── Carousel Index ────────────────────────────────────────────────────────
  const [menuIdx, setMenuIdx] = useState(0);


  // ── Background & Grid Visibility ──────────────────────────────────────────
  const [rotateCount, setRotateCount] = useState(hideMenu ? 1 : 0);
  const [showBgForm,  setShowBgForm]  = useState(false);

  const [defaultBgHidden, setDefaultBgHidden] = useState(() => {
   const stored = localStorage.getItem('kcafe_guest_bgHidden');
   return stored !== null
     ? JSON.parse(stored)
     : false;
  });

  const [defaultGridHidden, setDefaultGridHidden] = useState(() => {
    const stored = localStorage.getItem('kcafe_guest_gridHidden');
    return stored !== null
      ? JSON.parse(stored)
      : false;
    });

  const [defaultSeatIndex, setDefaultSeatIndex] = useState(() => {
    const stored = localStorage.getItem('kcafe_guest_seatIndex');
    return stored !== null
      ? JSON.parse(stored)
      : true;
  });

  const [viewBgHidden,        setViewBgHidden]        = useState(defaultBgHidden);
  const [viewGridHidden,      setViewGridHidden]      = useState(defaultGridHidden);
  const [viewSeatIndexShown,  setViewSeatIndexShown]  = useState(defaultSeatIndex);
  useEffect(() => { setViewBgHidden(defaultBgHidden); }, [defaultBgHidden]);
  useEffect(() => { setViewGridHidden(defaultGridHidden); }, [defaultGridHidden]);
  useEffect(() => { setViewSeatIndexShown(defaultSeatIndex); }, [defaultSeatIndex]);

  const [bgOffset] = useState({ x: 50, y: 50 });
  const [bgImage,  setBgImage]  = useState('');

  const [bgCropData, setBgCropData] = useState(() =>
    JSON.parse(localStorage.getItem('kcafe_bg_crop') || JSON.stringify(DEFAULT_CROP))
  );

  const [bgZoom, setBgZoom] = useState(() => {
    const z = localStorage.getItem('kcafe_bg_zoom');
    return z !== null ? parseFloat(z) : DEFAULT_ZOOM;
  });

  const toggleDefaultSeat = () =>
    setDefaultSeatIndex(prev => {
     const next = !prev;
      if (hideMenu) localStorage.setItem('kcafe_guest_seatIndex', next);
      return next;
    });
  const handleSaveDisplaySettings = ({ bgHidden, gridHidden, seatIndex }) => {
    setDefaultBgHidden(bgHidden);
    setDefaultGridHidden(gridHidden);
    setDefaultSeatIndex(seatIndex);

    setViewBgHidden(bgHidden);
    setViewGridHidden(gridHidden);
    setViewSeatIndexShown(seatIndex);

    localStorage.setItem('kcafe_guest_bgHidden',   JSON.stringify(bgHidden));
    localStorage.setItem('kcafe_guest_gridHidden', JSON.stringify(gridHidden));
    localStorage.setItem('kcafe_guest_seatIndex',  JSON.stringify(seatIndex));
   };

  // ── Background Generation ────────────────────────────────────────────────
  useEffect(() => {
    let prevUrl;
    getCroppedImg('/img/KCafe.jpg', bgCropData)
      .then(url  => rotateImage(url, rotateCount * 90))
      .then(url  => { setBgImage(url); prevUrl = url; })
      .catch(console.error);

    return () => { if (prevUrl) URL.revokeObjectURL(prevUrl); };
  }, [bgCropData, rotateCount]);


  // ── Background Form Handlers ──────────────────────────────────────────────
  const openBgForm   = () => setShowBgForm(true);
  const cancelBgForm = () => setShowBgForm(false);

  const saveBgForm = ({ url, crop, zoom }) => {
    if (!url) return;
    setBgCropData(crop); localStorage.setItem('kcafe_bg_crop', JSON.stringify(crop));
    setBgZoom(zoom);     localStorage.setItem('kcafe_bg_zoom', zoom.toString());
    setShowBgForm(false);
  };

  // ── Table State & Persistence ─────────────────────────────────────────────
  /*    
  // original read and set table
  const [tables, setTables] = useState(() => {
    const restored = [];
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('kcafe_table_')) {
        try { restored.push(JSON.parse(localStorage.getItem(k))); } catch {}
      }
    });
    const base = restored.length ? restored : INITIAL_TABLES;
    return hideMenu ? rotateTablesOnce(base) : base;
  });
  */
  
  // read and set table: connect to database server
  useEffect(() => {
  fetch(`${API_URL}/seats`)
    .then(res => res.json())
    .then(data => {
      const tableList = hideMenu ? rotateTablesOnce(data) : data;
      setTables(tableList);
    })
    .catch(console.error);
    }, [hideMenu]);


  useEffect(() => {
    if (hideMenu) return;
    tables.forEach(t =>
      localStorage.setItem(`kcafe_table_${t.table_id}`, JSON.stringify(t))
    );
  }, [tables, hideMenu]);

  const toggleAvailable = tableId => {
    setTables(ts =>
      ts.map(t =>
        t.table_id === tableId ? { ...t, available: !t.available } : t
      )
    );
  };


  // ── Import Handler ────────────────────────────────────────────────────────
  const handleImportData = async ({ bgCrop, bgZoom: impZoom, tables: newTables,
    gridHidden: importedGridHidden, seatIndexShown: importedSeatShown, bgHidden: importedBgHidden
  }) => {
    setBgZoom(impZoom);  localStorage.setItem('kcafe_bg_zoom',  impZoom.toString());
    setBgCropData(bgCrop); localStorage.setItem('kcafe_bg_crop', JSON.stringify(bgCrop));

    setTables(newTables);
    newTables.forEach(t =>
      localStorage.setItem(`kcafe_table_${t.table_id}`, JSON.stringify(t))
    );

    if (typeof importedSeatShown === 'boolean') {
      setDefaultBgHidden(importedBgHidden);
      setDefaultGridHidden(importedGridHidden);
      setDefaultSeatIndex(importedSeatShown);
    }
  };


  // ── Pending / Form States ────────────────────────────────────────────────
  const [pendingTable, setPendingTable] = useState(null);

  const [showAddForm, setShowAddForm]     = useState(false);
  const [newTableInput, setNewTableInput] = useState({
    table_id: '', floor: '1F', index: 0, name: '',
    left: 50, top: 50, width: 1, height: 1,
    capacity: 4, occupied: 0, extraSeatLimit: 0,
    tags: [], description: '', updateTime: null, available: true
  });

  const [showEditForm, setShowEditForm]   = useState(false);
  const [editTableInput, setEditTableInput] = useState({
    table_id: '', floor: '1F', index: 0, name: '',
    left: 50, top: 50, width: 1, height: 1,
    capacity: 4, occupied: 0, extraSeatLimit: 0,
    tags: [], description: '', updateTime: null, available: true
  });


  // ── Delete / Move Modes ───────────────────────────────────────────────────
  const [deleteTableMode,     setDeleteTableMode]     = useState(false);
  const [selectedToDeleteList, setSelectedToDeleteList] = useState([]);

  const [moveTableMode,       setMoveTableMode]       = useState(false);
  const [selectedToMoveTable, setSelectedToMoveTable] = useState(null);

  const [backupTables,        setBackupTables]        = useState(null);


  // ── Drag State ────────────────────────────────────────────────────────────
  const [draggingTable, setDraggingTable] = useState(null);
  const [offset,        setOffset]        = useState({ x: 0, y: 0 });


  // ── Clock & UI Mode ───────────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());

  const [mode, setMode]               = useState('business'); // 'business' | 'edit' | 'view'
  const [menuOpen, setMenuOpen]       = useState(false);
  const [businessTab, setBusinessTab] = useState('seating');

  const showBackground =
    mode === 'edit' ||
    ((mode === 'business' || mode === 'view') && businessTab === 'seating');


  // ── Effects: Clock & Auto-Reload for Guest View ───────────────────────────
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!hideMenu) return;
    setMode('view');
    const id = setInterval(() => window.location.reload(), 30000);
    return () => clearInterval(id);
  }, [hideMenu]);

  useEffect(() => {
    if (mode === 'view') setRotateCount(1);
    else if (!hideMenu) setRotateCount(0);
  }, [mode, hideMenu]);


  // ── Computed Helpers ──────────────────────────────────────────────────────
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalOccupied = tables.reduce((sum, t) => sum + t.occupied, 0);

  const getNextTableIndex = () => {
    const used = tables.map(t => t.index);
    let idx = 1;
    while (used.includes(idx)) idx++;
    return idx;
  };

  const DEFAULT_FLOOR = '1F';
  const pad2 = num => String(num).padStart(2, '0');
  const makeTableId = (type, index) => `${type}_${pad2(index)}`;

  // Increment/decrement occupied
  /*
  // original localStorage updateTableOccupied
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
  */
  
  // updateTableOccupied: db server
  const updateTableOccupied = (tableId, delta) => {
  const target = tables.find(t => t.table_id === tableId);
  if (!target) return;
  const maxOcc = target.capacity + (target.extraSeatLimit || 0);
  const newOccupied = Math.min(maxOcc, Math.max(0, target.occupied + delta));
  const newTime = delta > 0 ? new Date().toISOString() : target.updateTime;

  fetch(`${API_URL}/seats`)
    .then(res => res.json())
    .then(allSeats => {
      const seat = allSeats.find(s => s.table_id === tableId);
      if (!seat) return;

      fetch(`${API_URL}/seats/${seat.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupied: newOccupied,
          updateTime: newTime
        })
      })
        .then(() => {
          setTables(tables.map(t =>
            t.table_id === tableId
              ? { ...t, occupied: newOccupied, updateTime: newTime }
              : t
          ));
        });
    });
};


  const rotateLayout = () => {
    setTables(prev => rotateTablesOnce(prev));
    setRotateCount(c => (c + 1) % 4);
  };

  // ----- Drag Handlers -----
  const handleTablePointerDown = (tableId, e) => {
    if (mode !== 'edit') return;
    const isPend = pendingTable?.table_id === tableId;
    if (!isPend && !moveTableMode) return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    const { x, y } = getPoint(e);
    setOffset({ x: x - rect.left, y: y - rect.top });
    setDraggingTable(tableId);
    if (moveTableMode && !isPend) setSelectedToMoveTable(tableId);
  };

  const handleTablePointerMove = e => {
    if (draggingTable == null || mode !== 'edit') return;
    const bg = document.querySelector('.background').getBoundingClientRect();
    const { x: cx, y: cy } = getPoint(e);
    const rawX = ((cx - bg.left - offset.x) / bg.width)  * 100;
    const rawY = ((cy - bg.top  - offset.y) / bg.height) * 100;
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

  const handleTablePointerUp = () => setDraggingTable(null);

  // ----- Add Table Flow -----
  const openAddSeat = () => {
    if (mode !== 'edit' || deleteTableMode || moveTableMode || pendingTable) return
  
    const seatIdx = tables
      .filter(t => t.table_id.startsWith('s_'))
      .reduce((m, t) => Math.max(m, t.index), 0) + 1
  
      const id = makeTableId('s', seatIdx);
  
    setPendingTable({
      table_id: id,
      floor: DEFAULT_FLOOR,
      index: seatIdx,
      name: String("seat"+seatIdx),
      left: 50,
      top: 50,
      width: 0.75,
      height: 0.75,
      capacity: 0,
      occupied: 0,
      extraSeatLimit: 0,
      tags: [],
      description: '',
      updateTime: null,
      available: false
    })
  }
  const openAddForm = () => {
    if (mode !== 'edit' || deleteTableMode || moveTableMode || pendingTable) return;
       const idx       = getNextTableIndex();
       const id  = makeTableId('t', idx);
       const defaultName = String.fromCharCode(65 + ((idx - 1) % 26));
       setShowAddForm(true);
       setNewTableInput({
        ...newTableInput,
         table_id: id,
         index: idx,
         name: defaultName,
         left: 50, top: 50,
         width:2, height:2,
         capacity:4, occupied:0,
         extraSeatLimit:0,
         tags: [], description:'',
         updateTime: null,
         available: true,
         floor: DEFAULT_FLOOR,
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
      table_id: makeTableId('t', idx)
    });
    setShowAddForm(false);
  };
  const cancelAddTable = () => setPendingTable(null);
  
  /*
  // original localStorage confirmAddTable
  const confirmAddTable = () => {
    if (!pendingTable) return;
    setTables(tables => [...tables, pendingTable]);
    setPendingTable(null);
  };
  */
  // confirmAddTable: db server
  const confirmAddTable = () => {
  if (!pendingTable) return;
  fetch(`${API_URL}/seats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pendingTable)
  })
    .then(res => res.json())
    .then(newSeat => {
      setTables(tables => [...tables, newSeat]);
      setPendingTable(null);
    })
    .catch(console.error);
};
  
  // ----- Delete Table Flow -----
  const startDeleteTableMode = () => {
    if (mode !== 'edit') return;
    setDeleteTableMode(true);
    setSelectedToDeleteList([]);
  };

  const toggleSelectDelete = id =>
    setSelectedToDeleteList(list =>
      list.includes(id) ? list.filter(x => x !== id) : [...list, id]
    );

  const confirmDeleteTable = () => {
    if (selectedToDeleteList.length === 0) return;
    selectedToDeleteList.forEach(id =>
      localStorage.removeItem(`kcafe_table_${id}`)
    );
    setTables(ts => ts.filter(t => !selectedToDeleteList.includes(t.table_id)));
    setDeleteTableMode(false);
    setSelectedToDeleteList([]);
  };

  const cancelDeleteTableMode = () => {
    setDeleteTableMode(false);
    setSelectedToDeleteList([]);
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
  const isBizOrView = mode === 'business' || mode === 'view'

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div
      className="kcafe-container"
      onMouseMove={handleTablePointerMove}
      onTouchMove={handleTablePointerMove}
      onMouseUp={handleTablePointerUp}
      onTouchEnd={handleTablePointerUp}
    >
  
      <Navbar
        hideMenu={hideMenu}
  
        mode={mode}
        setMode={setMode}
  
        businessTab={businessTab}
        setBusinessTab={setBusinessTab}
  
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
  
        openBgForm={openBgForm}
        bgCropData={bgCropData}
        bgZoom={bgZoom}
  
        onImportData={handleImportData}

        addSeat={openAddSeat}
        defaultBgHidden={defaultBgHidden}
        defaultGridHidden={defaultGridHidden}
        defaultSeatIndex={defaultSeatIndex}
        viewBgHidden={viewBgHidden}
        viewGridHidden={viewGridHidden}
        viewSeatIndex={viewSeatIndexShown}
        onToggleDefaultBg={() => setDefaultBgHidden(v => !v)}
        onToggleDefaultGrid={() => setDefaultGridHidden(v => !v)}
        onToggleDefaultSeat={toggleDefaultSeat}
        onToggleViewBg={() => setViewBgHidden(v => !v)}
        onToggleViewGrid={() => setViewGridHidden(v => !v)}
        onToggleViewSeat={() => setViewSeatIndexShown(v => !v)}
        onSaveDisplaySettings={handleSaveDisplaySettings}

        tables={tables}
        addTable={openAddForm}
        pendingTable={pendingTable}
        cancelAddTable={cancelAddTable}
        confirmAddTable={confirmAddTable}
  
        startDeleteTableMode={startDeleteTableMode}
        deleteTableMode={deleteTableMode}
        selectedToDeleteList={selectedToDeleteList} 
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
  
      {(showAddForm || showEditForm) && (
        <TableForm
          mode={showAddForm ? 'add' : 'edit'}
          tableInput={showAddForm ? newTableInput : editTableInput}
          nextIndex={getNextTableIndex()}
  
          onInputChange={(f, v) =>
            showAddForm
              ? setNewTableInput(prev => ({ ...prev, [f]: v }))
              : setEditTableInput(prev => ({ ...prev, [f]: v }))
          }
  
          onSubmit={showAddForm ? submitAddForm : saveEditForm}
          onCancel={showAddForm ? cancelAddForm : cancelEditForm}
  
          onToggleAvailable={toggleAvailable}
        />
      )}
  
      <div className="main-content">
  
        {showBackground && (
          <Background
            tables={tables}
            pendingTable={pendingTable}
            updateTableOccupied={updateTableOccupied}
            showSeatIndex={viewSeatIndexShown}

            mode={mode}
  
            bgOffset={bgOffset}
            bgImage={bgImage || '/img/KCafe.jpg'}
            hideImage={viewBgHidden}
            hideGrid={viewGridHidden}
  
            handleRotate={rotateLayout}
            rotateCount={rotateCount}
  
            handleTableMouseDown={handleTablePointerDown}
  
            deleteTableMode={deleteTableMode}
            selectedToDeleteList={selectedToDeleteList}
            onToggleDeletePick={toggleSelectDelete} 
  
            onEditTable={openEditForm}
  
            moveTableMode={moveTableMode}
            selectedToMoveTable={selectedToMoveTable}
            draggingTable={draggingTable}
          />
        )}
  
        {isBizOrView && businessTab === 'info' && (
          <TableList
            tables={tables}
            mode={mode}
  
            onEditTable={openEditForm}
            onToggleAvailable={toggleAvailable}
          />
        )}
  
        {isBizOrView && businessTab === 'menu' && (
          <div className="menu-placeholder">
            {menuImages.length === 0 ? (
              <p>目前沒有菜單圖片</p>
            ) : (
              <div className="menu-carousel">
                <div className="carousel-main">
                  <button
                    className="nav prev"
                    onClick={() =>
                      setMenuIdx((menuIdx + menuImages.length - 1) % menuImages.length)
                    }
                  >
                    ‹
                  </button>
    
                  <div className="image-container">
                    <img
                      src={menuImages[menuIdx]}
                      alt={`menu-${menuIdx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
    
                  <button
                    className="nav next"
                    onClick={() => setMenuIdx((menuIdx + 1) % menuImages.length)}
                  >
                    ›
                  </button>
                  </div>
                <div className="carousel-indicator">
                  第 {menuIdx + 1} 張 / 共 {menuImages.length} 張
                </div>
              </div>
            )}
          </div>
        )}
  
        {showBgForm && (
          <BackgroundForm
            srcOriginal="/img/KCafe.jpg"
            initialCrop={bgCropData}
            initialZoom={bgZoom}
            onSave={saveBgForm}
            onCancel={cancelBgForm}
          />
        )}
  
        <h2>
          現在時間：{currentTime.toLocaleString()}
          <br />
          目前座位：
          <span className="remaining">{totalOccupied}</span>/
          {totalCapacity}
        </h2>
  
      </div>
    </div>
  );  
};

export default KCafe;