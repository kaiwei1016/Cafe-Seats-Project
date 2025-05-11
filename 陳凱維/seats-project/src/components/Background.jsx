import React from 'react';
import Table from './Table';
import './KCafe.css';

const Background = ({
  tables,
  pendingTable,
  updateTableOccupied,
  mode,
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
          key={tbl.index}
          tableIndex={tbl.index}
          id={tbl.id}
          left={tbl.left}
          top={tbl.top}
          capacity={tbl.capacity}
          occupied={tbl.occupied}
          mode={mode}
          updateOccupied={delta => updateTableOccupied(tbl.index, delta)}
          onMouseDown={e => handleTableMouseDown(tbl.index, e)}
          deleteTableMode={deleteTableMode}
          selectedToDeleteTable={selectedToDeleteTable}
          onSelectDeleteTable={() => onSelectDeleteTable(tbl.index)}
          onEdit={() => onEditTable(tbl.index)}
          moveTableMode={moveTableMode}
          selectedToMoveTable={selectedToMoveTable}
        />
      ))}

      {/* pendingTable 的半透明預覽 */}
      {pendingTable && (
        <div
          className="table-container pending"
          style={{ left: `${pendingTable.left}%`, top: `${pendingTable.top}%` }}
          onMouseDown={e => handleTableMouseDown(pendingTable.index, e)}
        >
          <div className="table pending">
            <div className="table-id">{pendingTable.id}</div>
            <div className="table-info">0/{pendingTable.capacity}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Background;