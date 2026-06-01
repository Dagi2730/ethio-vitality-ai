export type WardPatient = {
  id: string;
  name: string;
  department: string;
  room: string;
  heartRate: number;
  stressLevel: number;
  simulatedMood: string;
  riskBand: "low" | "medium" | "high";
  lastUpdated: string;
  consentScope?: string;
  notes?: string;
  sharedActivities?: string[];
};
