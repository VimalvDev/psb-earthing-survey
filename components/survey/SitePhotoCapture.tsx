"use client"

import { useRef, useState } from "react"
import { FiCamera, FiMapPin, FiX, FiLoader, FiAlertCircle } from "react-icons/fi"

interface SitePhotoCaptureProps {
  photo: SitePhoto | null
  onChange: (photo: SitePhoto | null) => void
}

export interface SitePhoto {
  base64: string
  mimeType: string
  timestamp: string
  latitude: number | null
  longitude: number | null
  altitude: number | null
}

export function SitePhotoCapture({ photo, onChange }: SitePhotoCaptureProps) {
  const [geoError, setGeoError] = useState("")
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleCapture(file: File) {
    setLoading(true)
    setGeoError("")

    const base64 = await fileToBase64(file)
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true,
    })

    // Try to get GPS coordinates
    let latitude: number | null = null
    let longitude: number | null = null
    let altitude: number | null = null

    try {
      const pos = await getPosition()
      latitude = parseFloat(pos.coords.latitude.toFixed(6))
      longitude = parseFloat(pos.coords.longitude.toFixed(6))
      altitude = pos.coords.altitude ? parseFloat(pos.coords.altitude.toFixed(1)) : null
    } catch {
      setGeoError("Location unavailable — photo saved without GPS data")
    }

    onChange({ base64, mimeType: file.type, timestamp, latitude, longitude, altitude })
    setLoading(false)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleCapture(file)
    // Reset input so same file can be re-selected
    e.target.value = ""
  }

  return (
    <section className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Site Photo
        </h2>
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-[11px] text-gray-400">Optional</span>
      </div>

      {!photo ? (
        /* Empty state */
        <div
          className="flex flex-col items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 cursor-pointer hover:border-[#185FA5]/40 hover:bg-[#E6F1FB]/20 transition-colors duration-150"
          onClick={() => fileInputRef.current?.click()}
        >
          {loading ? (
            <FiLoader className="w-6 h-6 text-gray-400 animate-spin" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#E6F1FB] flex items-center justify-center">
              <FiCamera className="w-5 h-5 text-[#185FA5]" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-700">
              {loading ? "Getting location..." : "Capture site photo"}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              GPS coordinates, altitude & timestamp will be saved automatically
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-[#185FA5] bg-[#E6F1FB] hover:bg-[#185FA5] hover:text-white px-4 py-2 rounded-lg transition-colors duration-150"
            disabled={loading}
          >
            <FiCamera className="inline mr-1.5 -mt-0.5" size={12} />
            Open Camera
          </button>
        </div>
      ) : (
        /* Photo preview with overlay */
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          <img
            src={`data:${photo.mimeType};base64,${photo.base64}`}
            alt="Site photo"
            className="w-full object-cover max-h-64"
          />

          {/* GPS overlay — bottom right, mimics inspection photo style */}
          <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[10px] font-mono px-3 py-2 rounded-tl-xl leading-relaxed">
            <div className="flex items-center gap-1">
              <FiMapPin size={9} />
              {photo.latitude !== null
                ? `${photo.latitude}° N, ${photo.longitude}° E`
                : "GPS unavailable"}
            </div>
            {photo.altitude !== null && (
              <div>Alt: {photo.altitude} m</div>
            )}
            <div>{photo.timestamp}</div>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors duration-150"
          >
            <FiX size={13} />
          </button>

          {/* Retake */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute top-2 left-2 flex items-center gap-1.5 text-[11px] font-medium text-white bg-black/50 hover:bg-black/70 px-2.5 py-1.5 rounded-lg transition-colors duration-150"
          >
            <FiCamera size={11} />
            Retake
          </button>
        </div>
      )}

      {/* Geo error */}
      {geoError && (
        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#8A9C08]">
          <FiAlertCircle size={11} />
          {geoError}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
    </section>
  )
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 8000,
    })
  })
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(",")[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}