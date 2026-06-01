import { useEffect, useState } from "react";
import { fetchPrivacy, updatePrivacy, type PrivacySettings } from "../../api/client";

const FIELDS: { key: keyof PrivacySettings; label: string; desc: string }[] = [
  {
    key: "share_with_hr",
    label: "Share with HR",
    desc: "Allow anonymized aggregates in workplace wellness dashboards.",
  },
  {
    key: "share_with_doctor",
    label: "Share with clinical staff",
    desc: "Appear on the clinical ward view for assigned care teams.",
  },
  {
    key: "share_vitals",
    label: "Share vitals",
    desc: "Heart rate and stress readings for professionals.",
  },
  {
    key: "share_mood",
    label: "Share mood check-ins",
    desc: "Mood sentiment labels (not journal text).",
  },
  {
    key: "share_journal_summary",
    label: "Share journal summaries",
    desc: "One-line AI summaries only — never full journal text.",
  },
];

export function PrivacyPage() {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPrivacy().then(setSettings).catch(() => {});
  }, []);

  async function toggle(key: keyof PrivacySettings) {
    if (!settings) return;
    const next = { ...settings, [key]: !settings[key] };
    setSaving(true);
    setMessage("");
    try {
      const updated = await updatePrivacy({ [key]: next[key] });
      setSettings(updated);
      setMessage("Privacy settings saved.");
    } catch {
      setMessage("Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return <p className="py-12 text-center text-calm-400">Loading privacy controls…</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">Privacy</h1>
        <p className="text-sm text-calm-500">
          Control what HR and clinical staff can see. You always own your data.
        </p>
      </header>

      <ul className="space-y-3">
        {FIELDS.map(({ key, label, desc }) => (
          <li key={key} className="card-data flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-calm-900">{label}</p>
              <p className="mt-0.5 text-xs text-calm-500">{desc}</p>
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={() => toggle(key)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition ${
                settings[key] ? "bg-teal" : "bg-calm-300"
              }`}
              aria-pressed={settings[key]}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                  settings[key] ? "left-5" : "left-0.5"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>

      {message && <p className="text-sm text-teal-700">{message}</p>}
    </div>
  );
}
