// src/components/Table.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../styles/Table.css';


const Table = ({
  tableId,
  name,
  left,
  top,
  capacity,
  occupied,
  width = 1,
  height = 1,
  extraSeatLimit = 0,
  updateTime,
  tags = [],
  mode,
  unitX = 4, 
  unitY = 6.25,
  hideGridLines = false,
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

  // Derived flags
  const maxOccupancy = capacity + extraSeatLimit;
  const isFull       = occupied >= maxOccupancy;
  const isPartial    = occupied > 0 && occupied < maxOccupancy;
  const isMoving     = moveTableMode && selectedToMoveTable === tableId;
  const isDeleting   = deleteTableMode && selectedToDeleteTable === tableId;

  // Format ISO timestamp to “X 分鐘前 / 小時前 / 天前”
  const formatRelative = iso => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000)     return '1分鐘';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}分鐘`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小時`;
    return `${Math.floor(diff / 86_400_000)}天`;
  };

  // Toggle business‐mode +/- controls
  const handleClick = e => {
    e.stopPropagation();
    if (deleteTableMode) {
      onSelectDeleteTable();
    } else if (mode === 'business') {
      setShowControls(v => !v);
    } else if (mode === 'edit' && !deleteTableMode && !moveTableMode) {
      onEdit();
    }
  };

  // Close controls when clicking outside
  useEffect(() => {
    const onOutside = e => {
      if (
        showControls &&
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setShowControls(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showControls]);

  // Inline styles for positioning & sizing
  const containerStyle = {
    left:   `${left}%`,
    top:    `${top}%`,
    width:  `${width  * unitX}%`,
    height: `${height * unitY}%`,
  };

  const tableStyle = {
    width:  '100%',
    height: '100%'
  };

  // Render grid‐lines inside the table
  const gridLines = () => (
    <>
      {Array.from({ length: width - 1 }).map((_, i) => (
        <div
          key={`v${i}`}
          className="grid-line vertical"
          style={{ left: `${((i+1) / width) * 100}%` }}
        />
      ))}
      {Array.from({ length: height - 1 }).map((_, i) => (
        <div
          key={`h${i}`}
          className="grid-line horizontal"
          style={{ top: `${((i+1) / height) * 100}%` }}
        />
      ))}
    </>
  );

  return (
    <div
      ref={containerRef}
      className={`
        table-container
        ${isDeleting ? 'selected-delete' : ''}
        ${isMoving   ? 'selected-move'   : ''}
      `}
      style={containerStyle}
      onClick={handleClick}
      onMouseDown={onMouseDown}
    >
      <div
        className={`table ${isFull ? 'full' : ''} ${isPartial ? 'partial' : ''}`}
        style={tableStyle}
      >
        <div className="table-id">{name}</div>
        <div className="table-info">
          {occupied}/{capacity}
          {extraSeatLimit > 0 && <span className="extra">(+{extraSeatLimit})</span>}
          {updateTime && (
            <div className="last-updated">
              約{formatRelative(updateTime)}前
            </div>
          )}
        </div>

        <div className="table-tags">
          {tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>

        {!hideGridLines && gridLines()}
      </div>

      {mode === 'business' && showControls && !deleteTableMode && (
        <div className="table-controls">
          <button
            onClick={e => { e.stopPropagation(); updateOccupied(-1); }}
            disabled={occupied <= 0}
          >－</button>
          <button
            onClick={e => { e.stopPropagation(); updateOccupied(+1); }}
            disabled={occupied >= maxOccupancy}
          >＋</button>
        </div>
      )}

      {mode === 'edit' && !deleteTableMode && !moveTableMode && (
        <button
          className="edit-table-button"
          onClick={e => { e.stopPropagation(); onEdit(); }}
        >編輯</button>
      )}
    </div>
  );
};

export default Table;