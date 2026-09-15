"use client"

import { FiMonitor, FiLoader, FiLogOut } from "react-icons/fi"
import { useActiveSessions, useRevokeSession, type SessionRow } from "@/components/admin/hooks"
import { useMemo, useState, useEffect } from "react"

function timeAgo(iso: string | null) {
  if (!iso) return "—"
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

type AggregatedSession = SessionRow & {
  all_session_ids: string[]
}

export default function ActiveSessionsCard() {
  const { data: rawSessions, isLoading } = useActiveSessions()
  const revoke = useRevokeSession()
  const [tick, setTick] = useState(0)

  // Force re-renders every 5 seconds to keep "Online" and "timeAgo" indicators perfectly fresh locally
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  const sessions = useMemo(() => {
    if (!rawSessions) return []
    const userMap = new Map<string, AggregatedSession>()
    
    for (const s of rawSessions) {
      const key = s.user_id || s.session_id
      const existing = userMap.get(key)
      
      if (!existing) {
        userMap.set(key, { ...s, all_session_ids: [s.session_id] })
      } else {
        existing.all_session_ids.push(s.session_id)
        
        const currentRefreshed = existing.refreshed_at ? new Date(existing.refreshed_at).getTime() : 0
        const newRefreshed = s.refreshed_at ? new Date(s.refreshed_at).getTime() : 0
        if (newRefreshed > currentRefreshed) {
          existing.refreshed_at = s.refreshed_at
        }
        
        const currentCreated = existing.created_at ? new Date(existing.created_at).getTime() : 0
        const newCreated = s.created_at ? new Date(s.created_at).getTime() : 0
        if (newCreated > currentCreated) {
          existing.created_at = s.created_at
        }
        
        existing.name = existing.name || s.name
        existing.email = existing.email || s.email
        existing.role = existing.role || s.role
        if (s.last_seen_at) {
          const currentLastSeen = existing.last_seen_at ? new Date(existing.last_seen_at).getTime() : 0
          const newLastSeen = new Date(s.last_seen_at).getTime()
          if (newLastSeen > currentLastSeen) {
            existing.last_seen_at = s.last_seen_at
          }
        }
      }
    }
    
    return Array.from(userMap.values()).sort((a, b) => {
      const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : (a.refreshed_at ? new Date(a.refreshed_at).getTime() : 0)
      const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : (b.refreshed_at ? new Date(b.refreshed_at).getTime() : 0)
      return bTime - aTime
    })
  }, [rawSessions])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FiMonitor size={15} className="text-[#027D3F]" />
        <h3 className="font-semibold text-gray-900">Active Sessions</h3>
        <span className="text-xs text-gray-400 ml-auto">{sessions.length} active</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <FiLoader size={16} className="animate-spin mr-2" /> Loading sessions…
        </div>
      ) : !sessions.length ? (
        <div className="py-12 text-center text-sm text-gray-400">No active sessions.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Logged in</th>
                <th className="px-5 py-3">Last active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <SessionRowItem 
                  key={s.user_id || s.session_id} 
                  session={s} 
                  revokeMutation={revoke} 
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SessionRowItem({
  session, revokeMutation
}: { session: AggregatedSession; revokeMutation: ReturnType<typeof useRevokeSession> }) {
  const [isRevoking, setIsRevoking] = useState(false)
  
  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      for (const sid of session.all_session_ids) {
        await revokeMutation.mutateAsync(sid)
      }
    } catch (err) {
      console.error("Failed to revoke session", err)
    } finally {
      setIsRevoking(false)
    }
  }

  const displayName = session.name || (session.role === 'visitor' ? 'Visitor' : null) || session.email || "Unknown User"
  const displaySubtitle = session.email || (session.role ? `Role: ${session.role}` : "No email")

  // Use heartbeat first, fallback to refreshed_at if heartbeat is null/older
  const refreshedDate = session.refreshed_at ? new Date(session.refreshed_at).getTime() : 0;
  const lastSeenDate = session.last_seen_at ? new Date(session.last_seen_at).getTime() : 0;
  const bestDate = Math.max(refreshedDate, lastSeenDate);
  
  // If they have a last_seen_at heartbeat, give them a 30 second window.
  // If they only have refreshed_at (maybe old session), give them a 5 min window.
  const isOnline = bestDate > 0 && (
    (lastSeenDate > 0 && Date.now() - lastSeenDate < 30000) || 
    (lastSeenDate === 0 && Date.now() - refreshedDate < 300000)
  );
  
  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} title={isOnline ? "Online" : "Offline"} />
          <div>
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-400">{displaySubtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-gray-500 text-xs">{timeAgo(session.created_at)}</td>
      <td className="px-5 py-3.5 text-gray-500 text-xs">
        {isOnline ? (
          <span className="text-green-600 font-medium">Online</span>
        ) : (
          timeAgo(bestDate > 0 ? new Date(bestDate).toISOString() : session.refreshed_at)
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        <button
          onClick={handleRevoke}
          disabled={isRevoking}
          className="text-xs font-medium text-[#A32D2D] hover:underline flex items-center gap-1.5 disabled:opacity-50 ml-auto"
        >
          <FiLogOut size={13} /> {isRevoking ? "Revoking..." : "Revoke"}
        </button>
      </td>
    </tr>
  )
}