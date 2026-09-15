"use client"

import { FiMonitor, FiLoader, FiLogOut } from "react-icons/fi"
import { useUserActivity, useRevokeSession, type UserActivity } from "@/components/admin/hooks"
import { useState, useEffect } from "react"

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

export default function ActiveSessionsCard() {
  const { data: users, isLoading } = useUserActivity()
  const revoke = useRevokeSession()
  const [tick, setTick] = useState(0)

  // Force re-renders every 5 seconds to keep status indicators fresh
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 5000)
    return () => clearInterval(interval)
  }, [])

  const onlineCount = users?.filter((u) => {
    const lastSeen = u.last_seen_at ? new Date(u.last_seen_at).getTime() : 0
    return lastSeen > 0 && Date.now() - lastSeen < 30000
  }).length ?? 0

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FiMonitor size={15} className="text-[#027D3F]" />
        <h3 className="font-semibold text-gray-900">User Activity</h3>
        <span className="text-xs text-gray-400 ml-auto">
          {onlineCount > 0 && <span className="text-green-600 font-medium">{onlineCount} online · </span>}
          {users?.length ?? 0} users
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <FiLoader size={16} className="animate-spin mr-2" /> Loading…
        </div>
      ) : !users?.length ? (
        <div className="py-12 text-center text-sm text-gray-400">No user activity yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRowItem 
                  key={u.id} 
                  user={u} 
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

function UserRowItem({
  user, revokeMutation
}: { user: UserActivity; revokeMutation: ReturnType<typeof useRevokeSession> }) {
  const [isRevoking, setIsRevoking] = useState(false)
  
  const handleRevoke = async () => {
    setIsRevoking(true)
    try {
      for (const sid of user.session_ids) {
        await revokeMutation.mutateAsync(sid)
      }
    } catch (err) {
      console.error("Failed to revoke session", err)
    } finally {
      setIsRevoking(false)
    }
  }

  const displayName = user.name || (user.role === 'visitor' ? 'Visitor' : null) || user.email || "Unknown User"
  const displaySubtitle = user.email || (user.role ? `Role: ${user.role}` : "No email")

  const lastSeenDate = user.last_seen_at ? new Date(user.last_seen_at).getTime() : 0
  const isOnline = lastSeenDate > 0 && Date.now() - lastSeenDate < 30000
  
  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} title={isOnline ? "Online" : "Offline"} />
          <div>
            <p className="font-medium text-gray-900">{displayName}</p>
            <p className="text-xs text-gray-400">{displaySubtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-5 py-3.5 text-xs">
        {isOnline ? (
          <span className="text-green-600 font-medium">Online</span>
        ) : (
          <span className="text-gray-500">{timeAgo(user.last_seen_at)}</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right">
        {user.has_active_session && (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="text-xs font-medium text-[#A32D2D] hover:underline flex items-center gap-1.5 disabled:opacity-50 ml-auto"
          >
            <FiLogOut size={13} /> {isRevoking ? "Revoking..." : "Revoke"}
          </button>
        )}
      </td>
    </tr>
  )
}