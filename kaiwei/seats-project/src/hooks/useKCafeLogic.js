import { useState, useEffect } from 'react';

const GRID_UNIT_X = 2;
const GRID_UNIT_Y = 3.125;

function rectsOverlap(a, b) {
  const dx = Math.abs(a.left - b.left);
  const dy = Math.abs(a.top - b.top);
  const aHalfW = a.width * GRID_UNIT_X;
  const aHalfH = a.height * GRID_UNIT_Y;
  const bHalfW = b.width * GRID_UNIT_X;
  const bHalfH = b.height * GRID_UNIT_Y;
  return !(dx >= aHalfW + bHalfW || dy >= aHalfH + bHalfH);
}

function anyOverlap(tables) {
  return tables.some((t1, i) =>
    tables.slice(i + 1).some(t2 => rectsOverlap(t1, t2))
  );
}

export default function useKCafeLogic(hideMenu) {
  // 先從 localStorage 讀取背景設定，若沒有就用預設
  let savedBg = null;
  try {
    savedBg = JSON.parse(localStorage.getItem('kcafe_bg'));
  } catch {}
  const initOffsetPx = savedBg?.offsetPx ?? { x: 0, y: 0 };
  const initZoom     = savedBg?.zoom     ?? 1;
  // Background state
  const [bgOffset, setBgOffset] = useState({ x: 50, y: 50 });
  const [isEditingBg, setIsEditingBg] = useState(false);
  const [tempBgOffset, setTempBgOffset] = useState(bgOffset);
  const [draggingBg, setDraggingBg] = useState(false);
  const [bgDragStart, setBgDragStart] = useState(null);
  const [zoom, setZoom] = useState(initZoom);
  const [tempZoom, setTempZoom] = useState(initZoom);
  const [offsetPx, setOffsetPx] = useState(initOffsetPx);
  const [tempOffsetPx, setTempOffsetPx] = useState(initOffsetPx);

  
  // Table data
  const [tables, setTables] = useState(() => {
    const entries = Object.keys(localStorage)
      .filter(key => key.startsWith('kcafe_table_'))
      .map(key => {
        try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
      })
      .filter(Boolean);
    return entries.length ? entries : [];
  });
  useEffect(() => {
    tables.forEach(t =>
      localStorage.setItem(`kcafe_table_${t.table_id}`, JSON.stringify(t))
    );
  }, [tables]);

  // Rotate count
  const [rotateCount, setRotateCount] = useState(0);

  // Add/Edit state
  const [pendingTable, setPendingTable] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableInput, setNewTableInput] = useState({});
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTableInput, setEditTableInput] = useState({});

  // Delete/Move modes
  const [deleteTableMode, setDeleteTableMode] = useState(false);
  const [selectedToDeleteTable, setSelectedToDeleteTable] = useState(null);
  const [moveTableMode, setMoveTableMode] = useState(false);
  const [selectedToMoveTable, setSelectedToMoveTable] = useState(null);
  const [backupTables, setBackupTables] = useState(null);

  // Dragging tables
  const [draggingTable, setDraggingTable] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Mode and clock
  const [mode, setMode] = useState('business');
  const [menuOpen, setMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Auto-reload in view when hideMenu
  useEffect(() => {
    if (!hideMenu) return;
    setMode('view');
    const id = setInterval(() => window.location.reload(), 5000);
    return () => clearInterval(id);
  }, [hideMenu]);

  // Computed
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalOccupied = tables.reduce((sum, t) => sum + t.occupied, 0);

  // Helpers
  const getNextTableIndex = () => {
    const used = tables.map(t => t.index);
    let idx = 1;
    while (used.includes(idx)) idx++;
    return idx;
  };

  const DEFAULT_FLOOR = '1F';
  const makeTableId = (floor, index) =>
    `${floor}_${String(index).padStart(2, '0')}`;

  // Background edit
  const startBgEdit = () => { setTempBgOffset(bgOffset); setTempZoom(zoom); setTempOffsetPx(offsetPx); setIsEditingBg(true); };
  const cancelBgEdit = () => { setTempBgOffset(bgOffset); setTempZoom(zoom); setTempOffsetPx(offsetPx); setIsEditingBg(false); };
  const confirmBgEdit = () => {
        setBgOffset(tempBgOffset);
        setOffsetPx(tempOffsetPx);
        setZoom(tempZoom);
        // 寫入 localStorage
        localStorage.setItem(
          'kcafe_bg',
          JSON.stringify({ offsetPx: tempOffsetPx, zoom: tempZoom })
        );
        setIsEditingBg(false);
      };

const handleBgMouseDown = e => {
  if (!isEditingBg) return;
  e.preventDefault();
  const rect = document.querySelector('.background').getBoundingClientRect();
  setDraggingBg(true);
  setBgDragStart({
    originOffsetPx: tempOffsetPx,
    clickX: e.clientX,
    clickY: e.clientY,
    rect
  });
};

const handleBgMouseMove = e => {
  if (!draggingBg || !bgDragStart) return;
  const { originOffsetPx, clickX, clickY } = bgDragStart;
  // 直接在屏幕坐标上算差，再加回 originOffsetPx
  const dx = e.clientX - clickX;
  const dy = e.clientY - clickY;
  setTempOffsetPx({
    x: originOffsetPx.x + dx,
    y: originOffsetPx.y + dy
  });
};

  const handleBgMouseUp = () => { if (draggingBg) setDraggingBg(false); };

  // Table interactions
  const handleTableMouseDown = (tableId, e) => {
    if (isEditingBg || mode !== 'edit') return;
    const isPend = pendingTable && pendingTable.table_id === tableId;
    if (!isPend && !moveTableMode) return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingTable(tableId);
    if (moveTableMode && !isPend) setSelectedToMoveTable(tableId);
  };
  const handleTableMouseMove = e => {
    if (isEditingBg || draggingTable == null || mode !== 'edit') return;
    const bgRect = document.querySelector('.background').getBoundingClientRect();
    const rawX = ((e.clientX - bgRect.left - offset.x) / bgRect.width) * 100;
    const rawY = ((e.clientY - bgRect.top - offset.y) / bgRect.height) * 100;
    const snapX = Math.round(rawX / GRID_UNIT_X) * GRID_UNIT_X;
    const snapY = Math.round(rawY / GRID_UNIT_Y) * GRID_UNIT_Y;
    const clamp = v => Math.max(0, Math.min(100, v));
    const isPend = pendingTable && pendingTable.table_id === draggingTable;
    if (!isPend && !moveTableMode) return;
    if (isPend) {
      setPendingTable(prev => ({ ...prev, left: clamp(snapX), top: clamp(snapY) }));
    } else {
      setTables(ts => ts.map(t =>
        t.table_id === draggingTable
          ? { ...t, left: clamp(snapX), top: clamp(snapY) }
          : t
      ));
    }
  };
  const handleTableMouseUp = () => setDraggingTable(null);

  // Add table
  const openAddForm = () => {
    if (mode !== 'edit' || deleteTableMode || moveTableMode || pendingTable) return;
    const idx = getNextTableIndex();
    const tid = makeTableId(DEFAULT_FLOOR, idx);
    setShowAddForm(true);
    setNewTableInput({
      table_id: tid,
      floor: DEFAULT_FLOOR,
      index: idx,
      name: String.fromCharCode(65 + ((idx - 1) % 26)),
      left: 50,
      top: 50,
      width: 2,
      height: 2,
      capacity: 4,
      occupied: 0,
      extraSeatLimit: 0,
      tags: [],
      description: '',
      updateTime: null,
      available: true
    });
  };
  const cancelAddForm = () => setShowAddForm(false);
  const submitAddForm = () => {
    const idx = getNextTableIndex();
    const defaultName = String.fromCharCode(65 + ((idx - 1) % 26));
    setPendingTable({
      ...newTableInput,
      index: idx,
      table_id: makeTableId(DEFAULT_FLOOR, idx),
      name: newTableInput.name.trim() || defaultName
    });
    setShowAddForm(false);
  };
  const cancelAddTable = () => setPendingTable(null);
  const confirmAddTable = () => { if (pendingTable) setTables(ts => [...ts, pendingTable]); setPendingTable(null); };

  // Delete table
  const startDeleteTableMode = () => { if (mode === 'edit') { setDeleteTableMode(true); setSelectedToDeleteTable(null); } };
  const confirmDeleteTable = () => { if (selectedToDeleteTable) { localStorage.removeItem(`kcafe_table_${selectedToDeleteTable}`); setTables(ts => ts.filter(t => t.table_id !== selectedToDeleteTable)); setDeleteTableMode(false); setSelectedToDeleteTable(null);} };
  const cancelDeleteTableMode = () => { setDeleteTableMode(false); setSelectedToDeleteTable(null); };

  // Move table
  const startMoveTableMode = () => { if (mode === 'edit') { setBackupTables([...tables]); setMoveTableMode(true); setSelectedToMoveTable(null);} };
  const confirmMoveTable = () => { setMoveTableMode(false); setSelectedToMoveTable(null); setBackupTables(null); };
  const cancelMoveTableMode = () => { setTables(backupTables); setMoveTableMode(false); setSelectedToMoveTable(null); setBackupTables(null);} ;

  // Edit table form
  const openEditForm = id => { const t = tables.find(x => x.table_id === id); if (t) { setEditTableInput({ ...t }); setShowEditForm(true); } };
  const cancelEditForm = () => setShowEditForm(false);
  const saveEditForm = () => { setTables(ts => ts.map(t => t.table_id === editTableInput.table_id ? { ...editTableInput, name: editTableInput.name.trim() || t.name } : t)); setShowEditForm(false); };

  // Update occupied count
  const updateTableOccupied = (tableId, delta) => {
    setTables(ts => ts.map(t => t.table_id === tableId ? { ...t, occupied: Math.min(t.capacity + (t.extraSeatLimit || 0), Math.max(0, t.occupied + delta)), updateTime: delta > 0 ? new Date().toISOString() : t.updateTime } : t));
  };

  // Rotate layout
  const rotateLayout = () => {
    setTables(ts => ts.map(t => ({ ...t, left: t.top, top: 100 - t.left, width: t.height, height: t.width }))); setRotateCount(c => (c + 1) % 4);
  };

  // Combined mouse events
  const handleMouseMove = e => { handleBgMouseMove(e); handleTableMouseMove(e); };
  const handleMouseUp = e => { handleBgMouseUp(); handleTableMouseUp(); };

  // Overlap checks
  const hasOverlapAdd = !!pendingTable && tables.some(t => rectsOverlap(t, pendingTable));
  const hasOverlapMove = moveTableMode && anyOverlap(tables);

  return {
    zoom,
    setZoom,
    tempZoom,
    setTempZoom,
    bgOffset,
    isEditingBg,
    tempBgOffset,
    startBgEdit,
    cancelBgEdit,
    confirmBgEdit,
    offsetPx,
    tempOffsetPx,
    setTempOffsetPx,
    handleBgMouseDown,
    handleBgMouseMove,
    handleBgMouseUp,
    tables,
    totalCapacity,
    totalOccupied,
    rotateCount,
    rotateLayout,
    pendingTable,
    showAddForm,
    openAddForm,
    cancelAddForm,
    newTableInput,
    setNewTableInput,
    submitAddForm,
    cancelAddTable,
    confirmAddTable,
    deleteTableMode,
    selectedToDeleteTable,
    setSelectedToDeleteTable,
    startDeleteTableMode,
    confirmDeleteTable,
    cancelDeleteTableMode,
    moveTableMode,
    selectedToMoveTable,
    startMoveTableMode,
    confirmMoveTable,
    cancelMoveTableMode,
    showEditForm,
    openEditForm,
    cancelEditForm,
    editTableInput,
    setEditTableInput,
    saveEditForm,
    draggingBg,
    draggingTable,
    handleTableMouseDown,
    handleTableMouseMove,
    handleTableMouseUp,
    updateTableOccupied,
    mode,
    setMode,
    menuOpen,
    setMenuOpen,
    currentTime,
    handleMouseMove,
    handleMouseUp,
    hasOverlapAdd,
    hasOverlapMove
  };
}
