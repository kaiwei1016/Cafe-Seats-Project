import React from 'react';
import Seat from './Seat';
import Table from './Table';
import './KCafe.css';

const Background = ({
  positions,
  seats,
  tables,
  pendingTable,
  updateTableOccupied,
  mode,
  toggleSeat,
  handleTableMouseDown,
  deleteTableMode,
  selectedToDeleteTable,
  onSelectDeleteTable,
  onEditTable,
  moveTableMode,
  selectedToMoveTable
}) => {
  return (
    <div className="background">
      {/* 背景圖片 */}
      <img
        src="/img/KCafe.jpg"
        alt="KCafe Background"
        className="bg-image"
        draggable={false}
        onDragStart={e => e.preventDefault()}
      />


      {/* 渲染桌子 */}
      {tables.map(tbl => (
        <Table
          tableIndex={tbl.index} 
          id={tbl.id}
          left={tbl.left}
          top={tbl.top}
          capacity={tbl.capacity}
          occupied={tbl.occupied}
          mode={mode}
          updateOccupied={(delta) => updateTableOccupied(tbl.index, delta)}
          onMouseDown={e => handleTableMouseDown(tbl.index, e)}
          deleteTableMode={deleteTableMode}
          selectedToDeleteTable={selectedToDeleteTable}
          onSelectDeleteTable={() => onSelectDeleteTable(tbl.index)}
          onEdit={() => onEditTable(tbl.index)}
          moveTableMode={moveTableMode}
          selectedToMoveTable={selectedToMoveTable}
        />
      ))}

          {/* 如果有 pendingTable，就用半透明方式先顯示它，並能拖曳 */}
    {pendingTable && (
      <div
        className="table-container pending"
        style={{
          left:  `${pendingTable.left}%`,
          top:   `${pendingTable.top}%`
        }}
        onMouseDown={e => handleTableMouseDown(pendingTable.index, e)}
      >
        <div className="table pending">
          <div className="table-id">{pendingTable.id}</div>
          <div className="table-info">0/{pendingTable.capacity}</div>
        </div>
      </div>
    )}

      {/* 渲染所有座位（只剩業務模式下點擊切換佔用） */}
      {positions.map((seat, idx) => (
        <Seat
          key={seat.id}
          id={seat.id}
          left={seat.left}
          top={seat.top}
          occupied={seats[idx]}
          mode={mode}
          handleToggleSeat={e => toggleSeat(idx, e)}
        />
      ))}
    </div>
  );
};

export default Background;
