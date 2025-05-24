import React from 'react';
import Table from './Table';
import '../styles/Background.css';

const Background = ({
  tables,
  pendingTable,
  updateTableOccupied,
  mode, bgOffset, bgImage,
  handleTableMouseDown,
  deleteTableMode,
  selectedToDeleteTable,
  onSelectDeleteTable,
  onEditTable,
  moveTableMode,
  selectedToMoveTable,
  handleRotate,
  rotateCount
}) => {

  const isVertical = rotateCount % 2 !== 0;
let objectPosition;

if (!isVertical) {
  objectPosition = `${bgOffset.x}% ${bgOffset.y}%`;
} else {
  // 90° CCW (rotate(-90deg)) 或 270° CW
  const newX = bgOffset.y;
  const newY = 100 - bgOffset.x;
  objectPosition = `${newX}% ${newY}%`;
}

  return (
    <div className={`background ${mode === 'edit' ? 'show-grid' : ''}`}>
      {/* 旋轉按鈕 */}
      <button className="rotate-button" onClick={handleRotate}>
        ⟳
      </button>
      {/* 背景圖：純粹視覺旋轉 */}
      <img
        src={bgImage}
        alt=""
        className="bg-image"
        style={{
          transform: `rotate(${-rotateCount * 90}deg)`,
          objectPosition
        }}
        draggable={false}
        onDragStart={e => e.preventDefault()}
      />

      {/* 渲染桌子 */}
      {tables.map(tbl => (
        <Table
          key={tbl.table_id}
          tableId={tbl.table_id}
          name={tbl.name}
          left={tbl.left}
          top={tbl.top}
          capacity={tbl.capacity}
          occupied={tbl.occupied}
          width={tbl.width}
          height={tbl.height}
          extraSeatLimit={tbl.extraSeatLimit}
          updateTime={tbl.updateTime}
          tags={tbl.tags}
          mode={mode}
          updateOccupied={delta => updateTableOccupied(tbl.table_id, delta)}
          onMouseDown={e => handleTableMouseDown(tbl.table_id, e)}
          deleteTableMode={deleteTableMode}
          selectedToDeleteTable={selectedToDeleteTable}
          onSelectDeleteTable={() => onSelectDeleteTable(tbl.table_id)}
          onEdit={() => onEditTable(tbl.table_id)}
          moveTableMode={moveTableMode}
          selectedToMoveTable={selectedToMoveTable}
        />
      ))}

{/* pendingTable 的半透明預覽 */}
{pendingTable && (
  <div
    className="table-container pending"
    style={{
      left:   `${pendingTable.left}%`,
      top:    `${pendingTable.top}%`,
      width:  `${pendingTable.width  * 4}%`,  // 半角 % 喔
      height: `${pendingTable.height * 6}%`
    }}
    onMouseDown={e => handleTableMouseDown(pendingTable.table_id, e)}
  >
    <div className="table pending" style={{ width: '100%', height: '100%' }}>
      <div className="table-id">{pendingTable.name}</div>
      <div className="table-info">0/{pendingTable.capacity}</div>
    </div>
  </div>
)}


    </div>
  );
};

export default Background;