import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJSON, postJSON } from '../services/api';
import { useState } from 'react';

export default function Patients() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['patients'], queryFn: () => getJSON('/api/patients') });
  const [open, setOpen] = useState(false);
  const createMutation = useMutation({
    mutationFn: (payload: any) => postJSON('/api/patients', payload),
    onSuccess: () => { setOpen(false); qc.invalidateQueries({ queryKey: ['patients'] }); }
  });
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <button onClick={() => setOpen(true)} className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Add Patient</button>
      </div>
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-600 text-sm">Failed to load patients</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Display #</th>
              <th className="p-2">Name</th>
              <th className="p-2">Sex</th>
              <th className="p-2">Age</th>
              <th className="p-2">Phone</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(data) && data.length === 0 && (
              <tr><td className="p-3 text-center text-sm text-gray-500" colSpan={5}>No patients yet.</td></tr>
            )}
            {Array.isArray(data) && data.map((p:any) => (
              <tr key={p.id} onClick={()=>window.location.href=`/patients/${p.id}`} className="border-b hover:bg-gray-50 cursor-pointer">
                <td className="p-2 font-mono">{p.displayNumber}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2">{p.sex}</td>
                <td className="p-2">{p.age ?? '-'}</td>
                <td className="p-2">{p.phone ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {open && <AddPatientModal onClose={() => setOpen(false)} onSave={(p) => createMutation.mutate(p)} loading={createMutation.isPending} />}
    </div>
  );
}

function AddPatientModal({ onClose, onSave, loading }: { onClose: () => void; onSave: (p:any)=>void; loading: boolean }) {
  const [form, setForm] = useState({ name: '', age: '', sex: 'M', phone: '', address: '' });
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Add Patient</h2>
        <div className="space-y-3">
          <Input label="Name" value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,name:e.target.value}))} required />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Age" value={form.age} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,age:e.target.value}))} type="number" />
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Sex</label>
              <select className="border rounded px-2 py-1" value={form.sex} onChange={e=>setForm(f=>({...f,sex:e.target.value}))}>
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input label="Phone" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,phone:e.target.value}))} />
          </div>
          <Input label="Address" value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setForm(f=>({...f,address:e.target.value}))} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-2 text-sm rounded border">Cancel</button>
          <button disabled={loading || !form.name} onClick={()=>onSave({ name: form.name, age: form.age? Number(form.age): undefined, sex: form.sex, phone: form.phone||undefined, address: form.address||undefined })} className="px-4 py-2 bg-primary-600 text-white rounded disabled:opacity-50">{loading ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function Input(props: any) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-600">{props.label}</label>
      <input {...props} className="border rounded px-2 py-1 focus:outline-none focus:ring focus:ring-primary-300" />
    </div>
  );
}
