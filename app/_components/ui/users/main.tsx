"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Shield, Trash2, UserPlus, Users, X } from "lucide-react";

import { AppShell } from "@/app/_components/app-shell";
import {
  createUserAction,
  deleteUserAction,
  listUsersAction,
  updateUserAction,
  type UsersListItem,
} from "@/app/(protected)/users/actions";

function fmtDate(iso?: string | null) {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "-"
    : new Intl.DateTimeFormat("en-AU", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        timeZone: "Australia/Sydney",
      }).format(d);
}

export default function UsersMain() {
  const [users, setUsers] = useState<UsersListItem[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsersListItem | null>(null);

  const formOpen = addUserOpen || Boolean(editingUser);

  function resetEditor() {
    setAddUserOpen(false);
    setEditingUser(null);
  }

  async function loadUsers() {
    setIsLoading(true);
    setError("");

    try {
      const out = await listUsersAction();
      if (!out.ok) {
        setUsers([]);
        setError(out.error);
        return;
      }
      setUsers(out.users);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load users.";
      setUsers([]);
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <AppShell title="Users" onOpenMobileSidebar={() => setSidebarOpen(true)}>
      <div className="cp-root">
        <div className="cp-container users-page-container">
          {sidebarOpen ? (
            <button
              type="button"
              className="users-page-backdrop"
              aria-label="Close user sidebar"
              onClick={() => setSidebarOpen(false)}
            />
          ) : null}

          <aside className={`cp-sidebar users-page-sidebar ${sidebarOpen ? "users-page-sidebar-open" : ""}`}>
            <div className="cp-sidebar-section">
              <div className="users-page-mobileClose">
                <button
                  type="button"
                  className="cp-btn-outline"
                  aria-label="Close user sidebar"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="icon16" />
                  Close
                </button>
              </div>

              <div className="sidebar-label">User Management</div>
              <div className="cp-note">Admins can add new users and review who has access to the app.</div>
            </div>

            <div className="cp-sidebar-section">
              <div className="rounded-xl border border-[rgba(15,92,58,0.12)] bg-[rgba(15,92,58,0.04)] px-4 py-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#5a7a66]">Total Users</div>
                <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#1c3328]">
                  <Users className="h-5 w-5 text-[#0f5c3a]" />
                  {users.length}
                </div>
              </div>
            </div>
          </aside>

          <main className="cp-main users-page-main">
            {error ? <div className="cp-error">{error}</div> : null}
            {success ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div> : null}

            <section className="cp-card">
              <div className="mainCardTop users-page-cardTop">
                <div>
                  <div className="h2">USERS</div>
                  <div className="sub">{isLoading ? "Loading users..." : "Current application users."}</div>
                </div>
                <button
                  type="button"
                  className="users-page-headerBtn"
                  onClick={() => {
                    setError("");
                    setSuccess("");
                    if (formOpen && !editingUser) {
                      resetEditor();
                      return;
                    }
                    setEditingUser(null);
                    setAddUserOpen(true);
                  }}
                >
                  <UserPlus className="icon16" />
                  {formOpen && !editingUser ? "Close" : "Add User"}
                </button>
              </div>

              {formOpen ? (
                <form
                  className="grid gap-4 px-4 pb-4 md:grid-cols-2"
                  action={(formData) =>
                    startTransition(async () => {
                      setError("");
                      setSuccess("");
                      const out = editingUser ? await updateUserAction(formData) : await createUserAction(formData);
                      if (!out.ok) {
                        setError(out.error);
                        return;
                      }
                      setSuccess(
                        editingUser ? `User updated: ${out.user.email}` : `User created: ${out.user.email}`
                      );
                      resetEditor();
                      await loadUsers();
                    })
                  }
                >
                  {editingUser ? <input type="hidden" name="userId" value={editingUser.id} /> : null}

                  <div className="cp-form-group">
                    <label className="ui-form-label">Full Name</label>
                    <input
                      className="ui-form-control"
                      name="name"
                      type="text"
                      placeholder="Full name"
                      required
                      defaultValue={editingUser?.name ?? ""}
                    />
                  </div>

                  <div className="cp-form-group">
                    <label className="ui-form-label">Email</label>
                    <input
                      className="ui-form-control"
                      name="email"
                      type="email"
                      placeholder="name@company.com"
                      required
                      defaultValue={editingUser?.email ?? ""}
                    />
                  </div>

                  {editingUser ? (
                    <div className="cp-form-group">
                      <label className="ui-form-label">Status</label>
                      <select
                        className="ui-form-control ui-form-select"
                        name="status"
                        defaultValue={editingUser.status}
                      >
                        <option value="active">Active</option>
                        <option value="disabled">Disabled</option>
                      </select>
                    </div>
                  ) : (
                    <div className="cp-form-group">
                      <label className="ui-form-label">Temporary Password</label>
                      <input
                        className="ui-form-control"
                        name="password"
                        type="password"
                        placeholder="At least 8 characters"
                        required
                      />
                    </div>
                  )}

                  <div className="cp-form-group">
                    <label className="ui-form-label">Access</label>
                    <select
                      className="ui-form-control ui-form-select"
                      name="role"
                      defaultValue={editingUser ? (editingUser.isAdmin ? "admin" : "user") : "user"}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="users-page-submitRow md:col-span-2 flex items-center justify-start gap-3">
                    <button className="users-page-formBtn" type="submit" disabled={isPending}>
                      {editingUser ? <Pencil className="icon16" /> : <UserPlus className="icon16" />}
                      {isPending ? (editingUser ? "Saving..." : "Creating...") : editingUser ? "Update User" : "Create User"}
                    </button>
                    <button
                      type="button"
                      className="cp-btn-outline"
                      onClick={() => resetEditor()}
                      disabled={isPending}
                    >
                      <X className="icon16" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : null}

              <div className="tableWrap users-page-tableWrap">
                <table className="cp-table users-page-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Last Login</th>
                      <th>Created</th>
                      <th className="thActions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length ? (
                      users.map((user) => (
                        <tr key={user.id}>
                          <td className="font-semibold text-slate-900" data-label="Name">{user.name}</td>
                          <td className="muted" data-label="Email">{user.email}</td>
                          <td data-label="Role">
                            <span className={user.isAdmin ? "badge badgeGreen" : "badge badgeSlate"}>
                              {user.isAdmin ? (
                                <>
                                  <Shield className="h-3.5 w-3.5" />
                                  Admin
                                </>
                              ) : (
                                "User"
                              )}
                            </span>
                          </td>
                          <td data-label="Status">
                            <span className={user.status === "active" ? "badge badgeGreen" : "badge badgeOrange"}>
                              {user.status}
                            </span>
                          </td>
                          <td className="muted" data-label="Last Login">{fmtDate(user.lastLoginAt)}</td>
                          <td className="muted" data-label="Created">{fmtDate(user.createdAt)}</td>
                          <td className="actionsCell users-page-actionsCell" data-label="Actions">
                            <div className="cp-mobile-actionRow">
                              <button
                                type="button"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-transparent px-3 text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                disabled={isPending}
                                onClick={() => {
                                  setError("");
                                  setSuccess("");
                                  setAddUserOpen(false);
                                  setEditingUser(user);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-transparent px-3 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                disabled={isPending}
                                onClick={() => {
                                  const confirmed = window.confirm(`Delete user ${user.email}?`);
                                  if (!confirmed) return;

                                  startTransition(async () => {
                                    setError("");
                                    setSuccess("");
                                    const formData = new FormData();
                                    formData.set("userId", user.id);
                                    const out = await deleteUserAction(formData);
                                    if (!out.ok) {
                                      setError(out.error);
                                      return;
                                    }
                                    if (editingUser?.id === user.id) {
                                      resetEditor();
                                    }
                                    setSuccess(`User deleted: ${user.email}`);
                                    await loadUsers();
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="muted tdCenter">
                          {isLoading ? "Loading..." : "No users found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </AppShell>
  );
}
