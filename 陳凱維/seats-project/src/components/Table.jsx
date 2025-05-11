import React, { useState, useRef, useEffect } from 'react';
import './KCafe.css';

const Table = ({
  tableIndex,
  id,
  left,
  top,
  capacity,
  occupied,
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
  const isDeleting = deleteTableMode && selectedToDeleteTable === tableIndex;

  // 點擊桌子本體的行為
  const handleClick = e => {
    e.stopPropagation();
    if (deleteTableMode) {
      onSelectDeleteTable();
    } else if (mode === 'business') {
      setShowControls(v => !v);
    }
       if (mode === 'edit' && !deleteTableMode && !moveTableMode) {
           onEdit();
           return;
         }
  };

  // 點擊外部時自動關閉 ± 控制
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
      className={
        `table-container
         ${isDeleting ? 'selected-delete' : ''}
         ${isMoving  ? 'selected-move'   : ''}`
        .trim().replace(/\s+/g,' ')
      }
      style={{ left: `${left}%`, top: `${top}%` }}
      onClick={handleClick}
      onMouseDown={onMouseDown}
    >
      <div
        className={
          `table
           ${isFull    ? 'full'    : ''}
           ${isPartial ? 'partial' : ''}`
          .trim().replace(/\s+/g,' ')
        }
      >
        <div className="table-id">{id}</div>
        <div className="table-info">{occupied}/{capacity}</div>
      </div>

      {mode === 'business' && showControls && !deleteTableMode && (
        <div className="table-controls">
          <button onClick={e => { e.stopPropagation(); updateOccupied(-1); }} disabled={occupied <= 0}>
            –
          </button>
          <button onClick={e => { e.stopPropagation(); updateOccupied(+1); }} disabled={occupied >= capacity}>
            ＋
          </button>
        </div>
      )}

      {mode === 'edit' && !deleteTableMode && !moveTableMode && (
        <button
          className="edit-table-button"
          onClick={e => { e.stopPropagation(); onEdit(); }}
        >
          編輯
        </button>
      )}
    </div>
  );
};

export default Table;
