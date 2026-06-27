"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

/* ─── Types ─────────────────────────────── */
type Status = "TODO" | "IN_PROGRESS" | "DONE";

interface Task {
  id: string;
  title: string;
  status: Status;
  createdAt: string;
}

interface ToastItem {
  id: number;
  msg: string;
  type: "ok" | "err";
  out?: boolean;
}

/* ─── Constants ──────────────────────────── */
const COLS: { key: Status; label: string; dot: string; badge: string; cardCls: string }[] = [
  { key: "TODO",        label: "To Do",       dot: "#64748b", badge: "badge-todo",   cardCls: "todo" },
  { key: "IN_PROGRESS", label: "In Progress", dot: "#f59e0b", badge: "badge-inprog", cardCls: "inprog" },
  { key: "DONE",        label: "Done",        dot: "#10b981", badge: "badge-done",   cardCls: "done" },
];

const LABEL: Record<Status, string> = { TODO: "To Do", IN_PROGRESS: "In Progress", DONE: "Done" };
const NEXT:  Record<Status, Status> = { TODO: "IN_PROGRESS", IN_PROGRESS: "DONE", DONE: "TODO" };
const NEXT_LABEL: Record<Status, string> = { TODO: "Start", IN_PROGRESS: "Complete", DONE: "Reset" };

/* ─── Toast ──────────────────────────────── */
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const tid = useRef(0);
  const add = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    const id = ++tid.current;
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, out: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 300);
    }, 2600);
  }, []);
  return { toasts, add };
}

