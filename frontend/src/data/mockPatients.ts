export type WardPatient = {
  id: string;
  name: string;
  department: string;
  heartRate: number;
  stressLevel: number;
  mood: string;
  classification: "Low" | "Medium" | "High";
  lastUpdated: string;
};

export const MOCK_WARD_PATIENTS: WardPatient[] = [
  {
    id: "p-001",
    name: "Sara T.",
    department: "Cardiology",
    heartRate: 88,
    stressLevel: 72,
    mood: "anxious",
    classification: "High",
    lastUpdated: "2 min ago",
  },
  {
    id: "p-002",
    name: "Daniel M.",
    department: "General Ward",
    heartRate: 74,
    stressLevel: 48,
    mood: "calm",
    classification: "Medium",
    lastUpdated: "1 min ago",
  },
  {
    id: "p-003",
    name: "Hanna G.",
    department: "Maternity",
    heartRate: 82,
    stressLevel: 65,
    mood: "tired",
    classification: "Medium",
    lastUpdated: "3 min ago",
  },
  {
    id: "p-004",
    name: "Yonas K.",
    department: "ICU Step-down",
    heartRate: 102,
    stressLevel: 84,
    mood: "overwhelmed",
    classification: "High",
    lastUpdated: "Just now",
  },
  {
    id: "p-005",
    name: "Meron A.",
    department: "Outpatient",
    heartRate: 68,
    stressLevel: 32,
    mood: "calm",
    classification: "Low",
    lastUpdated: "4 min ago",
  },
  {
    id: "p-006",
    name: "Abel H.",
    department: "Surgery Recovery",
    heartRate: 79,
    stressLevel: 58,
    mood: "okay",
    classification: "Medium",
    lastUpdated: "2 min ago",
  },
];
