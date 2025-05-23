// src/components/KCafe.jsx
import React, { useState, useEffect } from 'react';
import Background from './Background';
import BackgroundForm from './BackgroundForm';
import Navbar     from './Navbar';
import TableForm  from './TableForm';
import '../styles/Global.css';
import '../styles/Navbar.css';
import '../styles/Background.css';
import '../styles/Table.css';
import '../styles/TableForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants & Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Grid unit (percent); must match CSS (8% per cell or adjust accordingly)
const GRID_UNIT_X = 2;
const GRID_UNIT_Y   = 3.125;

/**
 * Check if two tables overlap on the snap-to grid.
 * a, b: { left, top, width, height } with left/top in percent
 */
function rectsOverlap(a, b) {
  const dx = Math.abs(a.left - b.left);
  const dy = Math.abs(a.top  - b.top);

  const aHalfW = a.width  * GRID_UNIT_X;
  const aHalfH = a.height * GRID_UNIT_Y;
  const bHalfW = b.width  * GRID_UNIT_X;
  const bHalfH = b.height * GRID_UNIT_Y;

  // If gap on either axis ≥ sum of half-sizes, no overlap
  if (dx >= aHalfW + bHalfW || dy >= aHalfH + bHalfH) {
    return false;
  }
  return true;
}

/** Returns true if any pair in tables[] overlaps */
function anyOverlap(tables) {
  for (let i = 0; i < tables.length; i++) {
    for (let j = i + 1; j < tables.length; j++) {
      if (rectsOverlap(tables[i], tables[j])) {
        return true;
      }
    }
  }
  return false;
}

// Initial default tables
const INITIAL_TABLES = [
  {
    table_id: '1F_01',
    floor: '1F',
    index: 1,
    name: 'A',
    left: 20, top: 20,
    width: 1, height: 1,
    capacity: 4,
    occupied: 2,
    extraSeatLimit: 0,
    tags: [],
    description: '',
    updateTime: null,
    available: true
  },
  // ...
];

// ─────────────────────────────────────────────────────────────────────────────
// KCafe Component
// ─────────────────────────────────────────────────────────────────────────────
const KCafe = ({ hideMenu = false }) => {
  
  const [showBgForm, setShowBgForm] = useState(false);
  const [bgOffset,   setBgOffset]   = useState({ x:50, y:50 });
  
  const openBgForm   = () => setShowBgForm(true);
  const cancelBgForm = () => setShowBgForm(false);
  const saveBgForm   = crop => {
    // TODO: 根据 crop.x/y/w/h 调整实际 background 的 CSS 
    // （例如通过 object-position / clip-path 等）
    setShowBgForm(false);
  };
  


  // ----- State Hooks -----
  // Tables loaded from localStorage or default
  const [tables, setTables] = useState(() => {
    const restored = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('kcafe_table_')) {
        try {
          restored.push(JSON.parse(localStorage.getItem(key)));
        } catch {}
      }
    });
    return restored.length ? restored : INITIAL_TABLES;
  });
  // Persist to localStorage on every change
  useEffect(() => {
    tables.forEach(t =>
      localStorage.setItem(`kcafe_table_${t.table_id}`, JSON.stringify(t))
    );
  }, [tables]);

  // Rotation count (0–3), rotates layout 90° each time
  const [rotateCount, setRotateCount] = useState(0);

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
    const id = setInterval(() => window.location.reload(), 5000);
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

  // Rotate all tables & swap width/height
  const rotateLayout = () => {
    setTables(tables.map(t => ({
      ...t,
      left:   t.top,
      top:    100 - t.left,
      width:  t.height,
      height: t.width
    })));
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
         width:1, height:1,
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
        hideMenu={hideMenu}   // ← new
        mode={mode}
        openBgForm={openBgForm}
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

      {/* Background + Tables */}
      <Background
        tables={tables}
        pendingTable={pendingTable}
        updateTableOccupied={updateTableOccupied}
        mode={mode}
        bgOffset={bgOffset}
        handleRotate={rotateLayout}
        rotateCount={rotateCount}
        handleTableMouseDown={(id,e) => handleTableMouseDown(id, e)}
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
          bgOffset={bgOffset}
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

    

  );
};

export default KCafe;
