import { useAuthStore } from "../../store/authStore";
import { useWellnessStore } from "../../store/wellnessStore";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function GreetingHeader() {
  const user = useAuthStore((s) => s.user);
  const lang = useWellnessStore((s) => s.lang);
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? lang === "am"
        ? "እንደምን አደሩ"
        : "Good morning"
      : hour < 17
        ? lang === "am"
          ? "እንደምን ዋሉ"
          : "Good afternoon"
        : lang === "am"
          ? "እንደምን አመሹ"
          : "Good evening";

  return (
    <header className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm text-ink-muted">{greeting}</p>
        <h1 className="font-display text-2xl font-medium tracking-tight text-ink md:text-[26px]">
          {user?.name?.split(" ")[0] ?? (lang === "am" ? "ጓደኛ" : "friend")}
        </h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {lang === "am"
            ? "ዛሬ እንዴት እንደሚሰማዎት ይንገሩኝ"
            : "How are you feeling today?"}
        </p>
      </div>
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal-light to-sanctuary-lavender text-sm font-medium text-teal shadow-sanctuary ring-2 ring-white"
        title={user?.name}
      >
        {user?.name ? initials(user.name) : "✦"}
      </div>
    </header>
  );
}
