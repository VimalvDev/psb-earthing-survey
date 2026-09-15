"use client";

import { useMemo, useState } from "react";
import ActiveSessionsCard from "@/components/admin/ActiveSessionsCard";
import {
  useCurrentRole,
  useAllUsers,
  type Engineer,
  useSetUserPassword,
} from "@/components/admin/hooks";
import {
  UserManagementHeader,
  UserFilters,
  UserTable,
  CreateUserModal,
  YearAccessEditor,
} from "@/components/admin/UserManagement";
import { FiLoader, FiAlertTriangle, FiKey, FiCheck, FiX } from "react-icons/fi";

export default function AdminPage() {
  const { data: currentRole, isLoading: roleLoading } = useCurrentRole();
  const isAdmin = currentRole?.role === "admin";

  if (roleLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] text-gray-400">
        <FiLoader size={20} className="animate-spin mr-2" /> Checking access…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-center px-6">
        <div className="w-12 h-12 rounded-2xl bg-[#FCEBEB] flex items-center justify-center">
          <FiAlertTriangle size={22} className="text-[#A32D2D]" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">Access restricted</h2>
        <p className="text-sm text-gray-500 max-w-sm">
          This page is only available to admins. Contact your system administrator if you need access.
        </p>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const { data: users, isLoading } = useAllUsers();
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  
  const [passwordTarget, setPasswordTarget] = useState<Engineer | null>(null);
  const [yearsTarget, setYearsTarget] = useState<Engineer | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);

  const filtered = useMemo(() => {
    if (!users) return [];
    
    let result = users;
    
    if (roleFilter !== "all") {
      result = result.filter(u => u.role === roleFilter);
    }
    
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.emp_id.toLowerCase().includes(q) ||
          u.designation.toLowerCase().includes(q) ||
          (u.email ?? "").toLowerCase().includes(q) ||
          (u.mobile_number ?? "").includes(q)
      );
    }
    
    return result;
  }, [users, search, roleFilter]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      
      {users && (
        <UserManagementHeader users={users} onAddUser={() => setShowCreateUser(true)} />
      )}

      <div>
        <UserFilters 
          search={search} 
          setSearch={setSearch} 
          roleFilter={roleFilter} 
          setRoleFilter={setRoleFilter} 
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 bg-white border border-gray-200 rounded-xl">
            <FiLoader size={18} className="animate-spin mr-2" /> Loading users…
          </div>
        ) : (
          <UserTable 
            users={filtered} 
            onSetPassword={setPasswordTarget} 
            onEditYears={setYearsTarget} 
          />
        )}
      </div>

      <div className="mt-8">
        <ActiveSessionsCard />
      </div>

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal onClose={() => setShowCreateUser(false)} />
      )}
      
      {yearsTarget && (
        <YearAccessEditor
          user={yearsTarget}
          onClose={() => setYearsTarget(null)}
        />
      )}

      {passwordTarget && (
        <SetPasswordModal
          user={passwordTarget}
          onClose={() => setPasswordTarget(null)}
        />
      )}
      
    </div>
  );
}

// Keep the password modal simple and isolated here for now, 
// as it was already pretty good, just updated to match the new style slightly.
function SetPasswordModal({
  user,
  onClose,
}: {
  user: Engineer;
  onClose: () => void;
}) {
  const setPassword = useSetUserPassword();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error" | "mismatch">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  function handleSubmit() {
    setStatus("idle");
    if (newPassword.length < 8) {
      setStatus("error");
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setStatus("mismatch");
      return;
    }
    setPassword.mutate(
      { userId: user.id, newPassword },
      {
        onSuccess: () => setStatus("success"),
        onError: (err) => {
          setStatus("error");
          setErrorMsg(
            err instanceof Error ? err.message : "Failed to update password."
          );
        },
      }
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full animate-[fadeInUp_0.2s_ease-out_both] shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <FiKey size={18} className="text-[#027D3F]" />
            <h3 className="font-semibold text-gray-900 text-lg">Set password</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 p-1 rounded-full transition-colors"
          >
            <FiX size={18} />
          </button>
        </div>
        
        <div className="mb-5 bg-gray-50 rounded-lg p-3 border border-gray-100 flex items-center gap-3">
           <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.email || user.emp_id}</p>
          </div>
        </div>

        {status === "success" ? (
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-[#E8F5EE] flex items-center justify-center mb-1">
              <FiCheck size={26} className="text-[#027D3F]" />
            </div>
            <p className="text-[15px] font-medium text-gray-900">
              Password updated
            </p>
            <button
              onClick={onClose}
              className="mt-2 w-full h-10 rounded-lg bg-[#027D3F] hover:bg-[#02612f] text-white font-medium transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoFocus
                className="w-full h-10 px-4 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F]"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full h-10 px-4 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none transition focus:border-[#027D3F] focus:bg-white focus:ring-1 focus:ring-[#027D3F]"
              />
            </div>

            {status === "mismatch" && (
              <p className="text-xs text-[#A32D2D] font-medium">Passwords don't match.</p>
            )}
            {status === "error" && (
              <p className="text-xs text-[#A32D2D] font-medium">{errorMsg}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 h-10 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={setPassword.isPending}
                className="flex-[1.5] h-10 rounded-lg bg-[#027D3F] hover:bg-[#02612f] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 shadow-sm"
              >
                {setPassword.isPending ? (
                  <FiLoader size={16} className="animate-spin" />
                ) : (
                  <FiCheck size={16} />
                )}
                Set Password
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
