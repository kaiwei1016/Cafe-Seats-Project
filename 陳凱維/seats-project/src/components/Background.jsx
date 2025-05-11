import React from 'react';
import Seat from './Seat';
import Table from './Table';
import './KCafe.css';

const Background = ({
  positions,             
  seats,
  tables,
  updateTableOccupied,                 
  pendingSeat,           
  tempMovePosition,      
  selectedToDelete,     
  selectedToMove,       
  moveMode,              
  deleteMode,            
  mode,                  
  toggleSeat,           
  handleMouseDown,
  handleTableMouseDown         
}) => {
  return (
    <div className="background">
      {/* 背景圖片 */}
      <img src="/img/KCafe.jpg" alt="KCafe Background" className="bg-image" />

      {/* ★ 先渲染桌子 */}
      {tables.map((tbl) => (
        <Table
          key={tbl.id}
          id={tbl.id}
          left={tbl.left}
          top={tbl.top}
          capacity={tbl.capacity}
          occupied={tbl.occupied}
          mode={mode}                            // 傳入當前模式
          updateOccupied={updateTableOccupied}   // 傳入更新函式
          onMouseDown={e => handleTableMouseDown(tbl.id, e)}
        />
      ))}

      {/* 渲染所有座位 */}
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

      {/* 新增中的座位（pending） */}
      {pendingSeat && (
        <img
          src='/img/g_circle.png'
          alt="New Seat"
          className="seat pending"
          style={{ left: `${pendingSeat.left}%`, top: `${pendingSeat.top}%` }}
          onMouseDown={(e) => handleMouseDown('pending', e)}
        />
      )}
    </div>
  );
};

export default Background;