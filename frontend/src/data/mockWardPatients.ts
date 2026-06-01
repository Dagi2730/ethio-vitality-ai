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
};

/** Mock ward roster — replace with API / MQTT-backed twins in production. */
export const MOCK_WARD_PATIENTS: WardPatient[] = [
  {
    id: "p-001",
    name: "Abebe K.",
    department: "Internal Medicine",
    room: "Ward 3A",
    heartRate: 78,
    stressLevel: 42,
    simulatedMood: "calm",
    riskBand: "low",
    lastUpdated: "2 min ago",
  },
  {
    id: "p-002",
    name: "Sara M.",
    department: "Cardiology",
    room: "Ward 2B",
    heartRate: 96,
    stressLevel: 68,
    simulatedMood: "anxious",
    riskBand: "medium",
    lastUpdated: "1 min ago",
  },
  {
    id: "p-003",
    name: "Dawit H.",
    department: "Oncology",
    room: "Ward 4C",
    heartRate: 88,
    stressLevel: 55,
    simulatedMood: "tired",
    riskBand: "medium",
    lastUpdated: "3 min ago",
  },
  {
    id: "p-004",
    name: "Hanna T.",
    department: "Maternity",
    room: "Ward 1A",
    heartRate: 72,
    stressLevel: 38,
    simulatedMood: "calm",
    riskBand: "low",
    lastUpdated: "Just now",
  },
  {
    id: "p-005",
    name: "Yonas B.",
    department: "Emergency",
    room: "ER-12",
    heartRate: 112,
    stressLevel: 82,
    simulatedMood: "anxious",
    riskBand: "high",
    lastUpdated: "30 sec ago",
  },
  {
    id: "p-006",
    name: "Meron G.",
    department: "Psychiatry",
    room: "Ward 5D",
    heartRate: 84,
    stressLevel: 61,
    simulatedMood: "low",
    riskBand: "medium",
    lastUpdated: "4 min ago",
  },
];
