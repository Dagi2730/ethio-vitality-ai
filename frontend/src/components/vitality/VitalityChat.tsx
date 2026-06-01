import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { sendChat, type ChatResponsePayload } from "../../api/client";
import { useSpeech } from "../../hooks/useSpeech";
import { useWellnessStore } from "../../store/wellnessStore";
import { BreathingGuide } from "../dashboard/BreathingGuide";
import { LanguageToggle } from "../layout/LanguageToggle";
import { CalmWaveVisual } from "./CalmWaveVisual";
import { VitalityIntro } from "./VitalityIntro";

export type ChatMsg = {
  role: "user" | "assistant";
  content: string;
  detectedLang?: string;
  recommendedAction?: string;
};

const POETIC_EMPTY = {
  en: "What's stealing your sunshine today?",
  am: "ዛሬ የሚያሳብቅዎት ምንድን ነው?",
};

export function VitalityChat() {
  const lang = useWellnessStore((s) => s.lang);
  const setRecommendedAction = useWellnessStore((s) => s.setRecommendedAction);
  const setCrisisActive = useWellnessStore((s) => s.setCrisisActive);

  const [started, setStarted] = useState(false);
  const [textMode, setTextMode] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [showBreathing, setShowBreathing] = useState(false);
  const [breathingData, setBreathingData] = useState<ChatResponsePayload["crisis_support"]>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const immersive = started;

  const { supported, listening, startListening, stopListening, speak, stopSpeaking } =
    useSpeech(lang);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function begin(seed?: string) {
    setStarted(true);
    if (seed) dispatchMessage(seed);
  }

  async function dispatchMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (!started) setStarted(true);

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await sendChat(trimmed, lang, true, history);
      const replyLang = res.detected_lang || lang;
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: res.reply,
          detectedLang: replyLang,
          recommendedAction: res.recommended_action,
        },
      ]);
      setRecommendedAction(res.recommended_action);
      setCrisisActive(res.crisis.active);

      if (
        res.recommended_action === "breathing_exercise" ||
        res.recommended_action === "crisis_support"
      ) {
        setBreathingData(res.crisis_support);
        setShowBreathing(true);
      }

      if (voiceOn) speak(res.reply, replyLang);
    } catch {
      const err =
        lang === "am"
          ? "ግንኙነት አልተሳካም። እባክዎ ይሞክሩ።"
          : "Could not reach Vitality. Try once more.";
      setMessages((m) => [...m, { role: "assistant", content: err, detectedLang: lang }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    dispatchMessage(input);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e as unknown as FormEvent);
    }
  }

  function toggleMic() {
    if (listening) {
      stopListening();
      return;
    }
    startListening((t) => {
      setInput(t);
      dispatchMessage(t);
    });
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  return (
    <>
      <div
        className={`vitality-chat-shell relative z-10 ${
          immersive ? "vitality-immersive" : ""
        }`}
      >
        <header
          className={`flex shrink-0 items-center justify-between px-4 py-3 ${
            immersive
              ? "border-b border-white/10 bg-transparent"
              : "border-b border-white/40 bg-white/50 backdrop-blur-lg"
          }`}
        >
          <div className="flex items-center gap-2">
            <Link
              to="/personal"
              className={`text-sm ${immersive ? "text-white/80 hover:text-white" : "text-ink-muted hover:text-ink"}`}
              aria-label="Back"
            >
              ←
            </Link>
            <span
              className={`font-display text-lg font-medium ${
                immersive ? "text-white" : "text-ink"
              }`}
            >
              Vitality
            </span>
            <span
              className={`h-2 w-2 rounded-full ${immersive ? "bg-white" : "bg-teal"} animate-pulse-soft`}
            />
          </div>
          <LanguageToggle compact immersive={immersive} />
        </header>

        {!started ? (
          <VitalityIntro onStart={begin} />
        ) : (
          <div className="mx-auto flex w-full max-w-chat flex-1 flex-col px-4">
            <div className="flex flex-1 flex-col overflow-y-auto py-4">
              {immersive && (
                <div className="mb-4 flex flex-col items-center text-center">
                  <CalmWaveVisual active={loading || listening} />
                  {!lastAssistant && !loading && (
                    <p className="mt-2 max-w-sm animate-fade-in font-display text-xl font-medium leading-snug text-white md:text-2xl">
                      {POETIC_EMPTY[lang]}
                    </p>
                  )}
                </div>
              )}

              <div className={`space-y-5 ${immersive ? "text-white" : ""}`}>
                {messages.map((msg, i) =>
                  msg.role === "user" ? (
                    <div key={i} className="flex justify-end animate-fade-in">
                      {immersive ? (
                        <p className="max-w-[85%] text-right text-[15px] leading-relaxed text-white/95">
                          {msg.content}
                        </p>
                      ) : (
                        <div className="vitality-msg-user">
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div key={i} className="animate-fade-in">
                      {!immersive && (
                        <span className="mb-1 block text-[11px] font-medium text-teal">
                          Vitality
                        </span>
                      )}
                      {immersive ? (
                        <p className="max-w-[90%] text-base leading-[1.85] text-white/95">
                          {msg.content}
                        </p>
                      ) : (
                        <div
                          className={`vitality-msg-ai ${
                            (msg.detectedLang || lang) === "am" ? "vitality-msg-ai-am" : ""
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      )}
                      {msg.recommendedAction === "breathing_exercise" && (
                        <button
                          type="button"
                          onClick={() => setShowBreathing(true)}
                          className={`mt-3 text-sm font-medium underline underline-offset-2 ${
                            immersive ? "text-white/90" : "text-teal"
                          }`}
                        >
                          {lang === "am" ? "መተንፈሻ" : "Breathing"}
                        </button>
                      )}
                    </div>
                  )
                )}

                {loading && (
                  <div
                    className="flex justify-center gap-1.5 py-4"
                    aria-label="Vitality is reflecting"
                  >
                    <span className={`vitality-typing-dot ${immersive ? "!bg-white/60" : ""}`} />
                    <span className={`vitality-typing-dot ${immersive ? "!bg-white/60" : ""}`} />
                    <span className={`vitality-typing-dot ${immersive ? "!bg-white/60" : ""}`} />
                  </div>
                )}
              </div>
              <div ref={bottomRef} />
            </div>
          </div>
        )}

        {started && (
          <div
            className={
              immersive ? "vitality-immersive-bar" : "vitality-input-bar"
            }
          >
            {textMode ? (
              <form
                onSubmit={onSubmit}
                className="mx-auto flex max-w-chat items-end gap-2 px-2"
              >
                <button
                  type="button"
                  onClick={() => setTextMode(false)}
                  className={`shrink-0 rounded-full p-2.5 ${
                    immersive ? "text-white/80" : "text-ink-muted"
                  }`}
                  aria-label="Voice mode"
                >
                  <MicIcon />
                </button>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  rows={1}
                  placeholder={
                    lang === "am" ? "ይጻፉ…" : "Type here…"
                  }
                  className={`max-h-[100px] min-h-[44px] flex-1 resize-none rounded-2xl px-4 py-2.5 text-sm outline-none ${
                    immersive
                      ? "bg-white/15 text-white placeholder:text-white/50"
                      : "bg-warm-bg text-ink"
                  }`}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="vitality-fab-send shrink-0 disabled:opacity-40"
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              </form>
            ) : (
              <div className="mx-auto flex max-w-chat items-center justify-center gap-6 px-4 py-2">
                <button
                  type="button"
                  onClick={() => setTextMode(true)}
                  className={`rounded-full p-3 transition ${
                    immersive
                      ? "text-white/70 hover:bg-white/10 hover:text-white"
                      : "text-ink-muted hover:bg-teal-light"
                  }`}
                  aria-label="Keyboard"
                >
                  <KeyboardIcon />
                </button>
                {supported && (
                  <button
                    type="button"
                    onClick={toggleMic}
                    className={`vitality-fab-mic ${listening ? "vitality-fab-mic-active" : ""}`}
                    aria-pressed={listening}
                  >
                    <MicIcon large />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setVoiceOn((v) => !v);
                    if (voiceOn) stopSpeaking();
                  }}
                  className={`rounded-full p-3 text-lg ${
                    immersive ? "text-white/70 hover:text-white" : "text-ink-muted"
                  }`}
                  title={voiceOn ? "Mute replies" : "Voice replies on"}
                >
                  {voiceOn ? "🔊" : "🔇"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (input.trim()) dispatchMessage(input);
                  }}
                  disabled={!input.trim()}
                  className={`vitality-fab-send ${immersive ? "vitality-fab-send-immersive" : ""} disabled:opacity-30`}
                  aria-label="Send"
                >
                  <SendIcon />
                </button>
              </div>
            )}
            {listening && (
              <p
                className={`pb-2 text-center text-xs ${
                  immersive ? "text-white/70" : "text-ink-muted"
                }`}
              >
                {lang === "am" ? "እየሰማሁ…" : "Listening…"}
              </p>
            )}
          </div>
        )}
      </div>

      {showBreathing && (
        <BreathingGuide
          guideText={breathingData?.breathing_guide}
          supportResources={breathingData?.support_resources}
          onClose={() => setShowBreathing(false)}
        />
      )}
    </>
  );
}

function MicIcon({ large }: { large?: boolean }) {
  return (
    <svg
      className={large ? "h-7 w-7" : "h-5 w-5"}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z" />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm2 2v2h2V7H6zm4 0v2h2V7h-2zm4 0v2h2V7h-2zm4 0v2h2V7h-2zM6 11v2h2v-2H6zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zm4 0v2h2v-2h-2zM8 15h8v2H8v-2z" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M3.4 20.4 21 12 3.4 3.6l1.8 7.2L17 12l-11.8 1.2-1.8 7.2z" />
    </svg>
  );
}
