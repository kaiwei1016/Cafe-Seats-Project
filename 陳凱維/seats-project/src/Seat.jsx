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
  return (
    <img
      key={id}
      src={occupied ? '/img/r_circle.png' : '/img/g_circle.png'}
      alt={`Seat ${id}`}
      title={`Seat ${id}`}
      className={`seat ${occupied ? 'occupied' : ''} ${isSelectedForDelete ? 'selected-delete' : ''} ${isSelectedForMove ? 'selected-move' : ''}`}
      style={{
        left: `${isSelectedForMove && tempMovePosition ? tempMovePosition.left : left}%`,
        top: `${isSelectedForMove && tempMovePosition ? tempMovePosition.top : top}%`,
        cursor: (mode === 'edit' && moveMode && !pendingSeat && !deleteMode) ? 'grab' : 'default',
      }}
      onClick={handleToggleSeat}
      onMouseDown={handleMouseDown}
    />
  );
};

export default Seat;
