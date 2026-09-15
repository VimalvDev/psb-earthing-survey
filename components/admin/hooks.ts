"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export type Role = "admin" | "manager" | "engineer" | "visitor"

export type Engineer = {
  id: string
  name: string
  emp_id: string
  designation: string
  email: string | null
  mobile_number: string | null
  role: Role
  allowed_years?: string[]
  created_at: string
}

const supabase = createClient()

// ── Current user's role — used to gate the page ─────────────────────────────
export function useCurrentRole() {
  return useQuery({
    queryKey: ["admin", "current-role"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) return null

      const { data, error } = await supabase
        .from("engineers")
        .select("id, role")
        .or(`email.eq.${user.email},gmail.eq.${user.email}`)
        .single()

      if (error || !data) return null
      return data as Pick<Engineer, "id" | "role">
    },
    staleTime: 60_000,
  })
}

// ── All users ────────────────────────────────────────────────────────────
export function useAllUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engineers")
        .select("id, name, emp_id, designation, email, mobile_number, role, allowed_years, created_at")
        .order("name", { ascending: true })

      if (error) throw error
      return data as Engineer[]
    },
    staleTime: 60_000,
  })
}

// ── Update a user's role ─────────────────────────────────────────────────
export function useUpdateRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: Role }) => {
      const { data, error } = await supabase
        .from("engineers")
        .update({ role })
        .eq("id", id)
        .select()

      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Update blocked — likely an RLS policy issue. Check that the 'Admins can update roles' policy exists on the engineers table.")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to update role")
    },
  })
}

// ── Update a user's allowed financial years ──────────────────────────────
export function useUpdateAllowedYears() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, allowed_years }: { id: string; allowed_years: string[] }) => {
      const { data, error } = await supabase
        .from("engineers")
        .update({ allowed_years })
        .eq("id", id)
        .select()

      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error("Update blocked — likely an RLS policy issue.")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
    onError: (err) => {
      alert(err instanceof Error ? err.message : "Failed to update allowed years")
    },
  })
}

// ── Directly set another user's password (admin only) ────────────────────
export function useSetUserPassword() {
  return useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      const res = await fetch("/api/admin/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to update password")
      return data
    },
  })
}

// ── Change own password (logged-in user) ─────────────────────────────────
export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
    },
  })
}

export type SessionRow = {
  session_id: string
  user_id: string
  email: string | null
  name: string | null
  emp_id: string | null
  role: Role | null
  created_at: string
  refreshed_at: string | null
  not_after: string | null
  user_agent: string | null
  ip: string | null
  last_seen_at?: string | null
}

export type UserActivity = {
  id: string
  name: string | null
  email: string | null
  role: Role | null
  last_seen_at: string | null
  has_active_session: boolean
  session_ids: string[]
  logged_in_at: string | null
}

export function useUserActivity() {
  return useQuery({
    queryKey: ["admin", "user-activity"],
    queryFn: async () => {
      // Fetch both in parallel
      const [sessionsRes, engineersRes] = await Promise.all([
        supabase.rpc("get_active_sessions"),
        supabase.from("engineers").select("id, name, email, role, last_seen_at"),
      ])

      const sessions = (sessionsRes.data ?? []) as SessionRow[]
      const engineers = (engineersRes.data ?? []) as Array<{
        id: string
        name: string | null
        email: string | null
        role: Role | null
        last_seen_at: string | null
      }>

      // Group sessions by user_id
      const sessionsByUser = new Map<string, SessionRow[]>()
      for (const s of sessions) {
        const arr = sessionsByUser.get(s.user_id) ?? []
        arr.push(s)
        sessionsByUser.set(s.user_id, arr)
      }

      // Build a unified user activity list from all engineers
      const activityList: UserActivity[] = engineers
        .filter((e) => e.last_seen_at) // Only show users who have used the app at least once
        .map((eng) => {
          const userSessions = sessionsByUser.get(eng.id) ?? []
          const hasSession = userSessions.length > 0

          // Best "logged in" time is the most recent session created_at
          let loggedInAt: string | null = null
          if (hasSession) {
            loggedInAt = userSessions.reduce((best, s) => {
              if (!best) return s.created_at
              return new Date(s.created_at).getTime() > new Date(best).getTime() ? s.created_at : best
            }, null as string | null)
          }

          return {
            id: eng.id,
            name: eng.name,
            email: eng.email,
            role: eng.role,
            last_seen_at: eng.last_seen_at,
            has_active_session: hasSession,
            session_ids: userSessions.map((s) => s.session_id),
            logged_in_at: loggedInAt,
          }
        })

      // Sort: online first, then by most recent last_seen_at
      activityList.sort((a, b) => {
        const aTime = a.last_seen_at ? new Date(a.last_seen_at).getTime() : 0
        const bTime = b.last_seen_at ? new Date(b.last_seen_at).getTime() : 0
        return bTime - aTime
      })

      return activityList
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  })
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ["admin", "sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_sessions")
      if (error) throw error
      return data as SessionRow[]
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  })
}

export function useRevokeSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.rpc("revoke_session", { target_session_id: sessionId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "sessions"] })
      queryClient.invalidateQueries({ queryKey: ["admin", "user-activity"] })
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: {
      name: string
      emp_id: string
      designation: string
      email: string
      mobile_number: string
      password: string
      role: Role
      allowed_years?: string[]
    }) => {
      const res = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to create user")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/admin/delete-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Failed to delete user")
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
    },
  })
}