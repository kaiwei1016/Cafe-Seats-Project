import React from 'react';

/**
 * TableForm 通用表單，用於新增或編輯桌子
 *
 * props:
 * - mode: 'add' 或 'edit'
 * - tableInput: { index?, id, capacity, description, width, height }
 * - nextIndex: number (僅對 mode==='add' 有效)
 * - onInputChange: (field: string, value: any) => void
 * - onSubmit: () => void
 * - onCancel: () => void
 * - disabled: boolean
 */
const TableForm = ({
  mode,
  tableInput,
  nextIndex,
  onInputChange,
  onSubmit,
  onCancel,
  disabled
}) => {
  const isAdd = mode === 'add';
  const title = isAdd
    ? `新增桌子 ${nextIndex}`
    : `編輯桌子 ${tableInput.index}`;
  const submitLabel = isAdd ? '新增' : '儲存';
  const idPlaceholder = isAdd
    ? '留空則自動編號'
    : '留空則保留原編號';

  // 用來產生 grid lines 的 helpers
  const verticalLines = [];
  for (let i = 1; i < tableInput.width; i++) {
    verticalLines.push(
      <div
        key={`v-${i}`}
        className="grid-line vertical"
        style={{ left: `${(i / tableInput.width) * 100}%` }}
      />
    );
  }
  const horizontalLines = [];
  for (let j = 1; j < tableInput.height; j++) {
    horizontalLines.push(
      <div
        key={`h-${j}`}
        className="grid-line horizontal"
        style={{ top: `${(j / tableInput.height) * 100}%` }}
      />
    );
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>{title}</h3>

        <label>
          桌號 (ID):
          <input
            type="text"
            value={tableInput.id}
            placeholder={idPlaceholder}
            onChange={e => onInputChange('id', e.target.value)}
          />
        </label>

        <label>
          上限人數 (Capacity):
          <input
            type="number"
            min={1}
            value={tableInput.capacity}
            onChange={e => onInputChange('capacity', +e.target.value)}
          />
        </label>

        {/* 長寬比例 */}
        <label className="ratio-label">
          桌子比例 (寬 × 高):
          <div className="ratio-inputs">
            <input
              type="number"
              min={1}
              value={tableInput.width}
              onChange={e => onInputChange('width', Math.max(1, +e.target.value))}
            />
            <span className="ratio-mul">×</span>
            <input
              type="number"
              min={1}
              value={tableInput.height}
              onChange={e => onInputChange('height', Math.max(1, +e.target.value))}
            />
          </div>
        </label>

        {/* 預覽 */}
        <div className="table-preview-container">
          <div
            className="table preview"
            style={{
              width:  `${tableInput.width  * 7}vmin`,
              height: `${tableInput.height * 7}vmin`,
              position: 'relative'
            }}
          >
            {/* grid lines */}
            {verticalLines}
            {horizontalLines}

            {/* 內容 */}
            <div className="table-id">{tableInput.id}</div>
            <div className="table-info">0/{tableInput.capacity}</div>
          </div>
        </div>

        <label>
          描述 (Description):
          <input
            type="text"
            value={tableInput.description}
            placeholder="選填"
            onChange={e => onInputChange('description', e.target.value)}
          />
        </label>

        <div className="modal-actions">
          <button onClick={onSubmit} disabled={disabled}>
            {submitLabel}
          </button>
          <button onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
};

export default TableForm;
