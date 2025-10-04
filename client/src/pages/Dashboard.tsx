import { useQuery } from '@tanstack/react-query';
import { getJSON } from '../services/api';
import { SummaryResponse } from '../types';

export default function Dashboard() {
  const { data, isLoading, error } = useQuery({ queryKey: ['summary'], queryFn: () => getJSON<SummaryResponse>('/api/summary') });
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <KpiCard label="Total Patients" value={isLoading ? '…' : (error ? 'ERR' : data?.totalPatients ?? '--')} />
        <KpiCard label="Total Revenue" value={isLoading ? '…' : (error ? 'ERR' : (data?.totalRevenue ?? 0).toLocaleString())} />
        <KpiCard label="Pending Lab Works" value={isLoading ? '…' : (error ? 'ERR' : data?.pendingLabWorks ?? '--')} />
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded shadow p-4 flex flex-col gap-2">
      <span className="text-sm text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold">{value}</span>
    </div>
  );
}
