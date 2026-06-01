import { useMemo, useState } from "react";
import { MOCK_WARD_PATIENTS } from "../../data/mockWardPatients";
import { PatientTwinCard } from "../../components/clinical/PatientTwinCard";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function mockTrend(stress: number) {
  return Array.from({ length: 8 }, (_, i) => ({
    t: `${i * 5}m`,
    stress: Math.max(10, Math.min(95, stress + (Math.random() - 0.5) * 20)),
  }));
}

export function ClinicalWardView() {
  const [selectedId, setSelectedId] = useState(MOCK_WARD_PATIENTS[0]?.id ?? "");
  const selected = MOCK_WARD_PATIENTS.find((p) => p.id === selectedId);
  const trend = useMemo(
    () => (selected ? mockTrend(selected.stressLevel) : []),
    [selectedId, selected?.stressLevel]
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">Clinical Ward</h1>
        <p className="text-sm text-calm-500">
          Command center — select a patient to view live Digital Twin wellness trends.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MOCK_WARD_PATIENTS.map((patient) => (
          <PatientTwinCard
            key={patient.id}
            patient={patient}
            selected={patient.id === selectedId}
            onSelect={setSelectedId}
          />
        ))}
      </div>

      {selected && (
        <div className="card-data">
          <h2 className="text-sm font-semibold text-calm-800">
            Trend — {selected.name}
          </h2>
          <p className="mb-4 text-xs text-calm-500">
            Simulated stress trajectory (MQTT-ready ingest per patient)
          </p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <XAxis dataKey="t" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="stress"
                  stroke="#4a8fbf"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
