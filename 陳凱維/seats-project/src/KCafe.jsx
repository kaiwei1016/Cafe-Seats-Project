import React, { useState, useEffect } from 'react';
import Seat from './Seat';
import Navbar from './Navbar';
import './KCafe.css';

const initialSeatPositions = [
  { id: 1, left: 32.4, top: 9.0 }, { id: 2, left: 42.8, top: 9.0 }, { id: 3, left: 53.2, top: 9.0 }, { id: 4, left: 63.6, top: 9.0 },
  { id: 5, left: 32.4, top: 17.3 }, { id: 6, left: 42.8, top: 17.3 }, { id: 7, left: 53.2, top: 17.3 }, { id: 8, left: 63.6, top: 17.3 },
  { id: 9, left: 32.4, top: 26.3 }, { id: 10, left: 42.8, top: 26.3 }, { id: 11, left: 53.2, top: 26.3 }, { id: 12, left: 63.6, top: 26.3 },
  { id: 13, left: 32.4, top: 34.6 }, { id: 14, left: 42.8, top: 34.6 }, { id: 15, left: 53.2, top: 34.6 }, { id: 16, left: 63.6, top: 34.6 },
  { id: 17, left: 34.0, top: 75.5 }, { id: 18, left: 48.0, top: 75.5 }, { id: 19, left: 72.0, top: 75.5 }, { id: 20, left: 86.0, top: 75.5 },
  { id: 21, left: 9.0, top: 11.0 }, { id: 22, left: 17.3, top: 11.7 }, { id: 23, left: 9.0, top: 20.0 }, { id: 24, left: 17.0, top: 20.3 },
  { id: 25, left: 9.0, top: 34.8 }, { id: 26, left: 17.0, top: 35.6 }, { id: 27, left: 9.0, top: 43.8 }, { id: 28, left: 17.0, top: 43.8 },
  { id: 29, left: 8.8, top: 59.7 }, { id: 30, left: 17.0, top: 60.0 }, { id: 31, left: 8.8, top: 67.7 }, { id: 32, left: 16.3, top: 67.8 },
];

const KCafe = () => {
  const [seats, setSeats] = useState(Array(initialSeatPositions.length).fill(false));
  const [positions, setPositions] = useState(initialSeatPositions);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mode, setMode] = useState('business'); // 'business', 'edit', 'view'
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [pendingSeat, setPendingSeat] = useState(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState(null);
  const [selectedToMove, setSelectedToMove] = useState(null);
  const [tempMovePosition, setTempMovePosition] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSeat = (index, e) => {
    if (mode !== 'business' || pendingSeat || deleteMode || moveMode) return;
    e.stopPropagation();
    const updatedSeats = [...seats];
    updatedSeats[index] = !updatedSeats[index];
    setSeats(updatedSeats);
  };

  const handleMouseDown = (index, e) => {
    if (mode !== 'edit') return;
    e.preventDefault();

    const rect = e.target.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    if (pendingSeat !== null) {
      setDragging('pending');
    } else if (deleteMode) {
      setSelectedToDelete(index);
    } else if (moveMode) {
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
        setPendingSeat({
          ...pendingSeat,
          left: Math.max(0, Math.min(100, leftPercent)),
          top: Math.max(0, Math.min(100, topPercent)),
        });
      } else if (moveMode && dragging === selectedToMove) {
        setTempMovePosition({
          left: Math.max(0, Math.min(100, leftPercent)),
          top: Math.max(0, Math.min(100, topPercent)),
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  const addSeat = () => {
    if (pendingSeat !== null || deleteMode || moveMode) return;
    const newId = positions.length + 1;
    setPendingSeat({ id: newId, left: 50, top: 50 });
  };

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

  const startDeleteMode = () => {
    if (pendingSeat !== null || moveMode) return;
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

  const startMoveMode = () => {
    if (pendingSeat !== null || deleteMode) return;
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

  return (
    <div className="kcafe-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
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
        checkOverlap={checkOverlap}
      />

      <h1>Welcome to KCafe!</h1>
      <h2>
        現在時間：{currentTime.toLocaleString()}　
        目前剩餘座位：<span className="remaining">{seats.filter(seat => !seat).length}</span>/{seats.length}
      </h2>

      <div className="background">
        <img src="/img/KCafe.jpg" alt="KCafe Background" className="bg-image" />
        {positions.map((seat, index) => (
          <Seat
            key={seat.id}
            id={seat.id}
            left={seat.left}
            top={seat.top}
            occupied={seats[index]}
            isSelectedForMove={moveMode && selectedToMove === index}
            isSelectedForDelete={deleteMode && selectedToDelete === index}
            tempMovePosition={tempMovePosition}
            moveMode={moveMode}
            mode={mode}
            pendingSeat={pendingSeat}
            deleteMode={deleteMode}
            handleToggleSeat={(e) => toggleSeat(index, e)}
            handleMouseDown={(e) => handleMouseDown(index, e)}
          />
        ))}
        {pendingSeat && (
          <img
            src="/img/g_circle.png"
            alt="New Seat"
            className="seat pending"
            style={{ left: `${pendingSeat.left}%`, top: `${pendingSeat.top}%` }}
            onMouseDown={(e) => handleMouseDown('pending', e)}
          />
        )}
      </div>
    </div>
  );
};

export default KCafe;
