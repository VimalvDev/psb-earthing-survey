"use client"

import { useRef, useState } from "react"
import { FiCamera, FiX, FiImage, FiLoader } from "react-icons/fi"
import { createClient } from "@/lib/supabase/client"

// ── Types ──────────────────────────────────────────────────────────────────

export interface CapturedPhoto {
  label: "form" | "site" | "other"
  url: string       // Supabase Storage public URL
  previewUrl: string // local blob URL for preview
}

interface PhotoSlot {
  key: "form" | "site" | "other"
  label: string
  hint: string
  required: boolean
}

const SLOTS: PhotoSlot[] = [
  {
    key: "form",
    label: "Form Photo",
    hint: "Capture the physical inspection form",
    required: true,
  },
  {
    key: "site",
    label: "Site Photo",
    hint: "Capture the earthing site / earth pit area",
    required: false,
  },
  {
    key: "other",
    label: "Additional Photo",
    hint: "Any other relevant site evidence",
    required: false,
  },
]

interface PhotoCaptureProps {
  surveyId: string
  photos: Record<string, string>   // { form: url, site: url, other: url }
  onChange: (photos: Record<string, string>) => void
}

// ── Compression ────────────────────────────────────────────────────────────

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Target max dimension 1200px, quality 0.75 → ~150-200KB
      const MAX = 1200
      let { width, height } = img

      if (width > MAX || height > MAX) {
        if (width > height) {
          height = Math.round((height * MAX) / width)
          width = MAX
        } else {
          width = Math.round((width * MAX) / height)
          height = MAX
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas context unavailable")); return }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Compression failed"))
        },
        "image/jpeg",
        0.75
      )
    }

    img.onerror = () => reject(new Error("Image load failed"))
    img.src = objectUrl
  })
}

// ── Component ──────────────────────────────────────────────────────────────

export function PhotoCapture({ surveyId, photos, onChange }: PhotoCaptureProps) {
  const supabase = createClient()
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})

  async function handleFileChange(
    slot: PhotoSlot,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so same file can be re-selected
    e.target.value = ""

    setErrors((prev) => ({ ...prev, [slot.key]: "" }))
    setUploading((prev) => ({ ...prev, [slot.key]: true }))

    try {
      // Compress
      const compressed = await compressImage(file)

      // Local preview
      const previewUrl = URL.createObjectURL(compressed)
      setPreviews((prev) => ({ ...prev, [slot.key]: previewUrl }))

      // Upload to Supabase Storage
      const path = `${surveyId}/${slot.key}-${Date.now()}.jpg`
      const { error: uploadError } = await supabase.storage
        .from("survey-photos")
        .upload(path, compressed, { contentType: "image/jpeg", upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase.storage
        .from("survey-photos")
        .getPublicUrl(path)

      onChange({ ...photos, [slot.key]: data.publicUrl })
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [slot.key]: "Upload failed. Please try again.",
      }))
      setPreviews((prev) => ({ ...prev, [slot.key]: "" }))
    } finally {
      setUploading((prev) => ({ ...prev, [slot.key]: false }))
    }
  }

  function handleRemove(slot: PhotoSlot) {
    const updated = { ...photos }
    delete updated[slot.key]
    onChange(updated)
    setPreviews((prev) => {
      const next = { ...prev }
      if (next[slot.key]) URL.revokeObjectURL(next[slot.key])
      delete next[slot.key]
      return next
    })
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-5">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Site Photos
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400">
          {Object.keys(photos).length} / 3
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {SLOTS.map((slot) => {
          const isUploading = uploading[slot.key]
          const preview = previews[slot.key] || photos[slot.key]
          const hasPhoto = !!preview
          const error = errors[slot.key]

          return (
            <div key={slot.key}>
              {hasPhoto ? (
                // ── Preview card ─────────────────────────────────────────
                <div className="relative rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                  <img
                    src={preview}
                    alt={slot.label}
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <FiImage size={12} className="text-white/80" />
                      <span className="text-xs font-medium text-white">
                        {slot.label}
                      </span>
                      {slot.required && (
                        <span className="text-[10px] text-white/60">(required)</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(slot)}
                      className="w-6 h-6 rounded-full bg-black/40 hover:bg-[#E41E23]/80 flex items-center justify-center transition-colors"
                    >
                      <FiX size={12} className="text-white" />
                    </button>
                  </div>
                </div>
              ) : (
                // ── Upload button ─────────────────────────────────────────
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => inputRefs.current[slot.key]?.click()}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-lg border-2 border-dashed transition-colors
                    ${isUploading
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed"
                      : "border-gray-200 hover:border-[#027D3F]/40 hover:bg-[#027D3F]/5 cursor-pointer"
                    }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                    ${slot.required ? "bg-[#027D3F]/10" : "bg-gray-100"}`}
                  >
                    {isUploading ? (
                      <FiLoader size={16} className="text-[#027D3F] animate-spin" />
                    ) : (
                      <FiCamera
                        size={16}
                        className={slot.required ? "text-[#027D3F]" : "text-gray-400"}
                      />
                    )}
                  </div>
                  <div className="text-left">
                    <p className={`text-sm font-semibold ${slot.required ? "text-gray-800" : "text-gray-500"}`}>
                      {isUploading ? "Compressing & uploading..." : slot.label}
                      {slot.required && !isUploading && (
                        <span className="ml-1 text-[#E41E23] text-xs">*</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{slot.hint}</p>
                  </div>
                </button>
              )}

              {error && (
                <p className="text-[11px] text-[#E41E23] mt-1 px-1">{error}</p>
              )}

              <input
                ref={(el) => { inputRefs.current[slot.key] = el }}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileChange(slot, e)}
              />
            </div>
          )
        })}
      </div>

      <p className="text-[11px] text-gray-400 mt-4 text-center">
        Photos are compressed to ~150–200 KB before upload
      </p>
    </section>
  )
}