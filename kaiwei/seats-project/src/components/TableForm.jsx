// TableForm.jsx
import React, { useState } from 'react';
import '../styles/TableForm.css';

export default function TableForm({
  mode,
  tableInput,
  nextIndex,
  onInputChange,
  onSubmit,
  onCancel
}) {
  const [advanced, setAdvanced] = useState(false);

  const isAdd = mode === 'add';
  const title = isAdd
    ? `新增桌子 ${nextIndex}`
    : `編輯桌子 ${tableInput.index}`;
  const submitLabel = isAdd ? '新增' : '儲存';
  const namePlaceholder = isAdd
    ? '留空則自動生成'
    : '留空則保留原桌名';

  // 將 tags 陣列轉成逗號字串
  const tagsString = Array.isArray(tableInput.tags)
    ? tableInput.tags.join(',')
    : '';

  // 預覽元件 (只顯示一次)
  const Preview = () => {
    const maxPreviewVmin = 30;
    const maxDim = Math.max(tableInput.width, tableInput.height);
    const cellVmin = maxDim > 4 ? maxPreviewVmin / maxDim : 6;
    const previewWidth = tableInput.width * cellVmin;
    const previewHeight = tableInput.height * cellVmin;

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
      <div className="table-preview-container">
        <div
          className="table preview"
          style={{
            width:  `${previewWidth}vmin`,
            height: `${previewHeight}vmin`,
            position: 'relative'
          }}
        >
          {verticalLines}
          {horizontalLines}
          <div className="table-id">{tableInput.name}</div>
          <div className="table-info">
            0/{tableInput.capacity}
            {tableInput.extraSeatLimit > 0 && (
              <span className="extra">(+{tableInput.extraSeatLimit})</span>
            )}
          </div>
          {Array.isArray(tableInput.tags) && tableInput.tags.length > 0 && (
            <div className="table-tags">
              {tableInput.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // 驗證欄位
  const validCapacity       = Number.isInteger(tableInput.capacity)       && tableInput.capacity >= 0;
  const validWidth          = Number.isInteger(tableInput.width)          && tableInput.width >= 1;
  const validHeight         = Number.isInteger(tableInput.height)         && tableInput.height >= 1;
  const validExtraSeatLimit = Number.isInteger(tableInput.extraSeatLimit) && tableInput.extraSeatLimit >= 0;
  const disabled = !(validCapacity && validWidth && validHeight && validExtraSeatLimit);

  return (
    <div className="modal-backdrop">
      <div className="modal table-form">
        <h3>{title}</h3>
        {/* 分頁欄位 */}
        <div className="pages-container">
          <div className={`pages${advanced ? ' advanced' : ''}`}>  
            {/* 基本設定頁 */}
            <div className="page basic-page">
              <label>
                桌名 (Name):
                <input
                  type="text"
                  value={tableInput.name}
                  placeholder={namePlaceholder}
                  onChange={e => onInputChange('name', e.target.value)}
                />
              </label>
              <label>
                上限人數 (Capacity):
                <input
                  type="number" step={1} min={0}
                  value={tableInput.capacity}
                  onChange={e => {
                    const v = Math.max(0, Math.floor(+e.target.value));
                    onInputChange('capacity', isNaN(v) ? 0 : v);
                  }}
                />
              </label>
              <label className="ratio-label">
                桌子比例 (寬 × 高):
                <div className="ratio-inputs">
                  <input
                    type="number" step={1} min={1}
                    value={tableInput.width}
                    onChange={e => {
                      const v = Math.max(1, Math.floor(+e.target.value));
                      onInputChange('width', isNaN(v) ? 1 : v);
                    }}
                  />
                  <span className="ratio-mul">×</span>
                  <input
                    type="number" step={1} min={1}
                    value={tableInput.height}
                    onChange={e => {
                      const v = Math.max(1, Math.floor(+e.target.value));
                      onInputChange('height', isNaN(v) ? 1 : v);
                    }}
                  />
                </div>
              </label>
            </div>

            {/* 進階設定頁 */}
            <div className="page advanced-page">
              <label>
                額外座位上限 (ExtraSeatLimit):
                <input
                  type="number" step={1} min={0}
                  value={tableInput.extraSeatLimit ?? 0}
                  onChange={e => {
                    const v = Math.max(0, Math.floor(+e.target.value));
                    onInputChange('extraSeatLimit', isNaN(v) ? 0 : v);
                  }}
                />
              </label>
              <label>
                標籤 (Tags, 用逗號分隔):
                <input
                  type="text"
                  value={tagsString}
                  placeholder="例如：插座,靠窗,安靜"
                  onChange={e => {
                    const arr = e.target.value.split(',').map(s => s.trim());
                    onInputChange('tags', arr);
                  }}
                />
              </label>
              <label>
                描述 (Description):
                <input
                  type="text"
                  value={tableInput.description}
                  placeholder="選填"
                  onChange={e => onInputChange('description', e.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* 固定顯示預覽 */}
        <Preview />


        {/* 切換分頁按鈕 */}
        <div
          className="toggle-advanced"
          onClick={() => setAdvanced(a => !a)}
        >
          {advanced ? '返回' : '進階設定'}
        </div>

        <div className="modal-actions">
          <button onClick={onSubmit} disabled={disabled}>
            {submitLabel}
          </button>
          <button onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}
