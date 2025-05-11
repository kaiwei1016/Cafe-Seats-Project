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

// 初始座位配置（只保留前 4 個示範）
const initialSeatPositions = [
];

const KCafe = ({ hideMenu = false }) => {
  // 座位佔用狀態
  const [seats, setSeats] = useState(() => {
    const saved = localStorage.getItem('kcafe_seats');
    return saved ? JSON.parse(saved) : Array(initialSeatPositions.length).fill(false);
  });
  const [positions] = useState(initialSeatPositions);

  // 桌子狀態
  const [tables, setTables] = useState(initialTables);
  const [pendingTable, setPendingTable] = useState(null);

    // 控制「新增桌子」表單的開關
    const [showAddForm, setShowAddForm] = useState(false);
    // 暫存表單輸入值：桌號、容量、描述
    const [newTableInput, setNewTableInput] = useState({
      id: '',
      capacity: 4,
      description: ''
    });
  
  // 刪除桌子模式
const [deleteTableMode, setDeleteTableMode] = useState(false);
const [selectedToDeleteTable, setSelectedToDeleteTable] = useState(null);

  // ——— 移動桌子模式 ———
  const [moveTableMode, setMoveTableMode] = useState(false);
  const [selectedToMoveTable, setSelectedToMoveTable] = useState(null);
  const [backupTables, setBackupTables] = useState(null);


  // 拖曳桌子
  const [draggingTable, setDraggingTable] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // 時間、模式、菜單
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState('business');
  const [menuOpen, setMenuOpen] = useState(false);

  // 時間更新
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 顧客模式自動刷新
  useEffect(() => {
    if (hideMenu) {
      setMode('view');
      const r = setInterval(() => window.location.reload(), 5000);
      return () => clearInterval(r);
    }
  }, [hideMenu]);

  // 存 localStorage
  useEffect(() => {
    localStorage.setItem('kcafe_seats', JSON.stringify(seats));
  }, [seats]);

  // 計算桌子總人數
  const totalCapacity = tables.reduce((sum, t) => sum + t.capacity, 0);
  const totalOccupied = tables.reduce((sum, t) => sum + t.occupied, 0);

  // 切換座位佔用
  const toggleSeat = (idx, e) => {
    if (mode !== 'business') return;
    e.stopPropagation();
    const s = [...seats];
    s[idx] = !s[idx];
    setSeats(s);
  };

// start drag
const handleTableMouseDown = (index, e) => {
  if (mode !== 'edit') return;

  // 只有 pendingTable 模式 或 移動桌子模式 才能開始 drag
  const isPending = pendingTable && pendingTable.index === index;
  if (!isPending && !moveTableMode) return;

  e.preventDefault();
  const rect = e.target.getBoundingClientRect();
  setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  setDraggingTable(index);
  if (moveTableMode && !isPending) {
    setSelectedToMoveTable(index);
  }
};


// during drag
const handleTableMouseMove = e => {
  if (draggingTable == null || mode !== 'edit') return;

  const bg = document.querySelector('.background').getBoundingClientRect();
  const leftPct = ((e.clientX - bg.left - offset.x) / bg.width) * 100;
  const topPct  = ((e.clientY - bg.top  - offset.y) / bg.height)* 100;

      // 只有在「移動桌子模式」或「正在拖曳 pendingTable」時才更新位置
      const isPending = pendingTable && draggingTable === pendingTable.index;
      if (!isPending && !moveTableMode) return;

  if (pendingTable && draggingTable === pendingTable.index) {
    setPendingTable({
      ...pendingTable,
      left: Math.max(0, Math.min(100, leftPct)),
      top:  Math.max(0, Math.min(100, topPct))
    });
  } else {
    setTables(tables.map(t =>
      t.index === draggingTable
        ? { ...t, left: leftPct, top: topPct }
        : t
    ));
  }
};

// end drag
const handleTableMouseUp = () => setDraggingTable(null);


  // 更新桌子佔用人數
  const updateTableOccupied = (tableIndex, delta) => {
    setTables(tables.map(t =>
      t.index !== tableIndex
        ? t
        : { ...t,
            occupied: Math.max(0, Math.min(t.capacity, t.occupied + delta))
          }
    ));
  };

// 取得尚未使用的 index
const getNextTableIndex = () => {
  const used = tables.map(t => t.index);
  let idx = 1;
  while (used.includes(idx)) idx++;
  return idx;
};

  // 1) 按下新增桌子：不再直接 setPendingTable，而是打開表單
  const openAddForm = () => {
    if (mode !== 'edit' || deleteTableMode || moveTableMode || pendingTable) return;
    setShowAddForm(true);
    setMenuOpen(false);
    // 重置輸入預設
    setNewTableInput({ id: '', capacity: 4, description: '' });
  };

  // 2) 取消：關閉表單
  const cancelAddForm = () => {
    setShowAddForm(false);
  };

  // 3) 確認：根據輸入值建立 pendingTable
  const submitAddForm = () => {
    const index = getNextTableIndex();
    // 如果使用者沒填 id，就自動取 A,B,C
    const id = newTableInput.id.trim() || String.fromCharCode(65 + ((index - 1) % 26));
    setPendingTable({
      index,
      id,
      left:     50,
      top:      50,
      capacity: newTableInput.capacity,
      occupied: 0,
      description: newTableInput.description.trim()
    });
    setShowAddForm(false);
  };

// 2) 按「取消新增」清掉 pendingTable
const cancelAddTable = () => {
  setPendingTable(null);
};

// 3) 按「確認新增」正式把 pendingTable 加進 tables
const confirmAddTable = () => {
  if (!pendingTable) return;
  setTables([...tables, pendingTable]);
  setPendingTable(null);
};

  // 進入刪除桌子模式，並清空先前選擇
const startDeleteTableMode = () => {
  if (mode !== 'edit') return;
  setDeleteTableMode(true);
  setSelectedToDeleteTable(null);
};

// 確認刪除：真的把該桌從列表移除
const confirmDeleteTable = () => {
  if (selectedToDeleteTable == null) return;
  setTables(tables.filter(t => t.index !== selectedToDeleteTable));
  setDeleteTableMode(false);
  setSelectedToDeleteTable(null);
};

// 取消刪除，回到一般編輯模式
const cancelDeleteTableMode = () => {
  setDeleteTableMode(false);
  setSelectedToDeleteTable(null);
};

// 進入「移動桌子模式」時備份一次
const startMoveTableMode = () => {
  if (mode !== 'edit') return;
  setMoveTableMode(true);
  setSelectedToMoveTable(null);
  setBackupTables(tables.map(t => ({ ...t }))); // <- 只在這裡做一次完整備份
};


  // 確認移動：所有 tables 已經在線上拖曳過，這裡只要關掉模式
  const confirmMoveTable = () => {
    setMoveTableMode(false);
    setSelectedToMoveTable(null);
    setBackupTables(null);
  };

  // 取消移動：從備份還原
  const cancelMoveTableMode = () => {
    setTables(backupTables);    // <- 把整份備份一次還原
    setMoveTableMode(false);
    setSelectedToMoveTable(null);
    setBackupTables(null);
  };
  
  // 在檔案最上方 import 後，加：
const [showEditForm, setShowEditForm] = useState(false);
const [editTableInput, setEditTableInput] = useState({
  index: null,      // 正在編輯的那張桌子的 index
  id: '',           // 編輯後的桌號
  capacity: 4,      // 編輯後的上限人數
  description: ''   // 編輯後的描述
});

// 打開表單：把該桌資料填入 editTableInput
const openEditForm = tableIndex => {
  const t = tables.find(t => t.index === tableIndex);
  if (!t) return;
  setEditTableInput({
    index:      t.index,
    id:         t.id,
    capacity:   t.capacity,
    description:t.description
  });
  setShowEditForm(true);
};

// 取消：關閉表單
const cancelEditForm = () => {
  setShowEditForm(false);
};

// 儲存：把修改寫回 tables
const saveEditForm = () => {
  setTables(tables.map(t =>
    t.index !== editTableInput.index
      ? t
      : {
          ...t,
          id:          editTableInput.id.trim() || t.id,
          capacity:    editTableInput.capacity,
          description: editTableInput.description.trim()
        }
  ));
  setShowEditForm(false);
};

  return (
    <div
      className="kcafe-container"
      onMouseMove={e => handleTableMouseMove(e)}
      onMouseUp={() => handleTableMouseUp()}
    >
      {!hideMenu && (
        <Navbar
          mode={mode}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          setMode={setMode}
          positions={positions}
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
          tables={tables} 
        />
      )}

      {/* 新增桌子表單 Modal */}
{showAddForm && (
  <div className="modal-backdrop">
    <div className="modal">
      <h3>新增桌子 {getNextTableIndex()}</h3>
      <label>
        桌號 (ID):
        <input
          type="text"
          value={newTableInput.id}
          onChange={e => setNewTableInput(v => ({ ...v, id: e.target.value }))}
          placeholder="留空則自動編號"
        />
      </label>
      <label>
        上限人數 (Capacity):
        <input
          type="number"
          min={1}
          value={newTableInput.capacity}
          onChange={e => setNewTableInput(v => ({ ...v, capacity: +e.target.value }))}
        />
      </label>
      <label>
        描述 (Description):
        <input
          type="text"
          value={newTableInput.description}
          onChange={e => setNewTableInput(v => ({ ...v, description: e.target.value }))}
          placeholder="選填"
        />
      </label>
      <div className="modal-actions">
        <button onClick={submitAddForm}>新增</button>
        <button onClick={cancelAddForm}>取消</button>
      </div>
    </div>
  </div>
)}

{showEditForm && (
  <div className="modal-backdrop">
    <div className="modal">
      <h3>編輯桌子 {editTableInput.index}</h3>
      
      <label>
        桌號 (ID):
        <input
          type="text"
          value={editTableInput.id}
          onChange={e => setEditTableInput(v => ({ ...v, id: e.target.value }))}
          placeholder="留空則保留原編號"
        />
      </label>
      
      <label>
        上限人數 (Capacity):
        <input
          type="number"
          min={1}
          value={editTableInput.capacity}
          onChange={e => setEditTableInput(v => ({ ...v, capacity: +e.target.value }))}
        />
      </label>
      
      <label>
        描述 (Description):
        <input
          type="text"
          value={editTableInput.description}
          onChange={e => setEditTableInput(v => ({ ...v, description: e.target.value }))}
          placeholder="選填"
        />
      </label>
      
      <div className="modal-actions">
        <button onClick={saveEditForm}>儲存</button>
        <button onClick={cancelEditForm}>取消</button>
      </div>
    </div>
  </div>
)}

    <h1>Welcome to KCafe!</h1>
      <h2>
        現在時間：{currentTime.toLocaleString()}<br/>
        目前桌子使用：<span className="remaining">{totalOccupied}</span>/{totalCapacity}
      </h2>


      <Background
        positions={positions}
        seats={seats}
        tables={tables}
        mode={mode}
        toggleSeat={toggleSeat}
        handleTableMouseDown={handleTableMouseDown}
        updateTableOccupied={updateTableOccupied}
        deleteTableMode={deleteTableMode}
        selectedToDeleteTable={selectedToDeleteTable}
        onSelectDeleteTable={setSelectedToDeleteTable}
        pendingTable={pendingTable}
        onEditTable={openEditForm}
        moveTableMode={moveTableMode}
        selectedToMoveTable={selectedToMoveTable}
      />
    </div>
  );
};

export default KCafe;
