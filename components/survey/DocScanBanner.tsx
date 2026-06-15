"use client"

import { useRef, useState } from "react"
import { FiFileText, FiUpload, FiLoader, FiCheckCircle, FiAlertTriangle } from "react-icons/fi"

interface DocScanBannerProps {
  // Parent provides this callback — receives the parsed fields from OCR
  onFieldsExtracted: (fields: Record<string, string>) => void
}

type ScanState = "idle" | "uploading" | "processing" | "done" | "error"

export function DocScanBanner({ onFieldsExtracted }: DocScanBannerProps) {
  const [scanState, setScanState] = useState<ScanState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file (JPG, PNG, WEBP)")
      setScanState("error")
      return
    }

    setScanState("uploading")
    setErrorMsg("")

    // Convert to base64
    const base64 = await fileToBase64(file)

    setScanState("processing")

    try {
      const res = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      })

      if (!res.ok) throw new Error("OCR request failed")

      const { fields } = await res.json()
      onFieldsExtracted(fields)
      setScanState("done")
    } catch (err) {
      setErrorMsg("Could not read document. Please fill the form manually.")
      setScanState("error")
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 mb-5 transition-colors duration-150
        ${scanState === "done"
          ? "border-[#027D3F]/40 bg-[#027D3F]/5"
          : scanState === "error"
          ? "border-[#E41E23]/40 bg-[#E41E23]/5"
          : "border-gray-200 bg-white hover:border-[#185FA5]/40 hover:bg-[#E6F1FB]/30"
        }`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0
          ${scanState === "done" ? "bg-[#027D3F]/10" : "bg-[#E6F1FB]"}`}
        >
          {scanState === "processing" || scanState === "uploading" ? (
            <FiLoader className="w-4 h-4 text-[#185FA5] animate-spin" />
          ) : scanState === "done" ? (
            <FiCheckCircle className="w-4 h-4 text-[#027D3F]" />
          ) : scanState === "error" ? (
            <FiAlertTriangle className="w-4 h-4 text-[#E41E23]" />
          ) : (
            <FiFileText className="w-4 h-4 text-[#185FA5]" />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">
            {scanState === "idle" && "Have a paper form? Scan to auto-fill"}
            {scanState === "uploading" && "Uploading image..."}
            {scanState === "processing" && "Reading document with AI..."}
            {scanState === "done" && "Fields auto-filled — please review and correct"}
            {scanState === "error" && "Scan failed"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {scanState === "idle" && "Photo or scan of handwritten/printed form → AI reads it → fields filled automatically"}
            {scanState === "uploading" && "Please wait"}
            {scanState === "processing" && "Claude Vision is extracting field values"}
            {scanState === "done" && "Review all fields carefully before submitting"}
            {scanState === "error" && errorMsg}
          </p>
        </div>

        {/* Action */}
        {(scanState === "idle" || scanState === "error") && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 flex items-center gap-1.5 text-xs font-medium text-[#185FA5] bg-[#E6F1FB] hover:bg-[#185FA5] hover:text-white px-3 py-2 rounded-lg transition-colors duration-150"
          >
            <FiUpload size={12} />
            Upload / Capture
          </button>
        )}
        {scanState === "done" && (
          <button
            type="button"
            onClick={() => setScanState("idle")}
            className="shrink-0 text-xs text-gray-400 hover:text-gray-600 transition-colors duration-150"
          >
            Scan again
          </button>
        )}
      </div>

      {/* Hidden file input — accepts images, triggers camera on mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}

// Utility: File → base64 string (strips data URL prefix)
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(",")[1]) // strip "data:image/jpeg;base64,"
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}