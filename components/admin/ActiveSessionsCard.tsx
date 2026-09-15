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

  const onlineCount = users?.filter((u) => {
    const lastSeen = u.last_seen_at ? new Date(u.last_seen_at).getTime() : 0
    return lastSeen > 0 && Date.now() - lastSeen < 30000
  }).length ?? 0

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
        <FiMonitor size={14} className="text-gray-500" />
        <h3 className="text-[12px] font-bold text-gray-500 uppercase tracking-widest">User Activity</h3>
        <span className="text-[11px] text-gray-400 font-medium ml-auto">
          {onlineCount > 0 && <span className="text-[#027D3F] font-semibold">{onlineCount} online <span className="mx-1 text-gray-300">•</span> </span>}
          {users?.length ?? 0} active users
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10 text-gray-400">
          <FiLoader size={14} className="animate-spin mr-2" /> Loading…
        </div>
      ) : !users?.length ? (
        <div className="py-10 text-center text-[13px] text-gray-400">No user activity yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
    <tr className="border-b border-gray-100 last:border-0 hover:bg-gray-50/60 transition-colors group">
      <td className="px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center justify-center w-4 shrink-0">
            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-[#027D3F]' : 'bg-gray-300'}`} title={isOnline ? "Online" : "Offline"} />
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-[13px]">{displayName}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{displaySubtitle}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-2.5 text-[11px]">
        {isOnline ? (
          <span className="text-[#027D3F] font-semibold">Online</span>
        ) : (
          <span className="text-gray-500">{timeAgo(user.last_seen_at)}</span>
        )}
      </td>
      <td className="px-4 py-2.5 text-right">
        {user.has_active_session && (
          <button
            onClick={handleRevoke}
            disabled={isRevoking}
            className="text-[11px] font-semibold text-[#D81F26] hover:underline flex items-center gap-1 disabled:opacity-50 ml-auto opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
          >
            <FiLogOut size={12} /> {isRevoking ? "Revoking..." : "Revoke"}
          </button>
        )}
      </td>
    </tr>
  )
}