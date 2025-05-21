import React from 'react';
import './KCafe.css';

const Seat = ({
  id,
  left,
  top,
  occupied,
  isSelectedForMove,
  isSelectedForDelete,
  tempMovePosition,
  moveMode,
  mode,
  pendingSeat,
  deleteMode,
  handleToggleSeat,
  handleMouseDown
}) => {
  const seatNumberClass = isSelectedForMove || isSelectedForDelete ? 'seat-number highlight' : 'seat-number';

  return (
    <div
      className="seat-container"
      style={{
        left: `${isSelectedForMove && tempMovePosition ? tempMovePosition.left : left}%`,
        top: `${isSelectedForMove && tempMovePosition ? tempMovePosition.top : top}%`,
      }}
    >
      <img
        src={occupied ? '/img/r_circle.png' : '/img/g_circle.png'}
        alt={`Seat ${id}`}
        title={`Seat ${id}`}
        className={`seat ${occupied ? 'occupied' : ''} ${isSelectedForDelete ? 'selected-delete' : ''} ${isSelectedForMove ? 'selected-move' : ''}`}
        style={{
          cursor: (mode === 'edit' && moveMode && !pendingSeat && !deleteMode) ? 'grab' : 'default',
        }}
        onClick={handleToggleSeat}
        onMouseDown={handleMouseDown}
      />
      <div className={seatNumberClass}>{id}</div>
    </div>
  );
};

export default Seat;