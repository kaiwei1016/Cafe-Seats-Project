import React from 'react';
import Background from './Background';
import Navbar from './Navbar';
import TableForm from './TableForm';
import useKCafeLogic from '../hooks/useKCafeLogic';
import '../styles/Global.css';
import '../styles/Navbar.css';
import '../styles/Background.css';
import '../styles/Table.css';
import '../styles/TableForm.css';

const KCafe = ({ hideMenu = false }) => {
  
  const {
    /* 背景 */
    zoom, tempZoom, setTempZoom,
    offsetPx, tempOffsetPx, setTempOffsetPx,
    bgOffset, tempBgOffset,
    isEditingBg, draggingBg,
    startBgEdit, cancelBgEdit, confirmBgEdit,
    handleBgMouseDown,

    /* 滑鼠整合 */
    handleMouseMove, handleMouseUp,

    /* Tables / UI */
    tables, totalCapacity, totalOccupied,
    rotateCount, rotateLayout,
    pendingTable, showAddForm, openAddForm, cancelAddForm,
    newTableInput, setNewTableInput, submitAddForm,
    cancelAddTable, confirmAddTable,
    deleteTableMode, startDeleteTableMode, setSelectedToDeleteTable,
    selectedToDeleteTable, confirmDeleteTable, cancelDeleteTableMode,
    moveTableMode, startMoveTableMode,
    selectedToMoveTable, confirmMoveTable, cancelMoveTableMode,
    showEditForm, openEditForm, cancelEditForm,
    editTableInput, setEditTableInput, saveEditForm,
    draggingTable,
    handleTableMouseDown, handleTableMouseMove, handleTableMouseUp,
    updateTableOccupied,

    mode, setMode,
    menuOpen, setMenuOpen,
    currentTime,
    hasOverlapAdd, hasOverlapMove
  } = useKCafeLogic(hideMenu);

  return (
    <div className="kcafe-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <Navbar
        hideMenu={hideMenu}
        mode={mode}
        setMode={setMode}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}

        /* 背景編輯相關 */
        isEditingBg={isEditingBg}
        startBgEdit={startBgEdit}
        cancelBgEdit={cancelBgEdit}
        confirmBgEdit={confirmBgEdit}
        zoom={isEditingBg ? tempZoom : zoom}
        setZoom={setTempZoom}
        offsetPx={isEditingBg ? tempOffsetPx : offsetPx}

        /* 桌子動作 */
        tables={tables}
        addTable={openAddForm}
        pendingTable={pendingTable}
        cancelAddTable={cancelAddTable}
        confirmAddTable={confirmAddTable}
        startDeleteTableMode={startDeleteTableMode}
        deleteTableMode={deleteTableMode}
        selectedToDeleteTable={selectedToDeleteTable}
        confirmDeleteTable={confirmDeleteTable}
        cancelDeleteTableMode={cancelDeleteTableMode}
        startMoveTableMode={startMoveTableMode}
        moveTableMode={moveTableMode}
        selectedToMoveTable={selectedToMoveTable}
        confirmMoveTable={confirmMoveTable}
        cancelMoveTableMode={cancelMoveTableMode}
        hasOverlapAdd={hasOverlapAdd}
        hasOverlapMove={hasOverlapMove}
      />

      {(showAddForm || showEditForm) && (
        <TableForm
          mode={showAddForm ? 'add' : 'edit'}
          tableInput={showAddForm ? newTableInput : editTableInput}
          nextIndex={tables.length + 1}
          onInputChange={(field, value) =>
            showAddForm
              ? setNewTableInput(prev => ({ ...prev, [field]: value }))
              : setEditTableInput(prev => ({ ...prev, [field]: value }))
          }
          onSubmit={showAddForm ? submitAddForm : saveEditForm}
          onCancel={showAddForm ? cancelAddForm : cancelEditForm}
        />
      )}

      <Background
        tables={tables}
        pendingTable={pendingTable}
        updateTableOccupied={updateTableOccupied}
        mode={mode}
        zoom={isEditingBg ? tempZoom : zoom}
        isEditingBg={isEditingBg}
        offsetPx={isEditingBg ? tempOffsetPx : offsetPx}
        bgOffset={isEditingBg ? tempBgOffset : bgOffset}
        onBgMouseDown={handleBgMouseDown}
        draggingBg={draggingBg}
        handleRotate={rotateLayout}
        rotateCount={rotateCount}
        handleTableMouseDown={handleTableMouseDown}
        deleteTableMode={deleteTableMode}
        selectedToDeleteTable={selectedToDeleteTable}
        onSelectDeleteTable={setSelectedToDeleteTable}
        onEditTable={openEditForm}
        moveTableMode={moveTableMode}
        selectedToMoveTable={selectedToMoveTable}
        draggingTable={draggingTable}
      />

      <h2>
        現在時間：{currentTime.toLocaleString()}
        <br />
        目前座位：<span className="remaining">{totalOccupied}</span>/{totalCapacity}
      </h2>
    </div>
  );
};

export default KCafe;
