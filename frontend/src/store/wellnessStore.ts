import { create } from "zustand";
import {
  fetchLatestSensors,
  fetchBusinessInsights,
  fetchAnomalies,
  type AnomalyPoint,
  type BusinessInsights,
  type MoodSentiment,
  type SensorReading,
  postMood,
} from "../api/client";
import { useAuthStore } from "./authStore";

export type HistoryPoint = {
  time: string;
  stress: number;
  heartRate: number;
  isAnomaly?: boolean;
};

type WellnessState = {
  lang: "en" | "am";
  latest: SensorReading | null;
  history: HistoryPoint[];
  anomalies: AnomalyPoint[];
  latestAnomalyPrompt: string | null;
  mood: { sentiment: MoodSentiment; emoji: string; timestamp?: string } | null;
  moodInsight: string | null;
  recommendedAction: string | null;
  crisisActive: boolean;
  insights: BusinessInsights | null;
  polling: boolean;
  error: string | null;
  setLang: (lang: "en" | "am") => void;
  setRecommendedAction: (action: string | null) => void;
  setCrisisActive: (active: boolean) => void;
  logMood: (sentiment: MoodSentiment, emoji: string) => Promise<boolean>;
  hydrateMood: (mood: { sentiment: MoodSentiment; emoji: string; timestamp?: string } | null) => void;
  pollSensors: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
};

let pollTimer: ReturnType<typeof setInterval> | null = null;

function markAnomaliesInHistory(
  history: HistoryPoint[],
  anomalies: AnomalyPoint[]
): HistoryPoint[] {
  return history.map((h) => ({
    ...h,
    isAnomaly: anomalies.some(
      (a) =>
        a.heart_rate === h.heartRate &&
        Math.abs(a.stress_level - h.stress) <= 3
    ),
  }));
}

export const useWellnessStore = create<WellnessState>((set, get) => ({
  lang: "en",
  latest: null,
  history: [],
  anomalies: [],
  latestAnomalyPrompt: null,
  mood: null,
  moodInsight: null,
  recommendedAction: null,
  crisisActive: false,
  insights: null,
  polling: false,
  error: null,

  setLang: (lang) => set({ lang }),
  setRecommendedAction: (recommendedAction) => set({ recommendedAction }),
  setCrisisActive: (crisisActive) => set({ crisisActive }),

  hydrateMood: (mood) => {
    if (mood?.sentiment && mood?.emoji) {
      set({
        mood: {
          sentiment: mood.sentiment as MoodSentiment,
          emoji: mood.emoji,
          timestamp: mood.timestamp,
        },
      });
    }
  },

  logMood: async (sentiment, emoji) => {
    try {
      const data = await postMood(sentiment, emoji);
      if (data.status !== "saved") {
        set({ error: "Could not save mood" });
        return false;
      }
      set({
        mood: { sentiment, emoji, timestamp: data.mood.timestamp },
        moodInsight: data.insight,
        error: null,
      });
      return true;
    } catch {
      set({ error: "Could not save mood" });
      return false;
    }
  },

  pollSensors: async () => {
    try {
      const [reading, anomalyData] = await Promise.all([
        fetchLatestSensors(),
        fetchAnomalies(),
      ]);
      const label = new Date(reading.timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      const lang = get().lang;
      set((s) => {
        const history = [
          ...s.history.slice(-59),
          {
            time: label,
            stress: reading.stress_level,
            heartRate: reading.heart_rate,
          },
        ];
        return {
          latest: reading,
          error: null,
          anomalies: anomalyData.anomalies,
          latestAnomalyPrompt:
            lang === "am" ? anomalyData.prompt_am : anomalyData.prompt_en,
          history: markAnomaliesInHistory(history, anomalyData.anomalies),
        };
      });
    } catch {
      set({ error: "Unable to reach wellness API" });
    }
  },

  fetchInsights: async () => {
    if (!useAuthStore.getState().token) {
      return;
    }
    try {
      const insights = await fetchBusinessInsights();
      set({ insights, error: null });
    } catch {
      set({ error: "Unable to load corporate insights" });
    }
  },

  startPolling: () => {
    if (get().polling) return;
    set({ polling: true });
    get().pollSensors();
    pollTimer = setInterval(() => get().pollSensors(), 5000);
  },

  stopPolling: () => {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
    set({ polling: false });
  },
}));
