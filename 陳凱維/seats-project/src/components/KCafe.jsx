import React, { useState, useEffect } from 'react';
import Background from './Background';
import Navbar from './Navbar';
import './KCafe.css';

// 初始座位配置
// ★ 新增：三張桌子的初始資料
const initialTables = [
  { id: 'A', left: 20, top: 20, capacity: 4, occupied: 2 },
  { id: 'B', left: 50, top: 50, capacity: 6, occupied: 0 },
  { id: 'C', left: 80, top: 30, capacity: 2, occupied: 1 },
];

const initialSeatPositions = [
  { id: 1, left: 32.4, top: 9.0 }, { id: 2, left: 42.8, top: 9.0 }, { id: 3, left: 53.2, top: 9.0 }, { id: 4, left: 63.6, top: 9.0 },

];

const KCafe = ({ hideMenu = false }) => {
  // 狀態管理
  const [seats, setSeats] = useState(() => {
    const savedSeats = localStorage.getItem('kcafe_seats');
    return savedSeats ? JSON.parse(savedSeats) : Array(initialSeatPositions.length).fill(false);
  });

  const [positions, setPositions] = useState(() => {
    const savedPositions = localStorage.getItem('kcafe_positions');
    return savedPositions ? JSON.parse(savedPositions) : initialSeatPositions;
  });

  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState('business');
  const [menuOpen, setMenuOpen] = useState(false);

  // 操作狀態
  const [tables, setTables] = useState(initialTables);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pendingSeat, setPendingSeat] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState(null);
  const [selectedToMove, setSelectedToMove] = useState(null);
  const [tempMovePosition, setTempMovePosition] = useState(null);

  // 時間顯示
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 顧客觀察模式自動刷新
  useEffect(() => {
    if (hideMenu) {
      setMode('view');
      const refresh = setInterval(() => {
        window.location.reload();
      }, 5000);
      return () => clearInterval(refresh);
    }
  }, [hideMenu]);

  // 本地儲存同步
  useEffect(() => {
    localStorage.setItem('kcafe_seats', JSON.stringify(seats));
  }, [seats]);

  useEffect(() => {
    localStorage.setItem('kcafe_seats', JSON.stringify(seats));
    localStorage.setItem('kcafe_positions', JSON.stringify(positions));
  }, [seats, positions]);

  // ------------------------- 功能邏輯區 ------------------------- //

  // 更新某張桌子的佔用人數：delta 可以是 +1 或 -1
  const updateTableOccupied = (id, delta) => {
    setTables(tables.map(tbl => {
      if (tbl.id !== id) return tbl;
      const newOcc = Math.max(0, Math.min(tbl.capacity, tbl.occupied + delta));
      return { ...tbl, occupied: newOcc };
    }));
  };

  const [draggingTable, setDraggingTable] = useState(null);
  

   // 開始按下桌子
   const handleTableMouseDown = (id, e) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    // 跟座位拿 offset
    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setDraggingTable(id);
  };

    // 拖曳中
    const handleTableMouseMove = (e) => {
      if (!draggingTable || mode !== 'edit') return;
      const bg = document.querySelector('.background').getBoundingClientRect();
      const leftPct = ((e.clientX - bg.left - offset.x) / bg.width) * 100;
      const topPct  = ((e.clientY - bg.top  - offset.y) / bg.height)* 100;
      setTables(tables.map(tbl =>
        tbl.id === draggingTable
          ? { ...tbl,
              left: Math.max(0, Math.min(100, leftPct)),
              top:  Math.max(0, Math.min(100, topPct))
            }
          : tbl
      ));
    };

      // 拖曳放開
  const handleTableMouseUp = () => {
    setDraggingTable(null);
  };

  // 座位切換
  const toggleSeat = (index, e) => {
    if (mode !== 'business' || pendingSeat || deleteMode || moveMode) return;
    e.stopPropagation();
    const updatedSeats = [...seats];
    updatedSeats[index] = !updatedSeats[index];
    setSeats(updatedSeats);
  };

  // 滑鼠操作（拖曳座位）
  const handleMouseDown = (index, e) => {
    if (mode !== 'edit') return;
    e.preventDefault();
    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (pendingSeat !== null) setDragging('pending');
    else if (deleteMode) setSelectedToDelete(index);
    else if (moveMode) {
      setSelectedToMove(index);
      setDragging(index);
    }
  };

  const handleMouseMove = (e) => {
    if (dragging !== null && mode === 'edit') {
      const container = document.querySelector('.background');
      const containerRect = container.getBoundingClientRect();
      const leftPercent = ((e.clientX - containerRect.left - offset.x) / containerRect.width) * 100;
      const topPercent = ((e.clientY - containerRect.top - offset.y) / containerRect.height) * 100;

      if (dragging === 'pending') {
        setPendingSeat({ ...pendingSeat, left: Math.max(0, Math.min(100, leftPercent)), top: Math.max(0, Math.min(100, topPercent)) });
      } else if (moveMode && dragging === selectedToMove) {
        setTempMovePosition({ left: Math.max(0, Math.min(100, leftPercent)), top: Math.max(0, Math.min(100, topPercent)) });
      }
    }
  };

  const handleMouseUp = () => setDragging(null);

  // 新增座位
  const addSeat = () => {
    if (pendingSeat || deleteMode || moveMode) return;
    setMenuOpen(false);
    const newId = positions.length > 0 ? Math.max(...positions.map(p => p.id)) + 1 : 1;
    setPendingSeat({ id: newId, left: 50, top: 50 });
  };

  const cancelAddSeat = () => setPendingSeat(null);

  const confirmSeat = () => {
    if (!pendingSeat) return;
    setPositions([...positions, pendingSeat]);
    setSeats([...seats, false]);
    setPendingSeat(null);
  };

  const checkOverlap = () => {
    if (!pendingSeat) return true;
    const threshold = 5;
    return positions.every(pos => {
      const dx = pos.left - pendingSeat.left;
      const dy = pos.top - pendingSeat.top;
      return Math.sqrt(dx * dx + dy * dy) > threshold;
    });
  };

  // 刪除座位
  const startDeleteMode = () => {
    if (pendingSeat || moveMode) return;
    setMenuOpen(false);
    setDeleteMode(true);
    setSelectedToDelete(null);
  };

  const confirmDelete = () => {
    if (selectedToDelete === null) return;
    setPositions(positions.filter((_, idx) => idx !== selectedToDelete));
    setSeats(seats.filter((_, idx) => idx !== selectedToDelete));
    setDeleteMode(false);
    setSelectedToDelete(null);
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedToDelete(null);
  };

  // 移動座位
  const startMoveMode = () => {
    if (pendingSeat || deleteMode) return;
    setMenuOpen(false);
    setMoveMode(true);
    setSelectedToMove(null);
    setTempMovePosition(null);
  };

  const confirmMove = () => {
    if (selectedToMove === null || !tempMovePosition) return;
    const newPositions = [...positions];
    newPositions[selectedToMove] = { ...newPositions[selectedToMove], ...tempMovePosition };
    setPositions(newPositions);
    setMoveMode(false);
    setSelectedToMove(null);
    setTempMovePosition(null);
  };

  const cancelMoveMode = () => {
    setMoveMode(false);
    setSelectedToMove(null);
    setTempMovePosition(null);
  };

  const checkMoveOverlap = () => {
    if (selectedToMove === null || !tempMovePosition) return true;
    const threshold = 5;
    return positions.every((pos, idx) => {
      if (idx === selectedToMove) return true;
      const dx = pos.left - tempMovePosition.left;
      const dy = pos.top - tempMovePosition.top;
      return Math.sqrt(dx * dx + dy * dy) > threshold;
    });
  };

  // ------------------------- 主介面 ------------------------- //

  return (
    <div className="kcafe-container" 
    onMouseMove={e => {
      handleMouseMove(e);
      handleTableMouseMove(e);
    }}
    onMouseUp={() => {
      handleMouseUp();
      handleTableMouseUp();
    }}>
      {!hideMenu && (
        <Navbar
          mode={mode}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          setMode={setMode}
          addSeat={addSeat}
          pendingSeat={pendingSeat}
          deleteMode={deleteMode}
          moveMode={moveMode}
          startDeleteMode={startDeleteMode}
          confirmDelete={confirmDelete}
          cancelDeleteMode={cancelDeleteMode}
          startMoveMode={startMoveMode}
          confirmMove={confirmMove}
          cancelMoveMode={cancelMoveMode}
          selectedToDelete={selectedToDelete}
          selectedToMove={selectedToMove}
          tempMovePosition={tempMovePosition}
          confirmSeat={confirmSeat}
          cancelAddSeat={cancelAddSeat}
          checkOverlap={checkOverlap}
          checkMoveOverlap={checkMoveOverlap}
          positions={positions}
        />
      )}

      <h1>Welcome to KCafe!</h1>
      <h2>
        現在時間：{currentTime.toLocaleString()}<br />
        目前剩餘座位：<span className="remaining">{seats.filter(seat => !seat).length}</span>/{seats.length}
      </h2>

      <Background
        positions={positions}
        seats={seats}
        tables={tables}                              // 傳入桌子資料
        updateTableOccupied={updateTableOccupied}    // 傳入更新函式
        pendingSeat={pendingSeat}
        tempMovePosition={tempMovePosition}
        selectedToDelete={selectedToDelete}
        selectedToMove={selectedToMove}
        moveMode={moveMode}
        deleteMode={deleteMode}
        mode={mode}
        toggleSeat={toggleSeat}
        handleMouseDown={handleMouseDown}
        handleTableMouseDown={handleTableMouseDown}
      />
    </div>
  );
};

export default KCafe;