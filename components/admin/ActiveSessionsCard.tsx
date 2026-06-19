"use client"

import { FiMonitor, FiLoader, FiLogOut, FiServer } from "react-icons/fi"
import { useActiveSessions, useRevokeSession, type SessionRow } from "@/components/admin/hooks"

function parseDevice(ua: string | null) {
  if (!ua) return { label: "Unknown device", isServer: false }
  if (ua.includes("Vercel Edge")) return { label: "Server (middleware token refresh)", isServer: true }

  const isMobile = /Mobile|Android|iPhone/.test(ua)
  let browser = "Unknown browser"
  if (ua.includes("Edg/")) browser = "Edge"
  else if (ua.includes("Chrome/")) browser = "Chrome"
  else if (ua.includes("Firefox/")) browser = "Firefox"
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari"

  let os = ""
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS")) os = "macOS"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"
  else if (ua.includes("Linux")) os = "Linux"

  return {
    label: [browser, os, isMobile ? "Mobile" : null].filter(Boolean).join(" · "),
    isServer: false,
  }
}

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
  const { data: sessions, isLoading } = useActiveSessions()
  const revoke = useRevokeSession()

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FiMonitor size={15} className="text-[#027D3F]" />
        <h3 className="font-semibold text-gray-900">Active Sessions</h3>
        <span className="text-xs text-gray-400 ml-auto">{sessions?.length ?? 0} active</span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <FiLoader size={16} className="animate-spin mr-2" /> Loading sessions…
        </div>
      ) : !sessions?.length ? (
        <div className="py-12 text-center text-sm text-gray-400">No active sessions.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">
                <th className="px-5 py-3">User</th>
                <th className="px-5 py-3">Device</th>
                <th className="px-5 py-3">IP</th>
                <th className="px-5 py-3">Logged in</th>
                <th className="px-5 py-3">Last active</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {sessions.map((s) => (
                <SessionRowItem key={s.session_id} session={s} onRevoke={() => revoke.mutate(s.session_id)} isRevoking={revoke.isPending} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function SessionRowItem({
  session, onRevoke, isRevoking,
}: { session: SessionRow; onRevoke: () => void; isRevoking: boolean }) {
  const device = parseDevice(session.user_agent)

  return (
    <tr className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors">
      <td className="px-5 py-3.5">
        <p className="font-medium text-gray-900">{session.name ?? session.email ?? "Unknown"}</p>
        <p className="text-xs text-gray-400">{session.email}</p>
      </td>
      <td className="px-5 py-3.5 text-gray-600">
        <span className="flex items-center gap-1.5">
          {device.isServer ? <FiServer size={13} className="text-gray-400" /> : <FiMonitor size={13} className="text-gray-400" />}
          {device.label}
        </span>
      </td>
      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">{session.ip ?? "—"}</td>
      <td className="px-5 py-3.5 text-gray-500 text-xs">{timeAgo(session.created_at)}</td>
      <td className="px-5 py-3.5 text-gray-500 text-xs">{timeAgo(session.refreshed_at)}</td>
      <td className="px-5 py-3.5 text-right">
        {!device.isServer && (
          <button
            onClick={onRevoke}
            disabled={isRevoking}
            className="text-xs font-medium text-[#A32D2D] hover:underline flex items-center gap-1.5 disabled:opacity-50 ml-auto"
          >
            <FiLogOut size={13} /> Revoke
          </button>
        )}
      </td>
    </tr>
  )
}