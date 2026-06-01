import type { WardPatient } from "../../data/mockWardPatients";

const riskStyles = {
  low: "border-emerald-200 bg-emerald-50/50",
  medium: "border-amber-200 bg-amber-50/40",
  high: "border-rose-200 bg-rose-50/50",
};

const riskLabel = {
  low: "Stable",
  medium: "Watch",
  high: "Priority",
};

type Props = {
  patient: WardPatient;
  selected?: boolean;
  onSelect: (id: string) => void;
};

export function PatientTwinCard({ patient, selected, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={() => onSelect(patient.id)}
      className={`card w-full text-left transition hover:shadow-md ${
        riskStyles[patient.riskBand]
      } ${selected ? "ring-2 ring-vitality-500" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-calm-900">{patient.name}</p>
          <p className="text-xs text-calm-500">
            {patient.department} · {patient.room}
          </p>
        </div>
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-medium uppercase text-calm-600">
          {riskLabel[patient.riskBand]}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] uppercase text-calm-400">Heart rate</p>
          <p className="text-xl font-semibold text-vitality-800">
            {patient.heartRate}
            <span className="text-sm font-normal text-calm-400"> BPM</span>
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase text-calm-400">Stress</p>
          <p className="text-xl font-semibold text-vitality-800">
            {patient.stressLevel}
            <span className="text-sm font-normal text-calm-400">%</span>
          </p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 overflow-hidden rounded-full bg-calm-200">
          <div
            className={`h-full rounded-full ${
              patient.stressLevel >= 75
                ? "bg-rose-500"
                : patient.stressLevel >= 50
                  ? "bg-amber-400"
                  : "bg-vitality-500"
            }`}
            style={{ width: `${patient.stressLevel}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-calm-500">
          Digital Twin · {patient.simulatedMood} · {patient.lastUpdated}
        </p>
      </div>
    </button>
  );
}
