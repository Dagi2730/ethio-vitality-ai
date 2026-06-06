import { useCallback, useEffect, useState } from "react";
import {
  fetchCommunityPosts,
  likeCommunityPost,
  postCommunityPost,
  replyCommunityPost,
  deleteCommunityPost,
  updateCommunityPost,
  type CommunityPost,
} from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";
import { useAuthStore } from "../../store/authStore";

const CATEGORIES = [
  { id: "all",        en: "All",        am: "ሁሉም"    },
  { id: "general",    en: "General",    am: "አጠቃላይ"  },
  { id: "anxiety",    en: "Anxiety",    am: "ጭንቀት"   },
  { id: "burnout",    en: "Burnout",    am: "ድካም"    },
  { id: "sleep",      en: "Sleep",      am: "እንቅልፍ"  },
  { id: "motivation", en: "Motivation", am: "ተነሳሽነት" },
];

export function CommunityPage() {
  // ── Store values ───────────────────────────────────────────────────────────
  const lang = useWellnessStore((s) => s.lang);

  // authStore holds the logged-in user — same pattern used in fetchInsights()
  // inside wellnessStore. Adjust the field (name / username / email) to
  // whatever your authStore exposes on the user object.
  const authUser = useAuthStore((s) => s.user);
  const currentUser: string =
    authUser?.name     ||
    authUser?.email    ||
    "";

  // ── Local state ────────────────────────────────────────────────────────────
  const [posts,     setPosts]     = useState<CommunityPost[]>([]);
  const [category,  setCategory]  = useState("all");
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [content,   setContent]   = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [replyTo,   setReplyTo]   = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText,  setEditText]  = useState("");

  // ── Data loading ───────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchCommunityPosts(category);
      setPosts(data.posts);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => { load(); }, [load]);

  // ── Ownership check ────────────────────────────────────────────────────────
  // A post belongs to the current user when:
  //   1. currentUser is not empty (user is logged in)
  //   2. The post was not anonymous (can't verify anonymous ownership)
  //   3. post.author matches the current user's name (case-insensitive)
  function isOwner(post: CommunityPost): boolean {
    if (!currentUser.trim())          return false;
    if (post.author === "Anonymous")  return false;
    return (
      post.author.trim().toLowerCase() === currentUser.trim().toLowerCase()
    );
  }

  // ── Handlers ───────────────────────────────────────────────────────────────
  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await postCommunityPost(
      content.trim(),
      category === "all" ? "general" : category,
      anonymous,
    );
    setContent("");
    setShowForm(false);
    load();
  }

  async function handleReply(postId: string) {
    if (!replyText.trim()) return;
    await replyCommunityPost(postId, replyText.trim(), anonymous);
    setReplyText("");
    setReplyTo(null);
    load();
  }

  async function handleLike(postId: string) {
    await likeCommunityPost(postId);
    load();
  }

  async function handleDelete(postId: string) {
    const confirmed = window.confirm(
      lang === "am"
        ? "እርግጠኛ ነዎት? ይህ ልጥፍ ይሰረዛል።"
        : "Are you sure you want to delete this post?",
    );
    if (!confirmed) return;
    await deleteCommunityPost(postId);
    load();
  }

  async function handleUpdate(postId: string) {
    if (!editText.trim()) return;
    await updateCommunityPost(postId, editText.trim());
    setEditingId(null);
    setEditText("");
    load();
  }

  function startEdit(post: CommunityPost) {
    setEditingId(post.id);
    setEditText(post.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 pb-24">

      {/* Header */}
      <header>
        <h1 className="text-xl font-semibold text-ink dark:text-gray-100">
          {lang === "am" ? "ማህበረሰብ ድጋፍ" : "Community Support"}
        </h1>
        <p className="text-sm text-ink-muted">
          {lang === "am"
            ? "ከሌሎች ጋር በአንድነት ይደገፉ"
            : "Peer mental wellness — you're not alone"}
        </p>
      </header>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              category === c.id
                ? "bg-teal text-white"
                : "bg-white/80 text-ink-muted hover:bg-teal-light dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {lang === "am" ? c.am : c.en}
          </button>
        ))}
      </div>

      {/* Post list */}
      {loading ? (
        <p className="text-center text-sm text-ink-muted">
          {lang === "am" ? "በመጫን ላይ..." : "Loading..."}
        </p>
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-ink-muted py-10">
          {lang === "am"
            ? "እስካሁን ልጥፍ የለም። የመጀመሪያው ይሁኑ!"
            : "No posts yet. Be the first to share!"}
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="glass-card">

              {/* Post header — author, category badge, owner actions */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-ink dark:text-gray-200">
                    {post.author}
                  </span>
                  <span className="rounded-full bg-teal-light px-2 py-0.5 text-[10px] text-teal">
                    {post.category}
                  </span>
                </div>

                {/* Edit / Delete only rendered when current user owns the post */}
                {isOwner(post) && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEdit(post)}
                      className="text-[10px] text-ink-muted hover:text-teal transition"
                    >
                      {lang === "am" ? "አርትዕ" : "Edit"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(post.id)}
                      className="text-[10px] text-red-400 hover:text-red-600 transition"
                    >
                      {lang === "am" ? "ሰርዝ" : "Delete"}
                    </button>
                  </div>
                )}
              </div>

              {/* Post body — read view or inline edit */}
              {editingId === post.id ? (
                <div className="my-2 space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={4}
                    maxLength={1000}
                    className="w-full rounded-xl border border-warm-border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdate(post.id)}
                      className="rounded-xl bg-teal px-3 py-1.5 text-xs text-white"
                    >
                      {lang === "am" ? "አስቀምጥ" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl px-3 py-1.5 text-xs text-ink-muted"
                    >
                      {lang === "am" ? "ይቅር" : "Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-ink dark:text-gray-300">
                  {post.content}
                </p>
              )}

              {/* Like / reply count / timestamp */}
              <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className="hover:text-teal transition"
                >
                  ❤️ {post.likes}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setReplyTo(replyTo === post.id ? null : post.id)
                  }
                  className="hover:text-teal transition"
                >
                  💬 {post.replies.length}
                </button>
                <time className="ml-auto">
                  {new Date(post.timestamp).toLocaleDateString()}
                </time>
              </div>

              {/* Replies */}
              {post.replies.length > 0 && (
                <div className="mt-2 space-y-1">
                  {post.replies.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-teal-light/40 px-3 py-2 text-xs dark:bg-gray-800"
                    >
                      <span className="font-medium">{r.author}: </span>
                      {r.content}
                    </div>
                  ))}
                </div>
              )}

              {/* Reply input */}
              {replyTo === post.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={lang === "am" ? "መልስ..." : "Reply..."}
                    className="flex-1 rounded-xl border border-warm-border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleReply(post.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleReply(post.id)}
                    className="rounded-xl bg-teal px-3 py-2 text-sm text-white"
                  >
                    {lang === "am" ? "ላክ" : "Send"}
                  </button>
                </div>
              )}

            </article>
          ))}
        </div>
      )}

      {/* New post form / FAB */}
      {showForm ? (
        <form onSubmit={handlePost} className="glass-card space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={
              lang === "am" ? "ምን እያሰብክ ነው?" : "Share what's on your mind..."
            }
            className="w-full rounded-xl border border-warm-border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
            />
            {lang === "am" ? "ስም አለመጥቀስ" : "Post anonymously"}
          </label>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1 text-sm">
              {lang === "am" ? "አስቀምጥ" : "Post"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl px-4 text-sm text-ink-muted"
            >
              {lang === "am" ? "ይቅር" : "Cancel"}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="fixed bottom-24 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-teal text-2xl text-white shadow-glow md:bottom-8"
        >
          +
        </button>
      )}

    </div>
  );
}