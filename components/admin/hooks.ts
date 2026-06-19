"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export type Role = "admin" | "manager" | "engineer"

export type Engineer = {
  id: string
  name: string
  emp_id: string
  designation: string
  email: string | null
  mobile_number: string | null
  role: Role
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
        .eq("email", user.email)
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
        .select("id, name, emp_id, designation, email, mobile_number, role, created_at")
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
      const { error } = await supabase.from("engineers").update({ role }).eq("id", id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
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
}

export function useActiveSessions() {
  return useQuery({
    queryKey: ["admin", "sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_active_sessions")
      if (error) throw error
      return data as SessionRow[]
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
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
    },
  })
}