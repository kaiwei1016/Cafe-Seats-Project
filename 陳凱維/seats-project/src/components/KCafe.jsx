import React, { useState, useEffect } from 'react';
import Background from './Background';
import Navbar from './Navbar';
import './KCafe.css';

// 初始桌子資料
const initialTables = [
  { index: 1, id: 'A', left: 20, top: 20, capacity: 4, occupied: 2, description: '' },
  { index: 2, id: 'B', left: 50, top: 50, capacity: 6, occupied: 0, description: '' },
  { index: 3, id: 'C', left: 80, top: 30, capacity: 2, occupied: 1, description: '' },
];

const KCafe = ({ hideMenu = false }) => {
  // --------- 桌子狀態 & Storage 還原 ---------
  const [tables, setTables] = useState(() => {
    const restored = [];
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('kcafe_table_')) {
        try {
          restored.push(JSON.parse(localStorage.getItem(key)));
        } catch {}
      }
    });
    return restored.length ? restored : initialTables;
  });
  // 任何 tables 變動時，同步存入 localStorage
  useEffect(() => {
    tables.forEach(t => {
      localStorage.setItem(`kcafe_table_${t.index}`, JSON.stringify(t));
    });
  }, [tables]);

  // 暫存新增/編輯的桌子資料
  const [pendingTable, setPendingTable] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTableInput, setNewTableInput] = useState({ id: '', capacity: 4, description: '' });
  const [showEditForm, setShowEditForm] = useState(false);
  const [editTableInput, setEditTableInput] = useState({ index: null, id: '', capacity: 4, description: '' });

  // 刪除 & 移動 模式
  const [deleteTableMode, setDeleteTableMode] = useState(false);
  const [selectedToDeleteTable, setSelectedToDeleteTable] = useState(null);
  const [moveTableMode, setMoveTableMode] = useState(false);
  const [selectedToMoveTable, setSelectedToMoveTable] = useState(null);
  const [backupTables, setBackupTables] = useState(null);

  // 拖曳狀態
  const [draggingTable, setDraggingTable] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // --------- 時間 & 介面模式 ---------
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState('business');  // 'business' / 'edit' / 'view'
  const [menuOpen, setMenuOpen] = useState(false);

  // 時間每秒更新
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  // 隱藏菜單時自動切到顧客版 & 刷新
  useEffect(() => {
    if (hideMenu) {
      setMode('view');
      const r = setInterval(() => window.location.reload(), 5000);
      return () => clearInterval(r);
    }
  }, [hideMenu]);

  // --------- 工具函式 ---------
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalOccupied = tables.reduce((sum, t) => sum + t.occupied, 0);
  const getNextTableIndex = () => {
    const used = tables.map(t => t.index);
    let idx = 1;
    while (used.includes(idx)) idx++;
    return idx;
  };
  const updateTableOccupied = (tableIndex, delta) => {
    setTables(tables.map(t =>
      t.index !== tableIndex
        ? t
        : { ...t, occupied: Math.max(0, Math.min(t.capacity, t.occupied + delta)) }
    ));
  };

  // --------- 拖曳事件 ---------
  const handleTableMouseDown = (idx, e) => {
    if (mode !== 'edit') return;
    const isPending = pendingTable && pendingTable.index === idx;
    if (!isPending && !moveTableMode) return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingTable(idx);
    if (moveTableMode && !isPending) setSelectedToMoveTable(idx);
  };
  const handleTableMouseMove = e => {
    if (draggingTable == null || mode !== 'edit') return;
    const bg = document.querySelector('.background').getBoundingClientRect();
    const leftPct = ((e.clientX - bg.left - offset.x) / bg.width) * 100;
    const topPct  = ((e.clientY - bg.top - offset.y) / bg.height) * 100;
    const isPend = pendingTable && draggingTable === pendingTable.index;
    if (!isPend && !moveTableMode) return;
    if (isPend) {
      setPendingTable({ ...pendingTable, left: Math.max(0, Math.min(100, leftPct)), top: Math.max(0, Math.min(100, topPct)) });
    } else {
      setTables(tables.map(t => t.index === draggingTable ? { ...t, left: leftPct, top: topPct } : t));
    }
  };
  const handleTableMouseUp = () => setDraggingTable(null);

  // --------- 新增桌子流程 ---------
  const openAddForm = () => {
    if (mode !== 'edit' || deleteTableMode || moveTableMode || pendingTable) return;
    setShowAddForm(true); setMenuOpen(false);
    setNewTableInput({ id: '', capacity: 4, description: '' });
  };
  const cancelAddForm = () => setShowAddForm(false);
  const submitAddForm = () => {
    const idx = getNextTableIndex();
    const id  = newTableInput.id.trim() || String.fromCharCode(65 + ((idx - 1) % 26));
    setPendingTable({ index: idx, id, left: 50, top: 50, capacity: newTableInput.capacity, occupied: 0, description: newTableInput.description.trim() });
    setShowAddForm(false);
  };
  const cancelAddTable = () => setPendingTable(null);
  const confirmAddTable = () => { if (!pendingTable) return; setTables([...tables, pendingTable]); setPendingTable(null); };

  // --------- 刪除桌子流程 ---------
  const startDeleteTableMode = () => { if (mode !== 'edit') return; setDeleteTableMode(true); setSelectedToDeleteTable(null); };
  const confirmDeleteTable = () => { if (selectedToDeleteTable == null) return; setTables(tables.filter(t => t.index !== selectedToDeleteTable)); setDeleteTableMode(false); setSelectedToDeleteTable(null); };
  const cancelDeleteTableMode = () => { setDeleteTableMode(false); setSelectedToDeleteTable(null); };

  // --------- 移動桌子流程 ---------
  const startMoveTableMode = () => { if (mode !== 'edit') return; setMoveTableMode(true); setSelectedToMoveTable(null); setBackupTables(tables.map(t => ({ ...t }))); };
  const confirmMoveTable = () => { setMoveTableMode(false); setSelectedToMoveTable(null); setBackupTables(null); };
  const cancelMoveTableMode = () => { setTables(backupTables); setMoveTableMode(false); setSelectedToMoveTable(null); setBackupTables(null); };

  // --------- 編輯桌子流程 ---------
  const openEditForm = idx => {
    const t = tables.find(t => t.index === idx);
    if (!t) return;
    setEditTableInput({ index: t.index, id: t.id, capacity: t.capacity, description: t.description });
    setShowEditForm(true);
  };
  const cancelEditForm = () => setShowEditForm(false);
  const saveEditForm = () => {
    setTables(tables.map(t => t.index !== editTableInput.index ? t : { ...t, id: editTableInput.id.trim() || t.id, capacity: editTableInput.capacity, description: editTableInput.description.trim() }));
    setShowEditForm(false);
  };

  return (
    <div className="kcafe-container" onMouseMove={handleTableMouseMove} onMouseUp={handleTableMouseUp}>
      {/* 導覽列 */}
      {!hideMenu && (
        <Navbar
          mode={mode} menuOpen={menuOpen} setMenuOpen={setMenuOpen} setMode={setMode}
          tables={tables}
          addTable={openAddForm} pendingTable={pendingTable} cancelAddTable={cancelAddTable} confirmAddTable={confirmAddTable}
          startDeleteTableMode={startDeleteTableMode} deleteTableMode={deleteTableMode} selectedToDeleteTable={selectedToDeleteTable} confirmDeleteTable={confirmDeleteTable} cancelDeleteTableMode={cancelDeleteTableMode}
          startMoveTableMode={startMoveTableMode} moveTableMode={moveTableMode} selectedToMoveTable={selectedToMoveTable} confirmMoveTable={confirmMoveTable} cancelMoveTableMode={cancelMoveTableMode}
        />
      )}

      {/* 新增表單 Modal */}
      {showAddForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>新增桌子 {getNextTableIndex()}</h3>
            <label>桌號 (ID):<input value={newTableInput.id} onChange={e => setNewTableInput(v => ({ ...v, id: e.target.value }))} placeholder="留空則自動編號"/></label>
            <label>上限人數:<input type="number" min={1} value={newTableInput.capacity} onChange={e => setNewTableInput(v => ({ ...v, capacity: +e.target.value }))}/></label>
            <label>描述:<input value={newTableInput.description} onChange={e => setNewTableInput(v => ({ ...v, description: e.target.value }))} placeholder="選填"/></label>
            <div className="modal-actions"><button onClick={submitAddForm}>新增</button><button onClick={cancelAddForm}>取消</button></div>
          </div>
        </div>
      )}

      {/* 編輯表單 Modal */}
      {showEditForm && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>編輯桌子 {editTableInput.index}</h3>
            <label>桌號 (ID):<input value={editTableInput.id} onChange={e => setEditTableInput(v => ({ ...v, id: e.target.value }))} placeholder="留空保留原編號"/></label>
            <label>上限人數:<input type="number" min={1} value={editTableInput.capacity} onChange={e => setEditTableInput(v => ({ ...v, capacity: +e.target.value }))}/></label>
            <label>描述:<input value={editTableInput.description} onChange={e => setEditTableInput(v => ({ ...v, description: e.target.value }))} placeholder="選填"/></label>
            <div className="modal-actions"><button onClick={saveEditForm}>儲存</button><button onClick={cancelEditForm}>取消</button></div>
          </div>
        </div>
      )}

      {/* 標題與統計 */}
      <h1>Welcome to KCafe!</h1>
      <h2>現在時間：{currentTime.toLocaleString()}<br/>目前桌子：<span className="remaining">{totalOccupied}</span>/{totalCapacity}</h2>

      {/* 背景與桌子 */}
      <Background
        tables={tables}
        pendingTable={pendingTable}
        updateTableOccupied={updateTableOccupied}
        mode={mode}
        handleTableMouseDown={handleTableMouseDown}
        deleteTableMode={deleteTableMode}
        selectedToDeleteTable={selectedToDeleteTable}
        onSelectDeleteTable={setSelectedToDeleteTable}
        onEditTable={openEditForm}
        moveTableMode={moveTableMode}
        selectedToMoveTable={selectedToMoveTable}
      />
    </div>
  );
};

export default KCafe;
