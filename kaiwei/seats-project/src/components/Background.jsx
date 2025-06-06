// src/components/Background.jsx
import React from 'react';
import Table from './Table';
import '../styles/Background.css';

export default function Background({
  tables,
  pendingTable,
  showSeatIndex,
  bgOffset,
  bgImage,
  hideImage,
  hideGrid,
  hideTables,

  mode,
  updateTableOccupied,
  handleTableMouseDown,

  deleteTableMode,
  selectedToDeleteList,
  onToggleDeletePick,

  onEditTable,
  moveTableMode,
  selectedToMoveTable,

  handleRotate,
  rotateCount
}) {
  const isVertical       = rotateCount % 2 !== 0;
  const orientationClass = isVertical ? 'vertical' : 'horizontal';

  const unitX = isVertical ? 6.25 : 4;
  const unitY = isVertical ? 4    : 6.25;

  let objectPosition;
  if (!isVertical) {
    objectPosition = `${bgOffset.x}% ${bgOffset.y}%`;
  } else {
    const newX = bgOffset.y;
    const newY = 100 - bgOffset.x;
    objectPosition = `${newX}% ${newY}%`;
  }

  return (
    <div className={`background ${orientationClass} ${mode === 'edit' ? 'show-grid' : ''}`}>
      <button className="rotate-button" onClick={handleRotate}>⟳</button>

      {hideImage ? (
        <div className="bg-white-fill" style={{ position: 'absolute', inset: 0, backgroundColor: '#fff' }} />
      ) : (
        <img src={bgImage} alt="" className="bg-image" style={{ objectPosition }} />
      )}

      {!hideTables && tables.map(tbl => (
        <Table
          key={tbl.table_id}
          tableId={tbl.table_id}
          index={tbl.index}
          seatIndexShown={showSeatIndex}
          name={tbl.name}
          left={tbl.left}
          top={tbl.top}
          width={tbl.width}
          height={tbl.height}
          capacity={tbl.capacity}
          occupied={tbl.occupied}
          extraSeatLimit={tbl.extraSeatLimit}
          updateTime={tbl.updateTime}
          tags={tbl.tags}
          available={tbl.available}
          mode={mode}
          unitX={unitX}
          unitY={unitY}
          hideGridLines={hideGrid}
          updateOccupied={delta => updateTableOccupied(tbl.table_id, delta)}
          onMouseDown={e => handleTableMouseDown(tbl.table_id, e)}
          onTouchStart={e => handleTableMouseDown(tbl.table_id, e)}
          deleteTableMode={deleteTableMode}
          selectedToDeleteList={selectedToDeleteList}
          onToggleDeletePick={onToggleDeletePick} 
          onEdit={() => onEditTable(tbl.table_id)}
          moveTableMode={moveTableMode}
          selectedToMoveTable={selectedToMoveTable}
        />
      ))}

      {pendingTable && (() => {
        const isSeat = pendingTable.table_id?.[0]?.toLowerCase() === 's';
        return (
          <div
            className={`table-container pending ${isSeat ? 'seat-container' : ''}`}
            style={{
              left:   `${pendingTable.left}%`,
              top:    `${pendingTable.top}%`,
              width:  `${pendingTable.width  * unitX}%`,
              height: `${pendingTable.height * unitY}%`
            }}
            onMouseDown={e => handleTableMouseDown(pendingTable.table_id, e)}
            onTouchStart={e => handleTableMouseDown(pendingTable.table_id, e)}
          >
            <div
              className={`table pending ${isSeat ? 'seat' : ''}`}
              style={{ width: '100%', height: '100%' }}
            >
              {!isSeat && (
                <>
                  <div className="table-id">{pendingTable.name}</div>
                  <div className="table-info">0/{pendingTable.capacity}</div>
                </>
              )}
              {isSeat && showSeatIndex && (
                <div className="seat-index">{pendingTable.index}</div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
