"use client"

import { useRef, useState, useEffect } from "react"
import { FiEdit3, FiCamera, FiTrash2, FiX } from "react-icons/fi"

export type SignatureMethod = "draw" | "photo"

export interface ManagerSignatureData {
  method: SignatureMethod
  base64: string  // PNG for draw, image for photo
  mimeType: string
}

interface ManagerSignatureProps {
  signature: ManagerSignatureData | null
  onChange: (sig: ManagerSignatureData | null) => void
}

export function ManagerSignature({ signature, onChange }: ManagerSignatureProps) {
  const [method, setMethod] = useState<SignatureMethod>("draw")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Canvas drawing logic ─────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas actual dimensions to match display size (for sharp lines)
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [method])

  function getCanvasPoint(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    isDrawingRef.current = true
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCanvasPoint(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!isDrawingRef.current) return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const { x, y } = getCanvasPoint(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  function endDraw() {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    // Save canvas as base64
    const canvas = canvasRef.current
    if (!canvas) return
    const base64 = canvas.toDataURL("image/png").split(",")[1]
    onChange({ method: "draw", base64, mimeType: "image/png" })
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    onChange(null)
  }

  // ── Photo upload ─────────────────────────────────────────────────────────

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
            onClick={() => setMethod("draw")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150
              ${method === "draw"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            <FiEdit3 size={14} />
            Draw on Screen
          </button>
          <button
            type="button"
            onClick={() => setMethod("photo")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-medium transition-all duration-150
              ${method === "photo"
                ? "border-gray-900 bg-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
          >
            <FiCamera size={14} />
            Photo of Signature
          </button>
        </div>
      )}

      {/* Draw mode */}
      {!signature && method === "draw" && (
        <div>
          <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden touch-none">
            <canvas
              ref={canvasRef}
              className="w-full h-40 cursor-crosshair"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[11px] text-gray-400">Manager signs in the box above</p>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-[#E41E23] transition-colors duration-150"
            >
              <FiTrash2 size={11} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Photo mode */}
      {!signature && method === "photo" && (
        <div
          className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-gray-300 transition-colors duration-150"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <FiCamera className="w-5 h-5 text-gray-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">Photo of signed form</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Manager signs on paper → engineer photographs it
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors duration-150"
          >
            Open Camera / Upload
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>
      )}

      {/* Signature preview — shown after either method is completed */}
      {signature && (
        <div className="relative rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
          <img
            src={`data:${signature.mimeType};base64,${signature.base64}`}
            alt="Manager signature"
            className="w-full max-h-40 object-contain p-4"
          />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <span className="text-[10px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-1 rounded-full">
              {signature.method === "draw" ? "Drawn" : "Photographed"}
            </span>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-[#E41E23] hover:border-[#E41E23] transition-colors duration-150"
            >
              <FiX size={11} />
            </button>
          </div>
        </div>
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