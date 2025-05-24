import React from 'react';
import Table from './Table';
import '../styles/Background.css';

const Background = ({
  /* 背景 */
  zoom,
  isEditingBg,
  draggingBg,
  offsetPx,          // 像素位移 (正式或暫存皆由父層決定)
  onBgMouseDown,
  rotateCount,
  handleRotate,

  /* 桌子 */
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
    <div className={`background ${mode === 'edit' ? 'show-grid' : ''}`}>
      <button
        className="rotate-button"
        onClick={handleRotate}
        disabled={isEditingBg}
      >
        ⟳
      </button>

      {/* 背景區塊改成 div + background-image */}
      <div
        className="bg-image"
        style={{
          backgroundImage: 'url(/img/KCafe.jpg)',
          backgroundPosition: `${offsetPx.x}px ${offsetPx.y}px`,
          backgroundSize: `${zoom * 100}%`,
          backgroundRepeat: 'no-repeat',
          transform: `rotate(${-rotateCount * 90}deg)`,
          pointerEvents: isEditingBg ? 'all' : 'none',
          cursor: isEditingBg
            ? (draggingBg ? 'grabbing' : 'grab')
            : 'default'
        }}
        onMouseDown={isEditingBg ? onBgMouseDown : undefined}
      />

      {/* 桌子 */}
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
          disableInteraction={isEditingBg}
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

      {/* pendingTable 半透明預覽 */}
      {pendingTable && (
        <div
          className="table-container pending"
          style={{
            left: `${pendingTable.left}%`,
            top: `${pendingTable.top}%`,
            width: `${pendingTable.width * 4}%`,
            height: `${pendingTable.height * 6}%`
          }}
          onMouseDown={e => handleTableMouseDown(pendingTable.table_id, e)}
        >
          <div className="table pending" style={{ width: '100%', height: '100%' }}>
            <div className="table-id">{pendingTable.name}</div>
            <div className="table-info">
              0/{pendingTable.capacity}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Background;
