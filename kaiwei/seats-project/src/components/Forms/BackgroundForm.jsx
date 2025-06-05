// src/components/Forms/BackgroundForm.jsx
import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import '../../styles/BackgroundForm.css';

// Helper: Canvas 裁切並回傳 Blob URL
const getCroppedImg = (imageSrc, pixelCrop) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas is empty'));
        const url = URL.createObjectURL(blob);
        resolve(url);
      }, 'image/jpeg');
    };
    image.onerror = error => reject(error);
  });

// 預設的裁切參數
const DEFAULT_CROP = { x: 408, y: 146, width: 1105, height: 707 };
const DEFAULT_ZOOM = 1.411;

export default function BackgroundForm({
  srcOriginal,
  initialCrop = DEFAULT_CROP,
  initialZoom = DEFAULT_ZOOM,
  onSave,
  onCancel
}) {
  const imageSrc = srcOriginal;

  // 1. state：crop、zoom、cropAreaPixels
  const [crop, setCrop] = useState({ x: initialCrop.x, y: initialCrop.y });
  const [zoom, setZoom] = useState(initialZoom);
  const [cropAreaPixels, setCropAreaPixels] = useState(initialCrop);

  // 當 props.initialCrop 或 initialZoom 改變時，重設 state
  useEffect(() => {
    setCrop({ x: initialCrop.x, y: initialCrop.y });
    setCropAreaPixels(initialCrop);
  }, [initialCrop]);

  useEffect(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  const onCropComplete = useCallback((_, pixels) => {
    setCropAreaPixels(pixels);
  }, []);

  // 2. 處理「儲存」按鈕：裁切並回傳
  const handleSave = async () => {
    if (!cropAreaPixels) return;
    const url = await getCroppedImg(imageSrc, cropAreaPixels);
    onSave({ url, crop: cropAreaPixels, zoom });
  };

  // 3. 處理「恢复預設圖片」按鈕：將 crop 和 zoom 重置
  const handleResetToDefault = () => {
    setCrop({ x: DEFAULT_CROP.x, y: DEFAULT_CROP.y });
    setCropAreaPixels(DEFAULT_CROP);
    setZoom(DEFAULT_ZOOM);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal background-form">
        <h3>編輯背景圖片</h3>

        {/* ===== Cropper Preview 區 ===== */}
        <div className="bgform-preview">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={25 / 16}
            minZoom={0.5}
            maxZoom={3}
            restrictPosition={false}
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />

          {/* Zoom Slider */}
          <div className="slider-container">
            <input
              type="range"
              min="0.5"
              max="3"
              step="0.001"
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="vertical-slider"
            />
          </div>
        </div>

        {/* ===== 儲存／取消 按鈕區 ===== */}
        <div className="modal-actions">
          <button className="btn-save" onClick={handleSave}>
            儲存
          </button>
          <button className="btn-cancel" onClick={onCancel}>
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
