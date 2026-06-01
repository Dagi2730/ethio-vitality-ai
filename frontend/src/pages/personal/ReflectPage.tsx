import { useEffect, useState } from "react";
import { fetchJournal, postJournal, updateJournal, type JournalEntry } from "../../api/client";
import { JournalEditor } from "../../components/journal/JournalEditor";
import { JournalFeed } from "../../components/journal/JournalFeed";
import {
  JournalActivityStrip,
  JournalDiscoverGrid,
  JournalFeaturedHero,
  type JournalPrompt,
} from "../../components/journal/JournalPromptCards";
import { useWellnessStore } from "../../store/wellnessStore";

export function ReflectPage() {
  const lang = useWellnessStore((s) => s.lang);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [seedText, setSeedText] = useState("");

  const load = () => fetchJournal().then((r) => setEntries(r.entries)).catch(() => {});

  useEffect(() => {
    load();
  }, []);

  function openComposer(prompt?: JournalPrompt) {
    setSeedText(prompt ? `${prompt.seed}\n\n` : "");
    setIsEditing(false);
    setEditingEntry(undefined);
    setEditorOpen(true);
  }

  function openEditEntry(entry: JournalEntry) {
    setEditingEntry(entry);
    setIsEditing(true);
    setSeedText("");
    setEditorOpen(true);
  }

  async function saveEntry(html: string, isEditing: boolean) {
    setLoading(true);
    try {
      if (isEditing && editingEntry) {
        await updateJournal(editingEntry.id, html);
      } else {
        await postJournal(html, "text");
      }
      setSeedText("");
      setEditingEntry(undefined);
      setIsEditing(false);
      await load();
    } finally {
      setLoading(false);
    }
  }

  const sorted = [...entries].reverse();

  return (
    <div className="relative pb-36 animate-fade-in">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-medium text-ink">
          {lang === "am" ? "መጽሐፍ" : "Journal"}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {lang === "am"
            ? "ድምጽ ወይም ጽሑፍ — Vitality ስሜትዎን ይረዳል"
            : "Voice or text — Vitality reads the feeling behind your words"}
        </p>
      </header>

      <div className="space-y-8">
        <JournalFeaturedHero onNew={() => openComposer()} />
        <JournalActivityStrip entryCount={entries.length} />
        <JournalDiscoverGrid onSelect={(p) => openComposer(p)} />

        <section>
          <h2 className="mb-3 text-lg font-medium text-ink">
            {lang === "am" ? "መዝገቦች" : "Your entries"}
          </h2>
          <JournalFeed entries={sorted} onSelect={openEditEntry} />
        </section>
      </div>

      <JournalEditor
        isOpen={editorOpen}
        isEditing={isEditing}
        editingEntry={editingEntry}
        seedText={seedText}
        onClose={() => {
          setEditorOpen(false);
          setSeedText("");
          setEditingEntry(undefined);
          setIsEditing(false);
        }}
        onSubmit={saveEntry}
        loading={loading}
      />
    </div>
  );
}
