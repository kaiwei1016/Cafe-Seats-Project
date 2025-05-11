import React, { useState } from 'react';
import './KCafe.css';

const Table = ({ id, left, top, capacity, occupied, mode, updateOccupied, onMouseDown }) => {
  // 只有營業模式時，才顯示 +/- 按鈕
  const [showControls, setShowControls] = useState(false);
  const isFull = occupied >= capacity;

  // 當前模式下點一下桌子
  const handleClick = () => {
    if (mode === 'business') {
      setShowControls(!showControls);
    }
  };

  return (
    <div
      className="table-container"
      style={{ left: `${left}%`, top: `${top}%` }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
    >
      <div className={`table ${isFull ? 'full' : ''}`}>
        <div className="table-id">{id}</div>
        <div className="table-info">{occupied}/{capacity}</div>
      </div>

      {/* 營業模式才顯示 控制按鈕 */}
      {mode === 'business' && showControls && (
        <div className="table-controls">
          <button
            onClick={e => { e.stopPropagation(); updateOccupied(id, -1); }}
            disabled={occupied <= 0}
          >
            –  
          </button>
          <button
            onClick={e => { e.stopPropagation(); updateOccupied(id, +1); }}
            disabled={occupied >= capacity}
          >
            +  
          </button>
        </div>
      )}
    </div>
  );
};

export default Table;