/* ─── Skeleton ───────────────────────────── */
function Skeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="skeleton rounded-xl" style={{ height: "90px", opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

/* ─── Main ───────────────────────────────── */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toasts, add } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [initStatus, setInitStatus] = useState<Status>("TODO");
  const [creating, setCreating] = useState(false);
  const [formErr, setFormErr] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  /* fetch */
  const fetchTasks = useCallback(async () => {
    try {
      const r = await fetch("/api/tasks");
      if (r.ok) setTasks(await r.json());
    } catch { add("Failed to load tasks", "err"); }
    finally { setLoading(false); }
  }, [add]);

  useEffect(() => {
    setMounted(true);
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") fetchTasks();
  }, [status, router, fetchTasks]);

  /* create */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setFormErr(""); setCreating(true);
    try {
      const r = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), status: initStatus }),
      });
      const data = await r.json();
      if (!r.ok) { setFormErr(data.error || "Failed to create"); }
      else {
        setTasks(p => [data, ...p]);
        setTitle("");
        add("Task created ✓");
        inputRef.current?.focus();
      }
    } catch { setFormErr("Something went wrong."); }
    finally { setCreating(false); }
  }

  /* update status */
  async function changeStatus(id: string, newStatus: Status) {
    setUpdatingId(id);
    try {
      const r = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (r.ok) {
        const updated = await r.json();
        setTasks(p => p.map(t => t.id === id ? updated : t));
        add(`Moved to ${LABEL[newStatus]} ✓`);
      }
    } catch { add("Update failed", "err"); }
    finally { setUpdatingId(null); }
  }

  /* derived */
  const grouped = {
    TODO:        tasks.filter(t => t.status === "TODO"),
    IN_PROGRESS: tasks.filter(t => t.status === "IN_PROGRESS"),
    DONE:        tasks.filter(t => t.status === "DONE"),
  };
  const done  = tasks.filter(t => t.status === "DONE").length;
  const total = tasks.length;
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100);
  const name  = session?.user?.name?.split(" ")[0] || session?.user?.email?.split("@")[0] || "there";

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  /* ── Loading screen ── */
  if (status === "loading" || (status === "authenticated" && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--c-bg)" }}>
        <div className="orb orb-1" /><div className="orb orb-2" />
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: "var(--grad-main)", boxShadow: "0 8px 32px rgba(99,102,241,.4)" }}>
            <svg className="spin w-7 h-7 text-white" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "var(--c-muted)" }}>Loading workspace…</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  /* ── Main render ── */
  return (
    <div className="min-h-screen" style={{ background: "var(--c-bg)" }}>
      {/* Orbs */}
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      {/* ── Navbar ── */}
      <nav className="navbar sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-hover w-8 h-8 rounded-xl flex items-center justify-center cursor-default"
              style={{ background: "var(--grad-main)" }}>
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="font-display font-bold text-lg gradient-text">TaskBoard</span>
          </div>

          <div className="flex items-center gap-3">
            {/* User chip */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl"
              style={{ background: "rgba(255,255,255,.04)", border: "1px solid var(--c-border)" }}>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "var(--grad-main)" }}>
                {name[0].toUpperCase()}
              </div>
              <span className="text-sm" style={{ color: "var(--c-muted)" }}>{name}</span>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: ".78rem" }}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 relative z-10">

        {/* ── Header ── */}
        <div className={`mb-8 ${mounted ? "anim-in" : "opacity-0"}`}>
          <h2 className="font-display text-2xl font-bold" style={{ color: "var(--c-text)" }}>
            Hey, {name} 👋
          </h2>
          <p className="text-sm mt-1" style={{ color: "var(--c-muted)" }}>
            {total === 0
              ? "Your board is empty — add your first task below."
              : `${total - done} task${total - done !== 1 ? "s" : ""} remaining · ${pct}% complete`}
          </p>
        </div>

        {/* ── Stats ── */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 ${mounted ? "anim-in delay-1" : "opacity-0"}`}>
          {[
            { label: "Total",       val: total,                                      color: "#818cf8" },
            { label: "To Do",       val: grouped.TODO.length,                        color: "#94a3b8" },
            { label: "In Progress", val: grouped.IN_PROGRESS.length,                 color: "#fbbf24" },
            { label: "Done",        val: done,                                        color: "#34d399" },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-muted)" }}>
                {s.label}
              </p>
              <p className="font-display text-3xl font-bold" style={{ color: s.color }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* ── Progress bar ── */}
        {total > 0 && (
          <div className={`mb-8 ${mounted ? "anim-in delay-2" : "opacity-0"}`}>
            <div className="flex justify-between text-xs mb-2" style={{ color: "var(--c-muted)" }}>
              <span className="font-semibold">Progress</span>
              <span className="font-bold" style={{ color: "#818cf8" }}>{pct}%</span>
            </div>
            <div className="prog-track">
              <div className="prog-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* ── Create task form ── */}
        <div className={`mb-8 p-5 rounded-2xl ${mounted ? "anim-in delay-2" : "opacity-0"}`}
          style={{ background: "var(--c-surface)", border: "1px solid var(--c-border)" }}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white"
              style={{ background: "var(--grad-main)" }}>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            New task
          </h3>
          <form onSubmit={handleCreate}>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input ref={inputRef} type="text" value={title}
                  onChange={e => { setTitle(e.target.value); setFormErr(""); }}
                  placeholder="What needs to be done? (Enter to add)"
                  maxLength={200} className="inp" />
                {formErr && <p className="text-xs mt-1.5" style={{ color: "#fb7185" }}>{formErr}</p>}
              </div>
              {/* Initial status picker */}
              <select value={initStatus} onChange={e => setInitStatus(e.target.value as Status)}
                className="sel" style={{ height: "42px" }}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
              <button type="submit" disabled={creating || !title.trim()} className="btn btn-primary">
                {creating
                  ? <svg className="spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  : "+ Add"}
              </button>
            </div>
            {title.length > 160 && (
              <p className="text-right text-xs mt-1.5" style={{ color: "var(--c-muted)" }}>
                {200 - title.length} remaining
              </p>
            )}
          </form>
        </div>

        {/* ── Kanban board ── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {COLS.map(c => <div key={c.key} className="k-col"><Skeleton /></div>)}
          </div>
        ) : total === 0 ? (
          <div className={`text-center py-24 ${mounted ? "anim-in delay-3" : "opacity-0"}`}>
            <div className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
              style={{ background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.15)" }}>
              <svg className="w-10 h-10" style={{ color: "var(--indigo)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-display text-xl font-bold mb-1" style={{ color: "var(--c-text)" }}>
              Board is empty
            </p>
            <p className="text-sm" style={{ color: "var(--c-muted)" }}>Add your first task above to get started.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-5 ${mounted ? "anim-in delay-3" : "opacity-0"}`}>
            {COLS.map(col => (
              <div key={col.key} className="k-col">
                {/* Column header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="pulse-ring w-2.5 h-2.5 rounded-full" style={{ color: col.dot }}>
                      <span className="block w-2.5 h-2.5 rounded-full" style={{ background: col.dot, boxShadow: `0 0 6px ${col.dot}` }} />
                    </span>
                    <span className="text-sm font-semibold">{col.label}</span>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,.05)", color: "var(--c-muted)" }}>
                    {grouped[col.key].length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-3">
                  {grouped[col.key].length === 0 ? (
                    <div className="empty">
                      <svg className="w-7 h-7 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                          d="M12 4v16m8-8H4" />
                      </svg>
                      <span>No tasks yet</span>
                    </div>
                  ) : (
                    grouped[col.key].map((task, i) => (
                      <div key={task.id} className={`task-card ${col.cardCls} card-appear`}
                        style={{ animationDelay: `${i * 0.06}s` }}>
                        {/* Title */}
                        <p className="text-sm font-medium leading-snug mb-3" style={{ color: "var(--c-text)" }}>
                          {task.title}
                        </p>

                        {/* Badge + date */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`badge ${col.badge}`}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: col.dot }} />
                            {LABEL[task.status]}
                          </span>
                          <span className="text-xs" style={{ color: "var(--c-dim)" }}>{fmtDate(task.createdAt)}</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-3"
                          style={{ borderTop: "1px solid var(--c-border)" }}>
                          {/* Quick move */}
                          <button
                            onClick={() => changeStatus(task.id, NEXT[task.status])}
                            disabled={updatingId === task.id}
                            className="btn btn-sm flex-1"
                            style={{
                              background: "rgba(99,102,241,.1)",
                              border: "1px solid rgba(99,102,241,.2)",
                              color: "#818cf8",
                              fontSize: ".75rem",
                            }}>
                            {updatingId === task.id
                              ? <svg className="spin w-3 h-3" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                              : <><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>{NEXT_LABEL[task.status]}</>
                            }
                          </button>

                          {/* Status dropdown */}
                          <select value={task.status} disabled={updatingId === task.id}
                            onChange={e => changeStatus(task.id, e.target.value as Status)}
                            className="sel" style={{ fontSize: ".73rem", padding: "5px 8px" }}>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </select>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ── Toasts ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={t.out ? "toast-out" : "toast-in"}
            style={{
              background: t.type === "ok" ? "rgba(16,185,129,.15)" : "rgba(244,63,94,.15)",
              border: `1px solid ${t.type === "ok" ? "rgba(16,185,129,.3)" : "rgba(244,63,94,.3)"}`,
              color: t.type === "ok" ? "#34d399" : "#fb7185",
              padding: "10px 16px",
              borderRadius: "12px",
              fontSize: ".8rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(0,0,0,.5)",
              minWidth: "190px",
            }}>
            {t.type === "ok"
              ? <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              : <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
