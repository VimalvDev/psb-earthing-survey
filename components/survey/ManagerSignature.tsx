"use client"

import { useRef, useState, useEffect } from "react"
import SignatureCanvas from "react-signature-canvas"
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"
import { FiEdit3, FiCamera, FiTrash2, FiX, FiCheck, FiMaximize2, FiCrop } from "react-icons/fi"

export type SignatureMethod = "draw" | "photo"

export interface ManagerSignatureData {
  method: SignatureMethod
  base64: string
  mimeType: string
}

interface ManagerSignatureProps {
  signature: ManagerSignatureData | null
  onChange: (sig: ManagerSignatureData | null) => void
}

function getBase64(sigCanvas: SignatureCanvas): string {
  return sigCanvas.getTrimmedCanvas().toDataURL("image/png").split(",")[1]
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Renders the selected crop region of an <img> onto a canvas and returns base64 (no data: prefix)
function getCroppedImageBase64(image: HTMLImageElement, crop: PixelCrop, mimeType = "image/jpeg"): string {
  const canvas = document.createElement("canvas")
  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height

  canvas.width = Math.max(1, Math.round(crop.width * scaleX))
  canvas.height = Math.max(1, Math.round(crop.height * scaleY))

  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Could not get canvas context")

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height
  )

  return canvas.toDataURL(mimeType, 0.92).split(",")[1]
}

