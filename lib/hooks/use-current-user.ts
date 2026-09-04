import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export interface LoggedInUser {
  name: string
  emp_id: string
  designation: string
  email: string
  role: "admin" | "manager" | "engineer" | "visitor"
  mobile_number?: string
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async (): Promise<LoggedInUser | null> => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data, error } = await supabase
        .from("engineers")
        .select("name, emp_id, designation, email, role, mobile_number")
        .eq("email", user.email)
        .single()
      
      if (error || !data) return null
      return { ...data, email: user.email ?? "" } as LoggedInUser
    },
    staleTime: 1000 * 60 * 60, // 1 hour caching
  })
}
