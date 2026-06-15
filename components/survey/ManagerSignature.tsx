"use client"

import { useRef, useState, useEffect } from "react"
import SignatureCanvas from "react-signature-canvas"
import { FiEdit3, FiCamera, FiTrash2, FiX, FiCheck, FiMaximize2 } from "react-icons/fi"

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

export function ManagerSignature({ signature, onChange }: ManagerSignatureProps) {
  const [method, setMethod] = useState<SignatureMethod>("draw")
  const [isEmpty, setIsEmpty] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  const inlineSigRef = useRef<SignatureCanvas>(null)
  const modalSigRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [modalOpen])

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
    const base64 = await fileToBase64(file)
    onChange({ method: "photo", base64, mimeType: file.type })
    e.target.value = ""
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
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150
              ${method === "draw"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <FiEdit3 size={14} />
            Draw on Screen
          </button>
          <button
            type="button"
            onClick={() => { setMethod("photo"); onChange(null) }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150
              ${method === "photo"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
          >
            <FiCamera size={14} />
            Photo of Signature
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
                <p className="text-[11px] text-gray-400 mt-0.5">Opens fullscreen landscape pad</p>
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

      {/* ── Fullscreen Modal — entire UI rotated 90° for landscape feel ── */}
      {modalOpen && (
        <>
          {/* Backdrop covers real screen */}
          <div className="lg:hidden fixed inset-0 z-50 bg-white" />

          {/* Rotated container — positioned to fill screen in landscape orientation */}
          <div
            className="lg:hidden fixed z-50"
            style={{
              // Rotate the whole modal 90° clockwise
              // Position it so it fills the screen after rotation
              top: "50%",
              left: "50%",
              width: "100vh",   // after rotation, width becomes screen height
              height: "100vw",  // after rotation, height becomes screen width
              transform: "translate(-50%, -50%) rotate(90deg)",
              transformOrigin: "center center",
              display: "flex",
              flexDirection: "column",
              background: "white",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">Manager Signature</p>
                <p className="text-[11px] text-gray-400">Sign using multiple strokes · tap Done when finished</p>
              </div>
              <button type="button"
                onClick={() => { setModalOpen(false); setIsEmpty(true) }}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                <FiX size={16} />
              </button>
            </div>

            {/* Canvas — fills remaining space */}
            <div className="flex-1 relative bg-white">
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
                  <p className="text-gray-200 text-2xl font-light select-none tracking-widest">Sign here</p>
                </div>
              )}
            </div>

            {/* Bottom action bar */}
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
        </>
      )}
    </section>
  )
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}