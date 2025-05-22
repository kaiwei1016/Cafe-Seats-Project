// src/components/BackgroundForm.jsx
import React, { useState, useRef, useEffect } from 'react';
import '../styles/BackgroundForm.css';

export default function BackgroundForm({ bgOffset, onSave, onCancel }) {
  const previewRef = useRef(null);

  // 初始裁切框：占 50% 宽度，高度按 25:16 计算
  const initialW = 50;
  const initialH = (initialW * 16) / 25;

  const [crop, setCrop] = useState({
    x: 25,      // 左上角 X 百分比
    y: 25,      // 左上角 Y 百分比
    w: initialW,
    h: initialH
  });
  const [action, setAction] = useState(null);
  const [start, setStart]   = useState(null);

  // 鼠标按下：开始「移动」或「调整大小」
  const onMouseDownCrop = e => {
    if (e.target.classList.contains('handle')) return;
    e.preventDefault();
    setAction({ type: 'move' });
    setStart({ mx: e.clientX, my: e.clientY, crop });
  };
  const onMouseDownHandle = (e, edge) => {
    e.stopPropagation();
    e.preventDefault();
    setAction({ type: 'resize', edge });
    setStart({ mx: e.clientX, my: e.clientY, crop });
  };

  // 鼠标移动 & 松开
  useEffect(() => {
    const onMouseMove = e => {
      if (!action) return;
      const rect = previewRef.current.getBoundingClientRect();
      const dx = ((e.clientX - start.mx) / rect.width) * 100;
      const dy = ((e.clientY - start.my) / rect.height) * 100;
      let { x, y, w, h } = start.crop;

      const ratio = 16 / 25;

      if (action.type === 'move') {
        x = Math.min(100 - w, Math.max(0, x + dx));
        y = Math.min(100 - h, Math.max(0, y + dy));
      } else {
        if (action.edge === 'left' || action.edge === 'right') {
          // 水平等比调整
          const deltaW = action.edge === 'left' ? -dx : dx;
          if (action.edge === 'left') {
            // 左边缘：newW ≤ start.w + start.x
            const maxW = start.crop.w + start.crop.x;
            const newW = Math.min(maxW, Math.max(5, start.crop.w + deltaW));
            const newH = newW * ratio;
            let newX = start.crop.x - (newW - start.crop.w);
            newX = Math.max(0, newX);
            w = newW;
            h = newH;
            x = newX;
          } else {
            // 右边缘：newW ≤ 100 - start.x
            const maxW = 100 - start.crop.x;
            const newW = Math.min(maxW, Math.max(5, start.crop.w + deltaW));
            const newH = newW * ratio;
            w = newW;
            h = newH;
          }
        } else {
          // 垂直等比调整
          const deltaH = action.edge === 'top' ? -dy : dy;
          if (action.edge === 'top') {
            const maxH = start.crop.h + start.crop.y;
            const newH = Math.min(maxH, Math.max(5, start.crop.h + deltaH));
            const newW = newH / ratio;
            let newY = start.crop.y - (newH - start.crop.h);
            newY = Math.max(0, newY);
            h = newH;
            w = newW;
            y = newY;
          } else {
            const maxH = 100 - start.crop.y;
            const newH = Math.min(maxH, Math.max(5, start.crop.h + deltaH));
            const newW = newH / ratio;
            h = newH;
            w = newW;
          }
        }
      }

      setCrop({ x, y, w, h });
    };

    const onMouseUp = () => setAction(null);

    if (action) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup',   onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup',   onMouseUp);
    };
  }, [action, start]);

  return (
    <div className="modal-backdrop">
      <div className="modal background-form">
        <h3>編輯背景圖片</h3>

        <div className="bgform-preview" ref={previewRef}>
          <img src="/img/KCafe.jpg" alt="" className="bgform-image" />

          <div
            className="crop-box"
            style={{
              left:   `${crop.x}%`,
              top:    `${crop.y}%`,
              width:  `${crop.w}%`,
              height: `${crop.h}%`
            }}
            onMouseDown={onMouseDownCrop}
          >
            {['left','right','top','bottom'].map(edge => (
              <div
                key={edge}
                className={`handle handle-${edge}`}
                onMouseDown={e => onMouseDownHandle(e, edge)}
              />
            ))}
            <div className="bgform-grid" />
          </div>
        </div>

        <div className="modal-actions">
          <button onClick={() => onSave(crop)}>儲存</button>
          <button onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}
