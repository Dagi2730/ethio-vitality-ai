import { authHeaders, useAuthStore } from "../store/authStore";

/**
 * Backend (FastAPI) base URL — NOT the Vite dev server (5173).
 * Override with VITE_API_URL in frontend/.env
 */
const API_BASE =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "");

export type LoginResult = {
  access_token: string;
  token_type: string;
  user: { email: string; role: string; name: string };
};

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...init?.headers,
    },
  });
  if (res.status === 401) {
    useAuthStore.getState().logout();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  return res.json();
}

export type MoodSentiment =
  | "great"
  | "okay"
  | "low"
  | "sad"
  | "anxious"
  | "overwhelmed";

export type AnomalyPoint = {
  index: number;
  timestamp: string;
  heart_rate: number;
  stress_level: number;
  label_time: string;
  type: string;
};

export type SensorReading = {
  heart_rate: number;
  stress_level: number;
  simulated_mood?: string;
  sleep_hours?: number;
  timestamp: string;
  source?: string;
};

export type Trigger = {
  id: string;
  severity: string;
  type: string;
  action: string;
  title_en: string;
  title_am: string;
  message_en: string;
  message_am: string;
};

export type DashboardPayload = {
  vitals: SensorReading;
  mood: { sentiment: string; emoji: string } | null;
  triggers: Trigger[];
  narrative: { stage: string; label_en: string; label_am: string };
  anomalies: unknown[];
};

export type ChatResponsePayload = {
  reply: string;
  detected_lang: string;
  recommended_action: string;
  crisis: { active: boolean; severity: string };
  crisis_support?: {
    breathing_guide: string;
    support_resources: Array<{ name: string; note: string; contact: string }>;
  };
  anomaly_prompt?: string | null;
};

export type PersonalInsights = {
  summary: Record<string, unknown>;
  habits: Record<string, number>;
  predictions: Array<{
    factor: string;
    insight_en: string;
    insight_am: string;
    confidence: number;
  }>;
  risk_forecast: { burnout_7d_probability: number; trend: string };
};

export type JournalEntry = {
  id: number;
  text_preview: string;
  text?: string;
  extracted_emotion: string;
  intensity: number;
  summary_one_line: string;
  timestamp: string;
};

export type RoutineBlock = {
  time: string;
  activity: string;
  category: string;
  priority?: boolean;
};

export type BusinessInsights = {
  privacy_notice: string;
  organization: {
    average_stress: number;
    classification: string;
    departments_monitored: number;
    active_alerts: number;
  };
  departments: Array<{
    department: string;
    average_stress: number;
    classification: string;
    burnout_risk: string;
    headcount: number;
  }>;
  alerts: Array<{ department: string; severity: string; message: string }>;
  burnout_heatmap: {
    days: string[];
    departments: string[];
    cells: Array<{
      department: string;
      day: string;
      stress_index: number;
      risk_band: string;
    }>;
  };
};

export async function fetchDashboard(): Promise<DashboardPayload> {
  return apiFetch("/api/v1/dashboard");
}

export async function fetchLatestSensors(): Promise<SensorReading> {
  return apiFetch("/api/v1/sensors/latest");
}

export async function fetchAnomalies() {
  return apiFetch("/api/v1/sensors/anomalies");
}

export async function fetchTriggers() {
  return apiFetch("/api/v1/triggers");
}

export async function postMood(sentiment: string, emoji: string) {
  return apiFetch("/api/v1/mood", {
    method: "POST",
    body: JSON.stringify({ sentiment, emoji }),
  });
}

export type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function sendChat(
  input: string,
  lang: string,
  autoDetect = true,
  messages: ChatHistoryMessage[] = []
): Promise<ChatResponsePayload> {
  return apiFetch("/api/v1/chat", {
    method: "POST",
    body: JSON.stringify({
      input,
      lang,
      auto_detect_lang: autoDetect,
      messages: messages.slice(-24),
    }),
  });
}

export async function fetchPersonalInsights(): Promise<PersonalInsights> {
  return apiFetch("/api/v1/insights/personal");
}

export async function postJournal(text: string, source: "text" | "voice" = "text") {
  return apiFetch("/api/v1/journal", {
    method: "POST",
    body: JSON.stringify({ text, source }),
  });
}

export async function updateJournal(id: number, text: string) {
  return apiFetch(`/api/v1/journal/${id}`, {
    method: "PUT",
    body: JSON.stringify({ text }),
  });
}

export async function fetchJournal(): Promise<{ entries: JournalEntry[] }> {
  return apiFetch("/api/v1/journal");
}

export async function fetchRoutine(lang: string) {
  return apiFetch(`/api/v1/routine?lang=${lang}`);
}

export async function fetchBusinessInsights(): Promise<BusinessInsights> {
  return apiFetch("/api/v1/business/insights");
}

export async function fetchHeatmap() {
  return apiFetch("/api/v1/business/heatmap");
}
