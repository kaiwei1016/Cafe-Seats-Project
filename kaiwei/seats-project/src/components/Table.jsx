// src/components/Table.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../styles/Table.css';

const Table = ({
  tableId,
  name,
  index,
  seatIndexShown,
  left,
  top,

  width = 1,
  height = 1,
  unitX = 4,
  unitY = 6.25,

  capacity,
  extraSeatLimit = 0,
  occupied,
  updateTime,
  available = true,

  tags = [],

  mode,
  hideGridLines = false,

  updateOccupied,
  onEdit,

  deleteTableMode,
  selectedToDeleteList,
  onSelectDeleteTable,
  onToggleDeletePick,

  moveTableMode,
  selectedToMoveTable,
  onMouseDown
}) => {
  const [showControls, setShowControls] = useState(false);
  const containerRef = useRef(null);

  const isSeat       = !!tableId && (tableId[0] === 's' || tableId[0] === 'S');
  const maxOccupancy = capacity + extraSeatLimit;
  const isEmptyZero  = capacity === 0 && occupied === 0;
  const isFull       = !isEmptyZero && occupied >= maxOccupancy;
  const isPartial    = !isEmptyZero && occupied > 0 && occupied < maxOccupancy;
  const isMoving     = moveTableMode && selectedToMoveTable === tableId;
  const isDeleting = deleteTableMode && selectedToDeleteList.includes(tableId);

  const formatRelative = iso => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000)     return '1分鐘';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}分鐘`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}小時`;
    return `${Math.floor(diff / 86_400_000)}天`;
  };

  const handleClick = e => {
    e.stopPropagation();

    if (deleteTableMode) {
      onToggleDeletePick(tableId);   
      return;
    }

    if (mode === 'business') {
      if (!isSeat) setShowControls(v => !v);
      return;
    }

    if (mode === 'edit' && !deleteTableMode && !moveTableMode && !isSeat) {
      onEdit();
    }
  };

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
    if (showControls) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [showControls]);

  const containerStyle = {
    left:   `${left}%`,
    top:    `${top}%`,
    width:  `${width  * unitX}%`,
    height: `${height * unitY}%`
  };

  const tableStyle = {
    width: '100%',
    height: '100%'
  };

  const gridLines = () => (
    <>
      {Array.from({ length: width - 1 }).map((_, i) => (
        <div
          key={`v${i}`}
          className="grid-line vertical"
          style={{ left: `${((i + 1) / width) * 100}%` }}
        />
      ))}
      {Array.from({ length: height - 1 }).map((_, i) => (
        <div
          key={`h${i}`}
          className="grid-line horizontal"
          style={{ top: `${((i + 1) / height) * 100}%` }}
        />
      ))}
    </>
  );

  return (
    <div
      ref={containerRef}
      className={`
        table-container
        ${isSeat ? 'seat-container' : ''}
        ${isDeleting ? 'selected-delete' : ''}
        ${isMoving   ? 'selected-move'   : ''}
      `}
      style={containerStyle}
      onClick={handleClick}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    >
      <div
        className={`
          table
          ${isSeat ? 'seat' : ''}
          ${isFull ? 'full' : ''}
          ${isPartial ? 'partial' : ''}
        `}
        style={tableStyle}
      >
        {isSeat && seatIndexShown && (
          <div className="seat-index">{index}</div>
        )}
        {available && (
          <>
            <div className="table-id">{name}</div>
            {!isSeat && (
              <div className="table-info">
                {occupied}/{capacity}
                {extraSeatLimit > 0 && (
                  <span className="extra">(+{extraSeatLimit})</span>
                )}
                {width >= 2 && height >= 2 && updateTime && (
                  <div className="last-updated">
                    {formatRelative(updateTime)}前
                  </div>
                )}
                {width >= 3 && height >= 3 && tags.length > 0 && (
                  <div className="table-tags">
                    {tags.map(tag => (
                      <span key={tag} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
        {!hideGridLines && !isSeat && gridLines()}
      </div>

      {mode === 'business' && showControls && available && !deleteTableMode && !isSeat && (
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

      {mode === 'edit' && !deleteTableMode && !moveTableMode && !isSeat && (
        <button
          className="edit-table-button"
          onClick={e => { e.stopPropagation(); onEdit(); }}
        >編輯</button>
      )}
    </div>
  );
};

export default Table;
