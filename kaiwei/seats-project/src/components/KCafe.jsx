// src/components/KCafe.jsx
import React, { useState, useEffect } from 'react';
import Background from './Background';
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
const GRID_UNIT_PCT = 2;  

/**
 * Check if two tables overlap on the snap-to grid.
 * a, b: { left, top, width, height } with left/top in percent
 */
function rectsOverlap(a, b) {
  const dx = Math.abs(a.left - b.left);
  const dy = Math.abs(a.top  - b.top);

  const aHalfW = a.width  * GRID_UNIT_PCT;
  const aHalfH = a.height * GRID_UNIT_PCT;
  const bHalfW = b.width  * GRID_UNIT_PCT;
  const bHalfH = b.height * GRID_UNIT_PCT;

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
  { index: 1, id: 'A', left: 20, top: 20, capacity: 4, occupied: 2, description: '', width: 1, height: 1, extraSeatLimit: 0, updateTime: null, tags: [] },
  { index: 2, id: 'B', left: 50, top: 50, capacity: 6, occupied: 0, description: '', width: 1, height: 1, extraSeatLimit: 0, updateTime: null, tags: [] },
  { index: 3, id: 'C', left: 80, top: 30, capacity: 2, occupied: 1, description: '', width: 1, height: 1, extraSeatLimit: 0, updateTime: null, tags: [] },
];

// ─────────────────────────────────────────────────────────────────────────────
// KCafe Component
// ─────────────────────────────────────────────────────────────────────────────
const KCafe = ({ hideMenu = false }) => {
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
      localStorage.setItem(`kcafe_table_${t.index}`, JSON.stringify(t))
    );
  }, [tables]);

  // Rotation count (0–3), rotates layout 90° each time
  const [rotateCount, setRotateCount] = useState(0);

  // Pending / form states for Add/Edit
  const [pendingTable, setPendingTable]         = useState(null);
  const [showAddForm, setShowAddForm]           = useState(false);
  const [newTableInput, setNewTableInput]       = useState({ id:'', capacity:4, description:'', width:1, height:1, extraSeatLimit:0, tags:[] });
  const [showEditForm, setShowEditForm]         = useState(false);
  const [editTableInput, setEditTableInput]     = useState({ index:null, id:'', capacity:4, description:'', width:1, height:1, extraSeatLimit:0, tags:[] });

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

  // Increment/decrement occupied
  const updateTableOccupied = (tableIndex, delta) => {
    setTables(tables.map(t => {
      if (t.index !== tableIndex) return t;
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
  const handleTableMouseDown = (idx, e) => {
    if (mode !== 'edit') return;
    const isPend = pendingTable?.index === idx;
    if (!isPend && !moveTableMode) return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingTable(idx);
    if (moveTableMode && !isPend) setSelectedToMoveTable(idx);
  };

  const handleTableMouseMove = e => {
    if (draggingTable == null || mode !== 'edit') return;
    const bg = document.querySelector('.background').getBoundingClientRect();
    const rawX = ((e.clientX - bg.left - offset.x) / bg.width)  * 100;
    const rawY = ((e.clientY - bg.top  - offset.y) / bg.height) * 100;
    const snapX = Math.round(rawX / GRID_UNIT_PCT) * GRID_UNIT_PCT;
    const snapY = Math.round(rawY / GRID_UNIT_PCT) * GRID_UNIT_PCT;
    const clamped = pct => Math.max(0, Math.min(100, pct));

    const isPend = pendingTable?.index === draggingTable;
    if (!isPend && !moveTableMode) return;

    if (isPend) {
      setPendingTable(prev => ({
        ...prev,
        left: clamped(snapX),
        top:  clamped(snapY)
      }));
    } else {
      setTables(tables.map(t =>
        t.index === draggingTable
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
    const defaultId = String.fromCharCode(65 + ((idx - 1) % 26));
    setShowAddForm(true);
    setMenuOpen(false);
    setNewTableInput({ id: defaultId, capacity:4, description:'', width:2, height:2, extraSeatLimit:0, tags:[] });
  };
  const cancelAddForm = () => setShowAddForm(false);
  const submitAddForm = () => {
    const idx = getNextTableIndex();
    const id  = newTableInput.id.trim() || String.fromCharCode(65 + ((idx - 1) % 26));
    setPendingTable({
      index: idx,
      id,
      left: 50,
      top: 50,
      occupied: 0,
      ...newTableInput
    });
    setShowAddForm(false);
  };
  const cancelAddTable = () => setPendingTable(null);
  const confirmAddTable = () => {
    if (!pendingTable) return;
    setTables([...tables, pendingTable]);
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
    setTables(prev => prev.filter(t => t.index !== selectedToDeleteTable));
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
  const openEditForm = idx => {
    const t = tables.find(x => x.index === idx);
    if (!t) return;
    setEditTableInput({ ...t });
    setShowEditForm(true);
  };
  const cancelEditForm = () => setShowEditForm(false);
  const saveEditForm = () => {
    setTables(tables.map(t =>
      t.index !== editTableInput.index ? t : { ...editTableInput }
    ));
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

      {/* Header */}
      <h2>
        現在時間：{currentTime.toLocaleString()}
        <br />
        目前座位：<span className="remaining">{totalOccupied}</span>/{totalCapacity}
      </h2>

      {/* Background + Tables */}
      <Background
        tables={tables}
        pendingTable={pendingTable}
        updateTableOccupied={updateTableOccupied}
        mode={mode}
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
    </div>
  );
};

export default KCafe;
