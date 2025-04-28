import React from 'react';
import './KCafe.css';

const Navbar = ({
  mode,
  menuOpen,
  setMenuOpen,
  setMode,
  addSeat,
  pendingSeat,
  deleteMode,
  moveMode,
  startDeleteMode,
  confirmDelete,
  cancelDeleteMode,
  startMoveMode,
  confirmMove,
  cancelMoveMode,
  selectedToDelete,
  selectedToMove,
  tempMovePosition,
  confirmSeat,
  checkOverlap
}) => {
  return (
    <nav className="navbar">
      <div className="mode-display">目前模式：{mode === 'business' ? '營業模式' : mode === 'edit' ? '編輯模式' : '觀察模式'}</div>
      <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)}>☰</button>
      {menuOpen && (
        <div className="menu-dropdown">
          <button onClick={() => { setMode('business'); setMenuOpen(false); }}>營業模式</button>
          <button onClick={() => { setMode('edit'); setMenuOpen(false); }}>編輯模式</button>
          <button onClick={() => { setMode('view'); setMenuOpen(false); }}>觀察模式</button>
        </div>
      )}
      {mode === 'edit' && (
        <div className="edit-controls">
          <button onClick={addSeat} disabled={pendingSeat !== null || deleteMode || moveMode}>新增座位</button>
          {pendingSeat && (
            <button onClick={confirmSeat} disabled={!checkOverlap()}>確認新增</button>
          )}
          <button onClick={startDeleteMode} disabled={pendingSeat !== null || deleteMode || moveMode}>刪除座位</button>
          {deleteMode && (
            <>
              <button onClick={confirmDelete} disabled={selectedToDelete === null}>確認刪除</button>
              <button onClick={cancelDeleteMode}>取消刪除</button>
            </>
          )}
          <button onClick={startMoveMode} disabled={pendingSeat !== null || moveMode || deleteMode}>移動座位</button>
          {moveMode && (
            <>
              <button onClick={confirmMove} disabled={selectedToMove === null || !tempMovePosition}>確認移動</button>
              <button onClick={cancelMoveMode}>取消移動</button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
