import { useCallback, useEffect, useState } from "react";
import {
  fetchCommunityPosts,
  likeCommunityPost,
  postCommunityPost,
  replyCommunityPost,
  type CommunityPost,
} from "../../api/client";
import { useWellnessStore } from "../../store/wellnessStore";

const CATEGORIES = [
  { id: "all", en: "All", am: "ሁሉም" },
  { id: "general", en: "General", am: "አጠቃላይ" },
  { id: "anxiety", en: "Anxiety", am: "ጭንቀት" },
  { id: "burnout", en: "Burnout", am: "ድካም" },
  { id: "sleep", en: "Sleep", am: "እንቅልፍ" },
  { id: "motivation", en: "Motivation", am: "ተነሳሽነት" },
];

export function CommunityPage() {
  const lang = useWellnessStore((s) => s.lang);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

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

  useEffect(() => {
    load();
  }, [load]);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    await postCommunityPost(content.trim(), category === "all" ? "general" : category, anonymous);
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

  return (
    <div className="space-y-5 pb-24">
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

      {loading ? (
        <p className="text-center text-sm text-ink-muted">{lang === "am" ? "በመጫን ላይ..." : "Loading..."}</p>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <article key={post.id} className="glass-card">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-ink dark:text-gray-200">{post.author}</span>
                <span className="rounded-full bg-teal-light px-2 py-0.5 text-[10px] text-teal">
                  {post.category}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-ink dark:text-gray-300">{post.content}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-ink-muted">
                <button
                  type="button"
                  onClick={() => handleLike(post.id)}
                  className="hover:text-teal"
                >
                  ❤️ {post.likes}
                </button>
                <button
                  type="button"
                  onClick={() => setReplyTo(replyTo === post.id ? null : post.id)}
                  className="hover:text-teal"
                >
                  💬 {post.replies.length}
                </button>
                <time className="ml-auto">{new Date(post.timestamp).toLocaleDateString()}</time>
              </div>
              {post.replies.map((r) => (
                <div
                  key={r.id}
                  className="mt-2 rounded-xl bg-teal-light/40 px-3 py-2 text-xs dark:bg-gray-800"
                >
                  <span className="font-medium">{r.author}: </span>
                  {r.content}
                </div>
              ))}
              {replyTo === post.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={lang === "am" ? "መልስ..." : "Reply..."}
                    className="flex-1 rounded-xl border border-warm-border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
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

      {showForm ? (
        <form onSubmit={handlePost} className="glass-card space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={lang === "am" ? "ምን እያሰብክ ነው?" : "Share what's on your mind..."}
            className="w-full rounded-xl border border-warm-border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
          />
          <label className="flex items-center gap-2 text-xs text-ink-muted">
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
          aria-label="New post"
        >
          +
        </button>
      )}
    </div>
  );
}
