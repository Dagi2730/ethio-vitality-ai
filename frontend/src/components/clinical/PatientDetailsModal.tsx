import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WardPatient } from "../../types/ward";

type Props = {
  patient: WardPatient;
  trend: { t: string; stress: number }[];
  open: boolean;
  onClose: () => void;
};

const riskLabel = {
  low: "Stable",
  medium: "Watch",
  high: "Priority",
};

const riskStyles = {
  low: "bg-emerald-50 text-emerald-800",
  medium: "bg-amber-50 text-amber-800",
  high: "bg-rose-50 text-rose-800",
};

export function PatientDetailsModal({ patient, trend, open, onClose }: Props) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/95 shadow-sanctuary backdrop-blur-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex flex-col gap-6 p-6 lg:px-8 lg:py-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-calm-500">
                Patient summary
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-calm-900">{patient.name}</h2>
              <p className="mt-1 text-sm text-calm-500">
                Showing all shared data and consented details from the patient profile.
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                riskStyles[patient.riskBand]
              }`}
            >
              {riskLabel[patient.riskBand]}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-5 rounded-[1.5rem] border border-calm-200 bg-calm-50 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">
                    Department
                  </p>
                  <p className="mt-2 text-sm font-semibold text-calm-900">{patient.department}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">Room</p>
                  <p className="mt-2 text-sm font-semibold text-calm-900">{patient.room}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">Last updated</p>
                  <p className="mt-2 text-sm font-semibold text-calm-900">{patient.lastUpdated}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">Consent</p>
                  <p className="mt-2 text-sm font-semibold text-calm-900">
                    {patient.consentScope ?? "Clinical staff only"}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">
                    Heart rate
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-vitality-800">
                    {patient.heartRate}
                    <span className="text-base font-normal text-calm-400"> BPM</span>
                  </p>
                </div>
                <div className="rounded-3xl border border-white/70 bg-white p-4 shadow-sm">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">Stress</p>
                  <p className="mt-2 text-3xl font-semibold text-vitality-800">
                    {patient.stressLevel}
                    <span className="text-base font-normal text-calm-400">%</span>
                  </p>
                </div>
              </div>

              <div className="space-y-4 rounded-3xl border border-white/70 bg-white p-4 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">Digital mood state</p>
                <p className="text-sm font-semibold text-calm-900">{patient.simulatedMood}</p>
                {patient.notes ? (
                  <p className="text-sm text-calm-600">{patient.notes}</p>
                ) : (
                  <p className="text-sm text-calm-500">
                    No extra notes were shared beyond the patient twin summary.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-calm-500">
                    Shared activities
                  </p>
                  <span className="rounded-full bg-calm-100 px-2 py-1 text-[10px] font-semibold text-calm-600">
                    {patient.sharedActivities?.length ?? 0} items
                  </span>
                </div>
                {patient.sharedActivities && patient.sharedActivities.length > 0 ? (
                  <ul className="space-y-2 text-sm text-calm-700">
                    {patient.sharedActivities.map((item, index) => (
                      <li key={index} className="rounded-2xl bg-calm-100 px-3 py-2">
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-calm-500">No additional shared activity is available.</p>
                )}
              </div>
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.5rem] border border-calm-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-calm-500">Vitals trend</p>
                    <p className="mt-1 text-sm text-calm-500">Continuous stress readings over time.</p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-calm-200 bg-calm-50 px-3 py-1 text-xs text-calm-600 transition hover:bg-calm-100"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-5 h-64">
                  {trend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trend}>
                        <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="stress"
                          stroke="#4a8fbf"
                          strokeWidth={3}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="flex h-full items-center justify-center text-sm text-calm-400">
                      Collecting trend data…
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-calm-200 bg-calm-50 p-5 text-sm text-calm-600">
                <p className="font-semibold text-calm-900">Shared visibility</p>
                <p className="mt-3">
                  The patient has opted in to share this data with the clinical team. Only the fields
                  they consented to are shown here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
