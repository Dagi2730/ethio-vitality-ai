import { useEffect, useState } from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchClinicalWard, fetchPatientTrend, type WardPatient } from "../../api/client";
import { PatientDetailsModal } from "../../components/clinical/PatientDetailsModal";
import { PatientTwinCard } from "../../components/clinical/PatientTwinCard";

export function ClinicalWardView() {
  const [patients, setPatients] = useState<WardPatient[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [trend, setTrend] = useState<{ t: string; stress: number }[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchClinicalWard()
      .then((res) => {
        setPatients(res.patients);
        if (res.patients.length > 0) {
          setSelectedId(res.patients[0].id);
        }
      })
      .catch(() => setError("Could not load ward data"))
      .finally(() => setLoading(false));
    const id = setInterval(() => {
      fetchClinicalWard()
        .then((res) => setPatients(res.patients))
        .catch(() => {});
    }, 20000);
    return () => clearInterval(id);
  }, []);

  function openPatientDetails(id: string) {
    setSelectedId(id);
    setDetailOpen(true);
  }

  useEffect(() => {
    if (!selectedId) return;
    fetchPatientTrend(selectedId)
      .then((res) => setTrend(res.trend ?? []))
      .catch(() => setTrend([]));
  }, [selectedId]);

  const selected = patients.find((p) => p.id === selectedId);

  if (loading) {
    return <p className="py-12 text-center text-calm-400">Loading ward roster…</p>;
  }

  if (error) {
    return <p className="py-12 text-center text-rose-600">{error}</p>;
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-calm-900">Clinical Ward</h1>
        <p className="text-sm text-calm-500">
          Live patient twins from users who opted in to share with clinical staff.
        </p>
      </header>

      {patients.length === 0 ? (
        <p className="rounded-lg border border-calm-200 bg-calm-50 px-4 py-6 text-sm text-calm-600">
          No patients have shared data with clinical staff yet. Users can enable sharing under
          Privacy settings.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <PatientTwinCard
                key={patient.id}
                patient={patient}
                selected={patient.id === selectedId}
                onSelect={openPatientDetails}
              />
            ))}
          </div>

          {selected && (
            <div className="card-data">
              <h2 className="text-sm font-semibold text-calm-800">
                Trend — {selected.name}
              </h2>
              <p className="mb-4 text-xs text-calm-500">Stress from stored vital readings</p>
              <div className="h-48">
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
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-calm-400">Collecting trend data…</p>
                )}
              </div>
            </div>
          )}

          {selected && (
            <PatientDetailsModal
              patient={selected}
              trend={trend}
              open={detailOpen}
              onClose={() => setDetailOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
