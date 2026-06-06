import { authHeaders, useAuthStore } from "../store/authStore";

/**
 * Backend (FastAPI) base URL — NOT the Vite dev server (5173).
 * Override with VITE_API_URL in frontend/.env
 */
/** In dev, default "" uses Vite proxy (/api → :8000). Set VITE_API_URL to override. */
const API_BASE = (() => {
  const env = import.meta.env.VITE_API_URL;
  if (env !== undefined && env !== "") {
    return String(env).replace(/\/$/, "");
  }
  return import.meta.env.DEV ? "" : "";
})();

async function authFetch(path: string, init?: RequestInit) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error(
      "Cannot reach the API server. Start the backend: cd backend && python -m uvicorn main:app --reload --port 8000"
    );
  }
  return res;
}

export type AuthUser = {
  email: string;
  role: string;
  name: string;
  department?: string;
  user_id?: number;
};

export type LoginResult = {
  access_token: string;
  token_type: string;
  user: AuthUser;
};

function parseApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: string };
    return first.msg || fallback;
  }
  return fallback;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await authFetch("/api/v1/auth/health");
    return res.ok;
  } catch {
    return false;
  }
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await authFetch("/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(parseApiError(err, "Invalid email or password"));
  }
  return res.json();
}

export async function signup(
  email: string,
  password: string,
  name: string,
  department = "General"
): Promise<LoginResult> {
  const res = await authFetch("/api/v1/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name, department }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail || "Sign up failed");
  }
  return res.json();
}

async function apiFetch(path: string, init?: RequestInit) {
  const res = await authFetch(path, {
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

export async function deleteCommunityPost(postId: string) {
  return apiFetch(`/api/v1/community/posts/${postId}`, { method: "DELETE" });
}

export async function updateCommunityPost(postId: string, content: string) {
  return apiFetch(`/api/v1/community/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
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
  spo2?: number;
  simulated_mood?: string;
  sleep_hours?: number;
  timestamp: string;
  source?: string;
  alerts?: string[];
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
  mood: { sentiment: string; emoji: string; timestamp?: string } | null;
  triggers: Trigger[];
  narrative: { stage: string; label_en: string; label_am: string };
  anomalies: unknown[];
  alerts?: string[];
  wellness_score?: number;
};

export type ActionPlanItem = {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  emoji: string;
  completed: boolean;
  reminder_sent?: boolean;
};

export type ActionPlan = {
  date: string;
  status_summary: string;
  active_conditions: string[];
  total_minutes: number;
  actions: ActionPlanItem[];
  vitals_snapshot?: {
    heart_rate?: number;
    stress_level?: number;
    spo2?: number;
    mood?: string;
  };
};

export type CommunityPost = {
  id: string;
  author_id: string; 
  author: string;
  content: string;
  category: string;
  likes: number;
  replies: Array<{ id: string; author: string; content: string; timestamp: string }>;
  timestamp: string;
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

export type WellnessScore = {
  score: number;
  band: string;
  components: { stress: number; mood: number; activity: number };
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
  wellness_score?: WellnessScore;
  mood_prediction?: {
    predicted_sentiment: string;
    confidence: number;
    horizon_hours: number;
    drivers: string[];
  };
  daily_suggestions?: Array<{
    id: string;
    title_en: string;
    title_am: string;
    body_en: string;
    body_am: string;
  }>;
  risk_forecast: { burnout_7d_probability: number; trend: string };
};

export type PrivacySettings = {
  share_with_hr: boolean;
  share_with_doctor: boolean;
  share_vitals: boolean;
  share_mood: boolean;
  share_journal_summary: boolean;
};

export type AppNotification = {
  id: number;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
};

export type WardPatient = import("../types/ward").WardPatient;

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
  data_source?: string;
  readings_count?: number;
  burnout_risk_percent?: number;
  low_oxygen_episodes?: number;
  heart_rate?: { avg: number | null; min: number | null; max: number | null; latest: number | null };
  stress_level?: { avg: number | null; min: number | null; max: number | null; latest: number | null };
  spo2?: { avg: number | null; min: number | null; max: number | null; latest: number | null };
  alert_summary?: {
    high_stress_readings: number;
    low_spo2_readings: number;
    critical_spo2_readings: number;
  };
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

export async function fetchRoutine(lang: string): Promise<ActionPlan & { legacy_blocks?: unknown[] }> {
  return apiFetch(`/api/v1/routine?lang=${lang}`);
}

export async function refreshActionPlan(): Promise<ActionPlan> {
  return apiFetch("/api/v1/routine/refresh", { method: "POST" });
}

export async function completeAction(actionId: string) {
  return apiFetch(`/api/v1/routine/complete/${actionId}`, { method: "POST" });
}

export async function fetchCommunityPosts(category = "all"): Promise<{ posts: CommunityPost[] }> {
  return apiFetch(`/api/v1/community/posts?category=${category}`);
}

export async function postCommunityPost(
  content: string,
  category: string,
  anonymous: boolean
) {
  return apiFetch("/api/v1/community/posts", {
    method: "POST",
    body: JSON.stringify({ content, category, anonymous }),
  });
}

export async function replyCommunityPost(postId: string, content: string, anonymous: boolean) {
  return apiFetch(`/api/v1/community/posts/${postId}/reply`, {
    method: "POST",
    body: JSON.stringify({ content, anonymous }),
  });
}

export async function likeCommunityPost(postId: string) {
  return apiFetch(`/api/v1/community/posts/${postId}/like`, { method: "POST" });
}

export async function fetchMoodHistory() {
  return apiFetch("/api/v1/mood/history");
}

export async function fetchBusinessInsights(): Promise<BusinessInsights> {
  return apiFetch("/api/v1/business/insights");
}

export async function fetchHeatmap() {
  return apiFetch("/api/v1/business/heatmap");
}

export async function fetchClinicalWard(): Promise<{ patients: WardPatient[] }> {
  return apiFetch("/api/v1/clinical/ward");
}

export async function fetchPatientTrend(patientId: string) {
  return apiFetch(`/api/v1/clinical/patients/${patientId}/trend`);
}

export async function fetchPrivacy(): Promise<PrivacySettings> {
  return apiFetch("/api/v1/privacy");
}

export async function updatePrivacy(updates: Partial<PrivacySettings>) {
  return apiFetch("/api/v1/privacy", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

export async function fetchNotifications(): Promise<{ notifications: AppNotification[] }> {
  return apiFetch("/api/v1/notifications");
}

export async function markNotificationRead(id: number) {
  return apiFetch(`/api/v1/notifications/${id}/read`, { method: "POST" });
}