export function ManagerSignature({ signature, onChange }: ManagerSignatureProps) {
  const [method, setMethod] = useState<SignatureMethod>("draw")
  const [isEmpty, setIsEmpty] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  // Crop flow state
  const [rawPhotoSrc, setRawPhotoSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const cropImgRef = useRef<HTMLImageElement>(null)

  const inlineSigRef = useRef<SignatureCanvas>(null)
  const modalSigRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (modalOpen || rawPhotoSrc) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [modalOpen, rawPhotoSrc])

  function handleStrokeEnd(ref: React.RefObject<SignatureCanvas | null>) {
    if (ref.current && !ref.current.isEmpty()) setIsEmpty(false)
  }

  function handleClear(ref: React.RefObject<SignatureCanvas | null>) {
    ref.current?.clear()
    setIsEmpty(true)
    onChange(null)
  }

  function handleDone(ref: React.RefObject<SignatureCanvas | null>) {
    if (!ref.current || ref.current.isEmpty()) return
    const base64 = getBase64(ref.current)
    onChange({ method: "draw", base64, mimeType: "image/png" })
    setModalOpen(false)
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToBase64(file)
    setRawPhotoSrc(dataUrl)
    setCrop(undefined)
    setCompletedCrop(undefined)
    e.target.value = ""
  }

  function handleCropImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    // Default selection: centered box covering most of the image, user can resize/drag from there
    const initial = centerCrop(
      makeAspectCrop({ unit: "%", width: 80 }, width / height, width, height),
      width,
      height
    )
    setCrop(initial)
  }

  function handleConfirmCrop() {
    if (!cropImgRef.current || !completedCrop || completedCrop.width === 0) return
    const base64 = getCroppedImageBase64(cropImgRef.current, completedCrop, "image/jpeg")
    onChange({ method: "photo", base64, mimeType: "image/jpeg" })
    setRawPhotoSrc(null)
  }

  function handleUseFullPhoto() {
    if (!cropImgRef.current) return
    const fullCrop: PixelCrop = {
      unit: "px",
      x: 0,
      y: 0,
      width: cropImgRef.current.width,
      height: cropImgRef.current.height,
    }
    const base64 = getCroppedImageBase64(cropImgRef.current, fullCrop, "image/jpeg")
    onChange({ method: "photo", base64, mimeType: "image/jpeg" })
    setRawPhotoSrc(null)
  }

  function handleCancelCrop() {
    setRawPhotoSrc(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Manager Signature
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400">Optional</span>
      </div>

      {/* Method selector */}
      {!signature && (
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setMethod("draw"); setIsEmpty(true) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-lg border-2 text-sm font-medium leading-tight transition-all duration-150
              ${method === "draw"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <FiEdit3 size={16} />
            <span>Draw on Screen</span>
          </button>
          <button
            type="button"
            onClick={() => { setMethod("photo"); onChange(null) }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3.5 rounded-lg border-2 text-sm font-medium leading-tight transition-all duration-150
              ${method === "photo"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <FiCamera size={16} />
            <span>Photo of Signature</span>
          </button>
        </div>
      )}

      {/* Draw mode */}
      {!signature && method === "draw" && (
        <div>
          {/* Desktop inline canvas */}
          <div className="hidden lg:block">
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white overflow-hidden">
              <SignatureCanvas
                ref={inlineSigRef}
                penColor="#1a1a1a"
                canvasProps={{ className: "w-full h-44", style: { touchAction: "none" } }}
                onEnd={() => handleStrokeEnd(inlineSigRef)}
              />
            </div>
            <div className="flex items-center justify-between mt-3">
              <button type="button" onClick={() => handleClear(inlineSigRef)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#E41E23] transition-colors duration-150">
                <FiTrash2 size={12} /> Clear
              </button>
              <p className="text-[11px] text-gray-400">Multiple strokes supported</p>
              <button type="button" onClick={() => handleDone(inlineSigRef)} disabled={isEmpty}
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors duration-150">
                <FiCheck size={12} /> Done
              </button>
            </div>
          </div>

          {/* Mobile — tap to open modal */}
          <div className="lg:hidden">
            <button type="button" onClick={() => { setIsEmpty(true); setModalOpen(true) }}
              className="w-full flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-gray-300 transition-colors duration-150">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <FiMaximize2 className="w-5 h-5 text-gray-500" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-700">Tap to sign</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Opens fullscreen signature pad</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Photo mode */}
      {!signature && method === "photo" && (
        <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300 transition-colors duration-150"
          onClick={() => fileInputRef.current?.click()}>
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <FiCamera className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Photo of signed form</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Manager signs on paper → engineer photographs it</p>
          </div>
          <button type="button" className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors duration-150">
            Open Camera / Upload
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoChange} />
        </div>
      )}

      {/* Signature preview */}
      {signature && (
        <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          <img
            src={`data:${signature.mimeType};base64,${signature.base64}`}
            alt="Manager signature"
            className="w-full max-h-44 object-contain p-4"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <span className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
              {signature.method === "draw" ? "Drawn" : "Photographed"}
            </span>
            <button type="button"
              onClick={() => { onChange(null); setIsEmpty(true); inlineSigRef.current?.clear() }}
              className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#E41E23] hover:border-[#E41E23] transition-colors duration-150">
              <FiX size={11} />
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen Modal — Draw signature ── */}
      {modalOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">Manager Signature</p>
              <p className="text-[11px] text-gray-400">Sign using multiple strokes · tap Done when finished</p>
            </div>
            <button type="button"
              onClick={() => { setModalOpen(false); setIsEmpty(true) }}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
              <FiX size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
            <div className="relative w-full max-w-md aspect-[16/10] bg-white rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden shadow-sm">
              <SignatureCanvas
                ref={modalSigRef}
                penColor="#1a1a1a"
                velocityFilterWeight={0.7}
                minWidth={1.5}
                maxWidth={3}
                canvasProps={{
                  className: "w-full h-full absolute inset-0",
                  style: { touchAction: "none" },
                }}
                onEnd={() => handleStrokeEnd(modalSigRef)}
              />
              {isEmpty && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <p className="text-gray-300 text-xl font-light select-none tracking-widest">Sign here</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white shrink-0">
            <button type="button" onClick={() => handleClear(modalSigRef)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#E41E23] border border-gray-200 px-4 py-2.5 rounded-xl transition-colors duration-150">
              <FiTrash2 size={14} /> Clear
            </button>
            <button type="button" onClick={() => handleDone(modalSigRef)} disabled={isEmpty}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-xl transition-colors duration-150">
              <FiCheck size={14} /> Done — Save Signature
            </button>
          </div>
        </div>
      )}

      {/* ── Fullscreen Modal — Crop captured photo ── */}
      {rawPhotoSrc && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <div>
              <p className="text-sm font-semibold text-gray-900">Crop to signature</p>
              <p className="text-[11px] text-gray-400">Drag the box edges to select just the manager's signature</p>
            </div>
            <button type="button" onClick={handleCancelCrop}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
              <FiX size={16} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 sm:p-6 bg-gray-50 overflow-auto">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              className="max-w-full max-h-full"
            >
              <img
                ref={cropImgRef}
                src={rawPhotoSrc}
                alt="Captured form"
                onLoad={handleCropImageLoad}
                className="max-w-full max-h-[65vh] object-contain"
              />
            </ReactCrop>
          </div>

          <div className="flex items-center gap-3 px-4 py-3 border-t border-gray-100 bg-white shrink-0">
            <button type="button" onClick={handleUseFullPhoto}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl transition-colors duration-150">
              Use Full Photo
            </button>
            <button
              type="button"
              onClick={handleConfirmCrop}
              disabled={!completedCrop || completedCrop.width === 0}
              className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed py-2.5 rounded-xl transition-colors duration-150">
              <FiCrop size={14} /> Crop & Save
            </button>
          </div>
        </div>
      )}
    </section>
  )
}