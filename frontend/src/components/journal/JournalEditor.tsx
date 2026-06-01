import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { FormEvent, useState, useEffect } from "react";
import { useSpeech } from "../../hooks/useSpeech";
import { useWellnessStore } from "../../store/wellnessStore";
import type { JournalEntry } from "../../api/client";

type Props = {
  isOpen: boolean;
  isEditing: boolean;
  editingEntry?: JournalEntry;
  seedText?: string;
  onClose: () => void;
  onSubmit: (content: string, isEditing: boolean) => Promise<void>;
  loading: boolean;
};

const EMOJI_GRID = [
  "😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂",
  "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
  "😘", "😗", "😚", "😙", "🥲", "😋", "😛", "😜",
  "😝", "😌", "😔", "😑", "😐", "😶", "😏", "😒",
  "😞", "😔", "😫", "😩", "🥺", "😢", "😭", "😱",
  "😖", "😣", "😞", "😓", "😩", "😫", "🥱", "😤",
  "😡", "😠", "🤬", "😈", "👿", "💀", "😳", "😥",
  "😦", "😧", "😨", "😰", "😥", "😢", "😭", "😱"
];

export function JournalEditor({
  isOpen,
  isEditing,
  editingEntry,
  seedText = "",
  onClose,
  onSubmit,
  loading,
}: Props) {
  const lang = useWellnessStore((s) => s.lang);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const { supported, listening, startListening, stopListening } = useSpeech(lang);

  const initialContent = isEditing && editingEntry?.text 
    ? editingEntry.text
    : isEditing && editingEntry?.text_preview 
    ? `<p>${editingEntry.text_preview}</p>`
    : seedText 
    ? `<p>${seedText}</p>`
    : "<p></p>";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent,
  });

  useEffect(() => {
    if (editor && isOpen) {
      editor.commands.setContent(initialContent);
      editor.commands.focus("end");
    }
  }, [isOpen, editor]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editor) return;
    
    const html = editor.getHTML();
    const text = editor.getText();
    
    if (!text.trim() || loading) return;
    
    await onSubmit(html, isEditing);
    setSavedFlash(true);
    setTimeout(() => {
      setSavedFlash(false);
      onClose();
    }, 900);
  }

  function insertEmoji(emoji: string) {
    if (editor) {
      editor.commands.insertContent(emoji);
      setShowEmojiPicker(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <header className="border-b border-warm-border bg-white px-4 py-4 md:px-6">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-medium text-ink">
              {isEditing
                ? lang === "am"
                  ? "መጽሐፍ ከአሁን ለውጥ"
                  : "Edit your entry"
                : lang === "am"
                ? "አዲስ መጽሐፍ መዝግብ"
                : "New journal entry"}
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {lang === "am"
                ? "ሪቅ ሪቅ፡ ምን ተሰማዎት"
                : "Write freely, express yourself"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl text-ink-muted transition hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </header>

      {/* Formatting Toolbar */}
      {editor && (
        <div className="border-b border-warm-border bg-warm-bg/50 px-4 py-3 md:px-6">
          <div className="mx-auto max-w-4xl flex flex-wrap items-center gap-1">
            {/* Text Style */}
            <div className="flex items-center gap-0.5 rounded-lg border border-warm-border bg-white p-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`px-3 py-1.5 rounded text-sm font-semibold transition ${
                  editor.isActive("bold")
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`px-3 py-1.5 rounded text-sm italic transition ${
                  editor.isActive("italic")
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`px-3 py-1.5 rounded text-sm line-through transition ${
                  editor.isActive("strike")
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Strikethrough"
              >
                S
              </button>
            </div>

            {/* Headings */}
            <div className="flex items-center gap-0.5 rounded-lg border border-warm-border bg-white p-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`px-3 py-1.5 rounded text-sm font-bold transition ${
                  editor.isActive("heading", { level: 2 })
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Heading"
              >
                H1
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`px-3 py-1.5 rounded text-sm font-bold transition ${
                  editor.isActive("heading", { level: 3 })
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Subheading"
              >
                H2
              </button>
            </div>

            {/* Lists */}
            <div className="flex items-center gap-0.5 rounded-lg border border-warm-border bg-white p-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  editor.isActive("bulletList")
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Bullet list"
              >
                •
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  editor.isActive("orderedList")
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Ordered list"
              >
                1.
              </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 rounded-lg border border-warm-border bg-white p-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("left").run()}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  editor.isActive({ textAlign: "left" })
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Align left"
              >
                ⬅
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("center").run()}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  editor.isActive({ textAlign: "center" })
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Align center"
              >
                ⬈
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().setTextAlign("right").run()}
                className={`px-3 py-1.5 rounded text-sm transition ${
                  editor.isActive({ textAlign: "right" })
                    ? "bg-teal text-white"
                    : "hover:bg-warm-bg"
                }`}
                title="Align right"
              >
                ➡
              </button>
            </div>

            {/* Text Color */}
            <div className="flex items-center gap-0.5 rounded-lg border border-warm-border bg-white p-1">
              <input
                type="color"
                onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                className="h-8 w-8 cursor-pointer rounded border-0"
                title="Text color"
              />
            </div>

            {/* Emoji Picker */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="rounded-lg border border-warm-border bg-white px-3 py-1.5 text-lg transition hover:bg-warm-bg"
                title="Add emoji"
              >
                😊
              </button>
              {showEmojiPicker && (
                <div className="absolute top-full right-0 z-10 mt-1 grid max-h-60 w-60 grid-cols-8 gap-1 overflow-y-auto rounded-lg border border-warm-border bg-white p-2 shadow-lg">
                  {EMOJI_GRID.map((emoji, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => insertEmoji(emoji)}
                      className="text-xl transition hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Clear */}
            <button
              type="button"
              onClick={() => editor.commands.clearContent()}
              className="rounded-lg border border-warm-border bg-white px-3 py-1.5 text-sm text-ink-muted transition hover:text-ink hover:bg-warm-bg"
              title="Clear content"
            >
              {lang === "am" ? "ሰርስር" : "Clear"}
            </button>
          </div>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-auto px-4 py-6 md:px-6">
        <div className="mx-auto max-w-4xl rounded-2xl border border-warm-border bg-white p-6 shadow-sm">
          <EditorContent
            editor={editor}
            className="prose prose-sm max-w-none focus:outline-none [&_.ProseMirror]:min-h-96 [&_.ProseMirror]:text-base [&_.ProseMirror]:leading-relaxed"
          />
        </div>
      </div>

      {/* Footer / Save Section */}
      <div className="border-t border-warm-border bg-white px-4 py-4 md:px-6">
        <div className="mx-auto max-w-4xl">
          {savedFlash ? (
            <p className="mb-3 text-center text-sm font-medium text-teal" aria-live="polite">
              ✓ {isEditing
                ? lang === "am"
                  ? "ተሰተተ"
                  : "Updated"
                : lang === "am"
                ? "ተቀምጧል"
                : "Saved"} — Vitality {lang === "am" ? "ቅሪታ" : "reflects"}
            </p>
          ) : null}
          <form onSubmit={handleSubmit} className="flex gap-3">
            {supported && (
              <button
                type="button"
                onClick={() => {
                  if (listening) stopListening();
                  else
                    startListening((transcript) => {
                      editor?.commands.insertContent(transcript + " ");
                    });
                }}
                className={`flex h-12 w-12 items-center justify-center rounded-full transition shrink-0 ${
                  listening
                    ? "bg-coral-wash text-ink ring-2 ring-coral-wash"
                    : "bg-teal-light text-teal hover:bg-teal/20"
                }`}
                aria-pressed={listening}
              >
                🎤
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-full border border-warm-border text-sm font-medium text-ink transition hover:bg-warm-bg/50"
            >
              {lang === "am" ? "ሰብር" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={loading || !editor?.getText().trim()}
              className="btn-primary flex-1 py-3 px-4 text-sm disabled:opacity-50"
            >
              {loading
                ? "…"
                : isEditing
                ? lang === "am"
                  ? "ከአሁን ለውጥ"
                  : "Update"
                : lang === "am"
                ? "አስቀምጥ"
                : "Save"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
