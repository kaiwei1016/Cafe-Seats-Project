import React from 'react';
import Table from './Table';
import '../styles/Background.css';

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
  selectedToMoveTable,
  handleRotate,
  rotateCount
}) => {
  return (
    <div className={`background ${mode === 'edit' ? 'show-grid' : ''}`}>
      {/* 旋轉按鈕 */}
      <button className="rotate-button" onClick={handleRotate}>
        ⟳
      </button>
      {/* 背景圖：純粹視覺旋轉 */}
      <img
        src="/img/KCafe.jpg"
        alt="KCafe Background"
        className="bg-image"
        style={{
          transform: `rotate(${-rotateCount * 90}deg)`
        }}        
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
          width={tbl.width}
          height={tbl.height}
          extraSeatLimit={tbl.extraSeatLimit}
          updateTime={tbl.updateTime}
          tags={tbl.tags}
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
    style={{
      left:   `${pendingTable.left}%`,
      top:    `${pendingTable.top}%`,
      width:  `${pendingTable.width  * 4}%`,  // 半角 % 喔
      height: `${pendingTable.height * 6}%`
    }}
    onMouseDown={e => handleTableMouseDown(pendingTable.index, e)}
  >
    <div className="table pending" style={{ width: '100%', height: '100%' }}>
      <div className="table-id">{pendingTable.id}</div>
      <div className="table-info">0/{pendingTable.capacity}</div>
    </div>
  </div>
)}


    </div>
  );
};

export default Background;