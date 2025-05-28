import React, { useEffect, useState, useCallback, useRef } from 'react'
import Cropper from 'react-easy-crop'
import '../../styles/Navbar.css'

// Helper: canvas crop and return blob URL
const getCroppedImg = (imageSrc, pixelCrop) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.src = imageSrc
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, canvas.width, canvas.height)
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
      )
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Canvas is empty'))
        resolve(URL.createObjectURL(blob))
      }, 'image/png')
    }
    image.onerror = e => reject(e)
  })

export default function NavbarForm({
  open,
  onClose,
  currentTitle,
  currentLogo = '/img/logo.png',
  onSave
}) {
  const fileInputRef = useRef(null)

  const [input, setInput] = useState(currentTitle)
  const [logoSrc, setLogoSrc] = useState(currentLogo)
  const [originalLogo, setOriginalLogo] = useState(currentLogo)
  const [cropping, setCropping] = useState(false)

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [cropAreaPixels, setCropAreaPixels] = useState(null)

  useEffect(() => {
    if (open) {
      setInput(currentTitle)
      setLogoSrc(currentLogo)
      setOriginalLogo(currentLogo)
      setCropping(false)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
    }
  }, [open, currentTitle, currentLogo])

  const onCropComplete = useCallback((_, pixels) => {
    setCropAreaPixels(pixels)
  }, [])

  const handleChooseFile = () => fileInputRef.current.click()
  const handleFileChange = async e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setLogoSrc(reader.result)
      setCropping(true)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmCrop = async () => {
    if (cropAreaPixels) {
      const croppedUrl = await getCroppedImg(logoSrc, cropAreaPixels)
      setLogoSrc(croppedUrl)
      setCropping(false)
    }
  }

  const handleCancelCrop = () => {
    setLogoSrc(originalLogo)
    setCropping(false)
  }

  const handleRestore = () => {
    setLogoSrc('/img/logo.png')
  }

  const handleSave = () => {
    const finalTitle = input.trim() || 'Seats Viewer'
    onSave({ title: finalTitle, logo: logoSrc })
    onClose()
  }

  if (!open) return null

  return (
    <div className="modal-backdrop">
      <div className="modal table-form">
        <h3>編輯商家資訊</h3>

        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
          {cropping ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <div
                style={{
                  width: 200,
                  height: 200,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  position: 'relative'
                }}
              >
                <Cropper
                  image={logoSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  restrictPosition={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  style={{ containerStyle: { width: '100%', height: '100%' } }}
                />
              </div>

              <input
                type="range"
                min={0.5}
                max={3}
                step={0.01}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={{ width: 200, cursor: 'pointer' }}
              />
            </div>
          ) : (
            <img
              src={logoSrc}
              alt="logo"
              style={{ display: 'block', margin: '0 auto', maxWidth: '120px' }}
            />
          )}
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          {cropping ? (
            <>
              <button onClick={handleConfirmCrop}
              style={{
                background: '#1976d2',
                color: '#fff',
                fontSize: '0.875rem',
                padding: '0.25rem 0.75rem'
              }}
              >儲存裁切</button>
              <button onClick={handleCancelCrop}
              style={{
                  background: '#ccc',
                  color: '#333',
                  fontSize: '0.875rem',
                  padding: '0.25rem 0.75rem'
                }}
              >取消變更</button>
            </>
          ) : (
            <>
              <button onClick={handleChooseFile}
              style={{
                background: '#1976d2',
                color: '#fff',
                fontSize: '0.875rem',
                padding: '0.25rem 0.75rem'
              }}
              >變更圖片</button>
              <button onClick={handleRestore}
              style={{
                background: '#ccc',
                color: '#333',
                fontSize: '0.875rem',
                padding: '0.25rem 0.75rem'
              }}
              >恢復預設</button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
            </>
          )}
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: '0.5rem',
            marginBottom: '1rem'
          }}
        >
          <span>變更標題</span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Seats Viewer"
          />
        </label>

        <div className="modal-actions">
          <button onClick={handleSave}>儲存</button>
          <button onClick={onClose}>取消</button>
        </div>
      </div>
    </div>
  )
}
