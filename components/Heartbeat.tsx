"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function Heartbeat() {
  const supabase = createClient()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Only start if we are authenticated
    const checkAuthAndPing = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        fetch('/api/heartbeat', { method: 'POST' }).catch(console.error)
      }
    }

    const startPinging = () => {
      if (!intervalRef.current) {
        checkAuthAndPing()
        // Ping every 15 seconds while active
        intervalRef.current = setInterval(checkAuthAndPing, 15000)
      }
    }

    const stopPinging = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        startPinging()
      } else {
        stopPinging()
      }
    }

    // Start immediately if visible
    if (document.visibilityState === 'visible') {
      startPinging()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopPinging()
    }
  }, [])

  return null // This is a silent background component
}
