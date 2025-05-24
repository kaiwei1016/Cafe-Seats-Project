import React, { useState, useCallback, useEffect } from 'react';
import Cropper from 'react-easy-crop';
import '../styles/BackgroundForm.css';

export default function BackgroundForm({
  srcOriginal,
  initialCrop = { x: 0, y: 0 },
  initialZoom = 1,
  onSave, onCancel }) {
  // Inline helper: 使用 Canvas 裁切並回傳 Blob URL (白色背景處理)
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

        // 填滿白色底，避免超出區域變黑
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 繪製圖片
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
    const imageSrc = srcOriginal;
    const [crop, setCrop] = useState({ x: initialCrop.x, y: initialCrop.y });
    const [zoom, setZoom] = useState(initialZoom);
    const [cropAreaPixels, setCropAreaPixels] = useState(initialCrop);

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

    const handleSave = async () => {
      if (!cropAreaPixels) return;
    // 一定要用 imageSrc（即 props.srcOriginal），不要用不存在的 src
    const url = await getCroppedImg(imageSrc, cropAreaPixels);
    onSave({ url, crop: cropAreaPixels, zoom });
    };

  return (
    <div className="modal-backdrop">
      <div className="modal background-form">
        <h3>編輯背景圖片</h3>

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

          {/* 垂直滑桿：即時調整縮放 */}
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

        <div className="modal-actions">
          <button onClick={handleSave}>儲存</button>
          <button onClick={onCancel}>取消</button>
        </div>
      </div>
    </div>
  );
}
