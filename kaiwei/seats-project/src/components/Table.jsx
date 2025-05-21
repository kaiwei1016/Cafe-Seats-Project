import React, { useState, useRef, useEffect } from 'react';
import './KCafe.css';

const Table = ({
  tableIndex,
  id,
  left,
  top,
  capacity,
  occupied,
  width = 1,
  height = 1,
  mode,
  updateOccupied,
  onEdit,
  deleteTableMode,
  selectedToDeleteTable,
  onSelectDeleteTable,
  moveTableMode,
  selectedToMoveTable,
  onMouseDown
}) => {
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef(null);

  const isFull    = occupied >= capacity;
  const isPartial = occupied > 0 && occupied < capacity;
  const isMoving  = moveTableMode && selectedToMoveTable === tableIndex;
  const isDeleting= deleteTableMode && selectedToDeleteTable === tableIndex;
  const sizeW     = width * 7;   // 單位 vmin
  const sizeH     = height * 7;

  const handleClick = e => {
    e.stopPropagation();
    if (deleteTableMode) {
      onSelectDeleteTable();
    } else if (mode === 'business') {
      setShowControls(v => !v);
    }
    if (mode === 'edit' && !deleteTableMode && !moveTableMode) {
      onEdit();
    }
  };

  useEffect(() => {
    const handleOutside = e => {
      if (showControls && containerRef.current && !containerRef.current.contains(e.target)) {
        setShowControls(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showControls]);

  return (
    <div
      ref={containerRef}
      className={`table-container ${isDeleting? 'selected-delete':''} ${isMoving? 'selected-move':''}`}
      style={{ left:`${left}%`, top:`${top}%` }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
    >
      <div
        className={`table ${isFull? 'full':''} ${isPartial? 'partial':''}`}
        style={{ width:`${sizeW}vmin`, height:`${sizeH}vmin` }}
      >
        <div className="table-id">{id}</div>
        <div className="table-info">{occupied}/{capacity}</div>

        {/* 動態渲染虛線格 */}
        {Array.from({ length: width - 1 }).map((_, i) => (
          <div
            key={`v${i}`}
            className="grid-line vertical"
            style={{ left: `${(i+1)*7}vmin` }}
          />
        ))}
        {Array.from({ length: height - 1 }).map((_, i) => (
          <div
            key={`h${i}`}
            className="grid-line horizontal"
            style={{ top: `${(i+1)*7}vmin` }}
          />
        ))}
      </div>

      {mode === 'business' && showControls && !deleteTableMode && (
        <div className="table-controls">
          <button onClick={e=>{ e.stopPropagation(); updateOccupied(-1); }} disabled={occupied<=0}>–</button>
          <button onClick={e=>{ e.stopPropagation(); updateOccupied(+1); }} disabled={occupied>=capacity}>＋</button>
        </div>
      )}

      {mode === 'edit' && !deleteTableMode && !moveTableMode && (
        <button className="edit-table-button" onClick={e=>{ e.stopPropagation(); onEdit(); }}>
          編輯
        </button>
      )}
    </div>
  );
};

export default Table;
