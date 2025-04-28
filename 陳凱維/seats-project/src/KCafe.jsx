import React, { useState, useEffect } from 'react';
import './KCafe.css';

const initialSeatPositions = [
  { id: 1, left: 32.4, top: 9.0 },
  { id: 2, left: 42.8, top: 9.0 },
  { id: 3, left: 53.2, top: 9.0 },
  { id: 4, left: 63.6, top: 9.0 },
  { id: 5, left: 32.4, top: 17.3 },
  { id: 6, left: 42.8, top: 17.3 },
  { id: 7, left: 53.2, top: 17.3 },
  { id: 8, left: 63.6, top: 17.3 },
  { id: 9, left: 32.4, top: 26.3 },
  { id: 10, left: 42.8, top: 26.3 },
  { id: 11, left: 53.2, top: 26.3 },
  { id: 12, left: 63.6, top: 26.3 },
  { id: 13, left: 32.4, top: 34.6 },
  { id: 14, left: 42.8, top: 34.6 },
  { id: 15, left: 53.2, top: 34.6 },
  { id: 16, left: 63.6, top: 34.6 },
  { id: 17, left: 34.0, top: 75.5 },
  { id: 18, left: 48.0, top: 75.5 },
  { id: 19, left: 72.0, top: 75.5 },
  { id: 20, left: 86.0, top: 75.5 },
  { id: 21, left: 9.0, top: 11.0 },
  { id: 22, left: 17.3, top: 11.7 },
  { id: 23, left: 9.0, top: 20.0 },
  { id: 24, left: 17.0, top: 20.3 },
  { id: 25, left: 9.0, top: 34.8 },
  { id: 26, left: 17.0, top: 35.6 },
  { id: 27, left: 9.0, top: 43.8 },
  { id: 28, left: 17.0, top: 43.8 },
  { id: 29, left: 8.8, top: 59.7 },
  { id: 30, left: 17.0, top: 60.0 },
  { id: 31, left: 8.8, top: 67.7 },
  { id: 32, left: 16.3, top: 67.8 },
];

const KCafe = () => {
  const [seats, setSeats] = useState(Array(32).fill(false));
  const [positions, setPositions] = useState(initialSeatPositions);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState('business'); // 'business', 'edit', 'view'
  const [pendingSeat, setPendingSeat] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSeat = (index, e) => {
    if (mode !== 'business' || pendingSeat || deleteMode) return;
    e.stopPropagation();
    const updatedSeats = [...seats];
    updatedSeats[index] = !updatedSeats[index];
    setSeats(updatedSeats);
  };

  const handleMouseDown = (index, e) => {
    if (mode !== 'edit') return;
    e.preventDefault();

    if (pendingSeat !== null) {
      setDragging('pending');
    } else if (deleteMode) {
      setSelectedToDelete(index);
    } else {
      setDragging(index);
    }

    const rect = e.target.getBoundingClientRect();
    setOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseMove = (e) => {
    if (dragging !== null && mode === 'edit') {
      const container = document.querySelector('.background');
      const containerRect = container.getBoundingClientRect();
      const leftPercent = ((e.clientX - containerRect.left - offset.x) / containerRect.width) * 100;
      const topPercent = ((e.clientY - containerRect.top - offset.y) / containerRect.height) * 100;

      if (dragging === 'pending') {
        setPendingSeat({
          ...pendingSeat,
          left: Math.max(0, Math.min(100, leftPercent)),
          top: Math.max(0, Math.min(100, topPercent)),
        });
      } else {
        const newPositions = [...positions];
        newPositions[dragging] = {
          ...newPositions[dragging],
          left: Math.max(0, Math.min(100, leftPercent)),
          top: Math.max(0, Math.min(100, topPercent)),
        };
        setPositions(newPositions);
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const addSeat = () => {
    if (pendingSeat !== null || deleteMode) return;
    const newId = positions.length + 1;
    setPendingSeat({ id: newId, left: 50, top: 50 });
  };

  const confirmSeat = () => {
    if (!pendingSeat) return;
    const newPositions = [...positions, pendingSeat];
    const newSeats = [...seats, false];
    setPositions(newPositions);
    setSeats(newSeats);
    setPendingSeat(null);
  };

  const checkOverlap = () => {
    if (!pendingSeat) return true;
    const threshold = 5;
    return positions.every(pos => {
      const dx = pos.left - pendingSeat.left;
      const dy = pos.top - pendingSeat.top;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance > threshold;
    });
  };

  const startDeleteMode = () => {
    if (pendingSeat !== null) return;
    setDeleteMode(true);
    setSelectedToDelete(null);
  };

  const confirmDelete = () => {
    if (selectedToDelete === null) return;
    const newPositions = positions.filter((_, idx) => idx !== selectedToDelete);
    const newSeats = seats.filter((_, idx) => idx !== selectedToDelete);
    setPositions(newPositions);
    setSeats(newSeats);
    setDeleteMode(false);
    setSelectedToDelete(null);
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setSelectedToDelete(null);
  };

  return (
    <div className="kcafe-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <nav className="navbar">
        <span>目前模式：{mode === 'business' ? '營業模式' : mode === 'edit' ? '編輯模式' : '觀察模式'}</span>
        <button onClick={() => setMode('business')}>營業模式</button>
        <button onClick={() => setMode('edit')}>編輯模式</button>
        <button onClick={() => setMode('view')}>觀察模式</button>
        {mode === 'edit' && (
          <>
            <button onClick={addSeat} disabled={pendingSeat !== null || deleteMode}>新增座位</button>
            {pendingSeat && (
              <button onClick={confirmSeat} disabled={!checkOverlap()}>
                確認新增
              </button>
            )}
            <button onClick={startDeleteMode} disabled={pendingSeat !== null || deleteMode}>刪除座位</button>
            {deleteMode && (
              <>
                <button onClick={confirmDelete} disabled={selectedToDelete === null}>確認刪除</button>
                <button onClick={cancelDeleteMode}>取消刪除</button>
              </>
            )}
          </>
        )}
      </nav>

      <h1>Welcome to KCafe!</h1>
      <h2>
        現在時間：{currentTime.toLocaleString()}　
        目前剩餘座位：<span className="remaining">{seats.filter(seat => !seat).length}</span>/{seats.length}
      </h2>
      <div className="background">
        <img src="/img/KCafe.jpg" alt="KCafe Background" className="bg-image" />
        {positions.map((seat, index) => (
          <img
            key={seat.id}
            src={seats[index] ? '/img/r_circle.png' : '/img/g_circle.png'}
            alt={`Seat ${seat.id}`}
            title={`Seat ${seat.id}`}
            className={`seat ${seats[index] ? 'occupied' : ''} ${deleteMode && selectedToDelete === index ? 'selected-delete' : ''}`}
            style={{
              left: `${seat.left}%`,
              top: `${seat.top}%`,
              cursor: (mode === 'edit' && !pendingSeat && !deleteMode) ? 'grab' : 'default',
            }}
            onClick={(e) => toggleSeat(index, e)}
            onMouseDown={(e) => handleMouseDown(index, e)}
          />
        ))}
        {pendingSeat && (
          <img
            src='/img/g_circle.png'
            alt="New Seat"
            className="seat pending"
            style={{
              left: `${pendingSeat.left}%`,
              top: `${pendingSeat.top}%`,
            }}
            onMouseDown={(e) => handleMouseDown('pending', e)}
          />
        )}
      </div>
    </div>
  );
};

export default KCafe;
