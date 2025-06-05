import React, { useState } from 'react';
import '../../styles/TableForm.css';

export default function TableForm({
  mode,
  tableInput,
  nextIndex,
  onInputChange,
  onSubmit,
  onCancel,
  onToggleAvailable
}) {
  const [advanced, setAdvanced] = useState(false);

  // Determine title and button labels
  const isAdd = mode === 'add';
  const title = isAdd ? `新增桌子 ${nextIndex}` : `編輯桌子 ${tableInput.index}`;
  const submitLabel = isAdd ? '新增' : '儲存';
  const namePlaceholder = isAdd ? '留空則自動生成' : '留空則保留原桌名';

  // Tags string conversion
  const tagsString = Array.isArray(tableInput.tags) ? tableInput.tags.join(',') : '';

  // Preview Component
  const Preview = () => {
    const maxPreviewVmin = 30;
    const maxDim = Math.max(tableInput.width, tableInput.height);
    const cellVmin = maxDim > 4 ? maxPreviewVmin / maxDim : 6;
    const previewWidth = tableInput.width * cellVmin;
    const previewHeight = tableInput.height * cellVmin;

    const verticalLines = [];
    for (let i = 1; i < tableInput.width; i++) {
      verticalLines.push(
        <div key={`v-${i}`} className="grid-line vertical" style={{ left: `${(i / tableInput.width) * 100}%` }} />
      );
    }

    const horizontalLines = [];
    for (let j = 1; j < tableInput.height; j++) {
      horizontalLines.push(
        <div key={`h-${j}`} className="grid-line horizontal" style={{ top: `${(j / tableInput.height) * 100}%` }} />
      );
    }

    return (
      <div className="table-preview-container">
        <div className="table preview" style={{ width: `${previewWidth}vmin`, height: `${previewHeight}vmin`, position: 'relative' }}>
          {verticalLines}
          {horizontalLines}

          <div className="table-id">{tableInput.name}</div>
          <div className="table-info">
            0/{tableInput.capacity}
            {tableInput.extraSeatLimit > 0 && <span className="extra">(+{tableInput.extraSeatLimit})</span>}
          </div>

          {Array.isArray(tableInput.tags) && tableInput.tags.length > 0 && (
            <div className="table-tags">
              {tableInput.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Field validation
  const validCapacity = Number.isInteger(tableInput.capacity) && tableInput.capacity >= 0;
  const validWidth  = typeof tableInput.width === 'number' && isFinite(tableInput.width)  && tableInput.width  >= 0.5;
  const validHeight = typeof tableInput.height === 'number' && isFinite(tableInput.height) && tableInput.height >= 0.5;
  const validExtraSeatLimit = Number.isInteger(tableInput.extraSeatLimit) && tableInput.extraSeatLimit >= 0;
  const disabled = !(validCapacity && validWidth && validHeight && validExtraSeatLimit);

  return (
    <div className="modal-backdrop">
      <div className="modal table-form">
        <h3>{title}</h3>

        <div className="pages-container">
          <div className={`pages${advanced ? ' advanced' : ''}`}>  
            <div className="page basic-page">
              <label>
                桌名 (Name):
                <input type="text" value={tableInput.name} placeholder={namePlaceholder} onChange={e => onInputChange('name', e.target.value)} />
              </label>

              <label>
                上限人數 (Capacity):
                <input type="number" step={1} min={0} value={tableInput.capacity} onChange={e => onInputChange('capacity', Math.max(0, Math.floor(+e.target.value)) || 0)} />
              </label>

              <label className="ratio-label">
                桌子比例 (寬 × 高):
                <div className="ratio-inputs">
                  <input type="number" step={0.5} min={1} value={tableInput.width} onChange={e => onInputChange('width', Math.max(0.5, parseFloat(e.target.value) || 0.5))} />
                  <span className="ratio-mul">×</span>
                  <input type="number" step={0.5} min={1} value={tableInput.height} onChange={e => onInputChange('height', Math.max(0.5, parseFloat(e.target.value) || 0.5))} />
                </div>
              </label>
            </div>

            <div className="page advanced-page">
              <label>
                額外座位上限 (ExtraSeatLimit):
                <input type="number" step={1} min={0} value={tableInput.extraSeatLimit} onChange={e => onInputChange('extraSeatLimit', Math.max(0, Math.floor(+e.target.value)) || 0)} />
              </label>

              <label>
                標籤 (Tags, 用逗號分隔):
                <input type="text" value={tagsString} placeholder="例如：插座,靠窗,安靜" onChange={e => onInputChange('tags', e.target.value.split(',').map(s => s.trim()))} />
              </label>

              <label>
                描述 (Description):
                <input type="text" value={tableInput.description} placeholder="選填" onChange={e => onInputChange('description', e.target.value)} />
              </label>
            </div>
          </div>
        </div>

        <Preview />

        <div className="toggle-advanced" onClick={() => setAdvanced(a => !a)}>
          {advanced ? '返回' : '進階設定'}
        </div>

        <div className="modal-actions">
          <button onClick={onSubmit} disabled={disabled}>{submitLabel}</button>
          <button onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}