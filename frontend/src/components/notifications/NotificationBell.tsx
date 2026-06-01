import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markNotificationRead,
  type AppNotification,
} from "../../api/client";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  useEffect(() => {
    fetchNotifications()
      .then((r) => setItems(r.notifications))
      .catch(() => {});
    const id = setInterval(() => {
      fetchNotifications()
        .then((r) => setItems(r.notifications))
        .catch(() => {});
    }, 60000);
    return () => clearInterval(id);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function markRead(id: number) {
    await markNotificationRead(id).catch(() => {});
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 text-ink-muted transition hover:bg-white/60 hover:text-ink"
        aria-label="Reminders"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-white/70 bg-white/98 p-5 shadow-sanctuary backdrop-blur-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase text-ink-muted">Reminders</p>
                <p className="text-sm text-ink-muted">Tap outside or close to dismiss.</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-ink/20 bg-ink/5 px-3 py-1 text-xs text-ink transition hover:bg-ink/10"
                aria-label="Close reminders"
              >
                Close
              </button>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-ink-muted">No reminders yet.</p>
            ) : (
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-xl px-3 py-2 text-sm ${
                      n.read ? "bg-calm-50 text-calm-600" : "bg-teal-light/40 text-ink"
                    }`}
                  >
                    <p className="font-medium">{n.title}</p>
                    <p className="text-xs opacity-80">{n.message}</p>
                    {!n.read && (
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="mt-1 text-xs text-teal underline"
                      >
                        Mark read
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
