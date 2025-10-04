import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJSON, postJSON, patchJSON } from '../services/api';
import { PatientFullResponse, ComplaintOption, QuadrantOption, OralFindingOption, TreatmentOption, Payment, Visit, OrthodonticPlan, RootCanalPlan } from '../types';
import { useState, useMemo, useRef, useEffect } from 'react';
import ToothChart, { ToothChartFinding, ToothChartTreatment } from '../components/ToothChart';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PatientDetail() {
  const { id } = useParams();
  const patientId = Number(id);
  const qc = useQueryClient();
  const loggedRef = useRef(false);
  useEffect(()=> { if(!loggedRef.current){ console.log('PatientDetail mounted'); loggedRef.current = true; } },[]);
  const { data, isLoading, error } = useQuery({ queryKey: ['patient-full', patientId], queryFn: () => getJSON<PatientFullResponse>(`/api/patients/${patientId}/full`) });
  const [viewVisitId, setViewVisitId] = useState<number|null>(null);
  const [editingVisitId, setEditingVisitId] = useState<number|null>(null);
  const [followUpFor, setFollowUpFor] = useState<number|null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id:number; isFollowUp:boolean }|null>(null);

  if(isLoading) return <div className="p-6">Loading...</div>;
  if(error || !data) return <div className="p-6 text-red-600">Failed to load patient.</div>;

  const patient = data.patient as any;
  const visits = data.visits as any[];
  const payments = data.payments as Payment[];
  const totalPaid = payments.reduce((s,p)=> s + p.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-800">{patient.name} <span className="text-base font-normal text-gray-500">#{patient.displayNumber}</span></h1>
        </div>
        <div className="text-sm text-gray-600">Total Paid: <strong>{totalPaid}</strong></div>
      </div>
      {/* Main Two-Column Layout */}
      <section className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 text-sm">
            <h2 className="text-base font-semibold mb-4 text-gray-800 flex items-center justify-between">
              <span>Patient Details</span>
              <span className="text-[10px] font-normal text-gray-400">ID #{patient.displayNumber}</span>
            </h2>
            <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
              <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[11px] uppercase tracking-wide">Age</span><span>{patient.age ?? '-'}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[11px] uppercase tracking-wide">Sex</span><span>{patient.sex}</span></div>
              <div className="flex flex-col gap-0.5">
                <span className="text-gray-500 text-[11px] uppercase tracking-wide">Phone</span>
                <span className="flex items-center gap-2">
                  {patient.phone ?? '-'}
                  {patient.phone && (
                    <button type="button" onClick={()=> openWhatsApp(patient.phone!)} className="inline-flex items-center gap-1 text-green-600 text-xs font-medium hover:underline">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M20.52 3.48A11.8 11.8 0 0 0 12.04 0C5.5 0 .2 5.3.2 11.82c0 2.08.54 4.13 1.57 5.94L0 24l6.4-1.66a11.82 11.82 0 0 0 5.63 1.44h.01c6.54 0 11.84-5.3 11.84-11.82 0-3.16-1.23-6.13-3.46-8.48ZM12.04 21.3a9.5 9.5 0 0 1-4.85-1.33l-.35-.2-3.8.98 1.02-3.7-.23-.38a9.46 9.46 0 0 1-1.44-4.94c0-5.22 4.26-9.47 9.5-9.47 2.54 0 4.92.98 6.72 2.76a9.46 9.46 0 0 1 2.78 6.7c0 5.22-4.26 9.48-9.5 9.48Zm5.22-7.1c-.28-.14-1.65-.81-1.9-.9-.26-.1-.45-.14-.64.14-.19.27-.73.9-.9 1.08-.17.19-.34.2-.62.07-.28-.14-1.18-.44-2.25-1.4-.83-.74-1.39-1.66-1.55-1.94-.16-.27-.02-.42.12-.56.12-.12.28-.31.42-.46.14-.15.18-.27.28-.46.09-.2.04-.36-.02-.5-.07-.14-.64-1.54-.88-2.1-.23-.55-.47-.48-.64-.49h-.55c-.2 0-.52.07-.79.36-.27.28-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.38.71.3 1.26.48 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.65-.67 1.89-1.31.23-.64.23-1.19.16-1.31-.06-.12-.25-.2-.53-.35Z"/></svg>
                      WhatsApp
                    </button>
                  )}
                </span>
              </div>
              <div className="flex flex-col gap-0.5"><span className="text-gray-500 text-[11px] uppercase tracking-wide">Email</span><span>{(patient as any).email ?? '-'}</span></div>
              <div className="flex flex-col gap-0.5 sm:col-span-2"><span className="text-gray-500 text-[11px] uppercase tracking-wide">Address</span><span className="truncate">{patient.address ?? '-'}</span></div>
            </div>
          </div>
          <div className="text-sm"><PatientHistoryCard /></div>
        </div>
        {/* Right Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Visits Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Visits</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <AddVisitModalLauncher patientId={patientId} visits={visits as any} onCreated={()=> { qc.invalidateQueries({ queryKey: ['patient-full', patientId] }); qc.invalidateQueries({ queryKey: ['summary'] }); }} />
                {visits.length>0 && <button type="button" onClick={()=> setFollowUpFor(visits[0].id)} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded shadow-sm">+ Follow-Up</button>}
              </div>
            </div>
            <div className="border rounded-md divide-y bg-gray-50/40 overflow-hidden">
              <div className="max-h-[480px] overflow-y-auto thin-scrollbar">
                {visits.filter((v:any)=> !v.followUpOf).map((v:any)=> {
                  const gd = v.generalDetails; // eslint-disable-line @typescript-eslint/no-unused-vars
                  return (
                    <div key={v.id} className="p-4 flex flex-col gap-2 hover:bg-white transition">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-semibold text-gray-800">{v.type} Visit</span>
                          <span className="text-xs text-gray-500">{new Date(v.date).toLocaleDateString()}</span>
                          {gd?.treatmentPlans?.length ? <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">{gd.treatmentPlans.length} plan</span> : null}
                          {gd?.treatmentsDone?.length ? <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px]">{gd.treatmentsDone.length} done</span> : null}
                          {(v as any).prescriptions?.length ? <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-[10px]">{(v as any).prescriptions.length} rx</span> : null}
                          {gd?.investigations?.length ? <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-[10px]">{gd.investigations.length} inv</span> : null}
                          {gd?.nextAppointmentDate ? <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px]">↦ {new Date(gd.nextAppointmentDate).toLocaleDateString()}</span> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={()=> setViewVisitId(v.id)} className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">View</button>
                          <button onClick={()=> setEditingVisitId(v.id)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">Edit</button>
                          <button onClick={()=> setFollowUpFor(v.id)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">+ Follow-Up</button>
                          <button onClick={()=> setDeleteTarget({ id: v.id, isFollowUp:false })} className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded">Delete</button>
                        </div>
                      </div>
                      {v.followUps?.length ? (
                        <div className="flex flex-wrap gap-2 ml-1">
                          {v.followUps.map((fu:any)=> (
                            <div key={fu.id} className="flex items-center gap-2 text-[11px] bg-white border rounded px-2 py-1 shadow-sm">
                              <span>{new Date(fu.date).toLocaleDateString()}</span>
                              {fu.generalDetails?.treatmentsDone?.length ? <span className="text-emerald-700">{fu.generalDetails.treatmentsDone.length}d</span> : null}
                              {fu.generalDetails?.treatmentPlans?.length ? <span className="text-blue-700">{fu.generalDetails.treatmentPlans.length}p</span> : null}
                              {fu.prescriptions?.length ? <span className="text-orange-700">{fu.prescriptions.length}rx</span> : null}
                              <button onClick={()=> setViewVisitId(fu.id)} className="text-[10px] bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-0.5 rounded">View</button>
                              <button onClick={()=> setEditingVisitId(fu.id)} className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded">Edit</button>
                              <button onClick={()=> setDeleteTarget({ id: fu.id, isFollowUp:true })} className="text-[10px] bg-red-600 hover:bg-red-700 text-white px-2 py-0.5 rounded">Delete</button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
                {!visits.length && <div className="p-8 text-center text-sm text-gray-500">No visits yet. Use <strong>Add Visit</strong> to create the first record.</div>}
              </div>
            </div>
          </div>
          {/* Payments Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Payments</h2>
              <QuickAddPaymentForm patientId={patientId} visits={visits as Visit[]} onAdded={()=> qc.invalidateQueries({ queryKey: ['patient-full', patientId] })} />
            </div>
            <div className="overflow-x-auto border rounded-md">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wide"><tr className="text-left"><th className="p-2">Date</th><th className="p-2">Amount</th><th className="p-2">Method</th><th className="p-2">Note</th><th className="p-2">Visit</th><th className="p-2">Actions</th></tr></thead>
                <tbody>
                  {payments.length === 0 && <tr><td className="p-4 text-gray-500 text-center" colSpan={6}>No payments.</td></tr>}
                  {payments.map((p)=>{
                    const v = p.visit;
                    return (
                      <tr key={p.id} className="border-t">
                        <td className="p-2 whitespace-nowrap">{new Date(p.date).toLocaleDateString()}</td>
                        <td className="p-2">{p.amount}</td>
                        <td className="p-2">{p.method ?? '-'}</td>
                        <td className="p-2">{p.note ?? '-'}</td>
                        <td className="p-2 whitespace-nowrap text-xs">{v ? `${v.type} (${new Date(v.date).toLocaleDateString()})` : '-'}</td>
                        <td className="p-2 whitespace-nowrap text-[10px]">
                          {/* PaymentActions component temporarily removed pending refactor */}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
      {/* Modals & Dialogs */}
      <Modal open={!!viewVisitId} onClose={()=> setViewVisitId(null)} title="Visit Details" widthClass="max-w-5xl" footer={null}>
        {viewVisitId && <VisitDetailsView visit={visits.find((v:any)=> v.id===viewVisitId)} patientId={patientId} setEditingVisitId={setEditingVisitId} setFollowUpFor={setFollowUpFor} />}
      </Modal>
      <Modal open={!!editingVisitId} onClose={()=> setEditingVisitId(null)} title="Edit Visit" widthClass="max-w-5xl" footer={null}>
        {editingVisitId && (()=> {
          const v:any = visits.find((vv:any)=> vv.id===editingVisitId);
          if(!v) return null;
          if(v.type==='GENERAL') return <EditGeneralVisitForm visit={v} patientId={patientId} onSaved={()=> { setEditingVisitId(null); qc.invalidateQueries({ queryKey:['patient-full', patientId] }); }} onCancel={()=> setEditingVisitId(null)} />;
          return <EditFollowUpVisitForm visit={v} patientId={patientId} onSaved={()=> { setEditingVisitId(null); qc.invalidateQueries({ queryKey:['patient-full', patientId] }); }} onCancel={()=> setEditingVisitId(null)} />;
        })()}
      </Modal>
      <Modal open={!!followUpFor} onClose={()=> setFollowUpFor(null)} title="Add Follow-Up" widthClass="max-w-5xl" footer={null}>
        {followUpFor && <FollowUpVisitForm patientId={patientId} baseVisits={visits as Visit[]} defaultBaseVisitId={followUpFor} onCreated={()=> { setFollowUpFor(null); qc.invalidateQueries({ queryKey:['patient-full', patientId] }); }} onCancel={()=> setFollowUpFor(null)} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget}
        destructive
        title={deleteTarget?.isFollowUp ? 'Delete Follow-Up' : 'Delete Visit'}
        message={deleteTarget ? (deleteTarget.isFollowUp ? 'This will permanently delete the follow-up. Continue?' : 'This will permanently delete the visit and all its follow-ups & data. Continue?') : ''}
        onCancel={()=> setDeleteTarget(null)}
        onConfirm={async ()=> {
          if(!deleteTarget) return;
          const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
          const queryKey = ['patient-full', patientId];
          let prev: any = null;
            if(deleteTarget.isFollowUp){
              prev = qc.getQueryData(queryKey as any);
              qc.setQueryData(queryKey as any, (old:any)=> {
                if(!old) return old;
                return { ...old, visits: old.visits.map((v:any)=> ({ ...v, followUps: (v.followUps||[]).filter((fu:any)=> fu.id !== deleteTarget.id) })) };
              });
            }
            try {
              const res = await fetch(`${base}/api/visits/${deleteTarget.id}`, { method: 'DELETE' });
              if(!res.ok){
                let msg = 'Delete failed';
                try { msg = (await res.json())?.error || msg; } catch {}
                throw new Error(msg);
              }
            } catch(e:any){
              if(deleteTarget.isFollowUp && prev){ qc.setQueryData(queryKey as any, prev); }
              alert(e.message||'Delete failed');
            } finally {
              setDeleteTarget(null);
              qc.invalidateQueries({ queryKey });
              qc.invalidateQueries({ queryKey:['summary'] });
            }
        }}
      />
    </div>
  );
}


interface QuickAddPaymentFormProps {
  patientId: number;
  visits: Visit[];
  onAdded: () => void;
}

function QuickAddPaymentForm({ patientId, visits, onAdded }: QuickAddPaymentFormProps) {
  const qc = useQueryClient();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [note, setNote] = useState('');
  const [visitId, setVisitId] = useState('');
  const createPayment = useMutation({
    mutationFn: (payload: any) => postJSON('/api/payments', payload),
    onSuccess: () => {
      setAmount(''); setMethod(''); setNote(''); setVisitId('');
      qc.invalidateQueries({ queryKey: ['summary'] }); // refresh revenue KPI if cached
      onAdded();
    }
  });

  const disabled = createPayment.isPending || !amount;

  function submit(e: React.FormEvent){
    e.preventDefault();
    const amt = Number(amount);
    if (!amt || amt <= 0) return;
    const payload: any = { patientId, amount: amt };
    if (method.trim()) payload.method = method.trim();
    if (note.trim()) payload.note = note.trim();
    if (visitId) payload.visitId = Number(visitId);
    createPayment.mutate(payload);
  }

  // Sort visits by date desc for selection convenience
  const visitOptions = [...visits].sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <form onSubmit={submit} className="flex flex-col md:flex-row gap-2 md:items-end w-full md:justify-end">
      <div className="flex flex-col">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Amount</label>
        <input required type="number" min={1} value={amount} onChange={e=>setAmount(e.target.value)} className="border rounded px-2 py-1 text-sm w-28" />
      </div>
      <div className="flex flex-col">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Method</label>
        <input value={method} onChange={e=>setMethod(e.target.value)} placeholder="Cash/Card" className="border rounded px-2 py-1 text-sm w-28" />
      </div>
      <div className="flex flex-col flex-1 min-w-[140px]">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Note</label>
        <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Optional note" className="border rounded px-2 py-1 text-sm" />
      </div>
      <div className="flex flex-col">
        <label className="text-[10px] uppercase tracking-wide text-gray-500">Visit (opt)</label>
        <select value={visitId} onChange={e=>setVisitId(e.target.value)} className="border rounded px-2 py-1 text-sm w-40">
          <option value="">None</option>
          {visitOptions.map(v=> <option key={v.id} value={v.id}>{v.type} {new Date(v.date).toLocaleDateString()}</option>)}
        </select>
      </div>
      <button disabled={disabled} className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded disabled:opacity-50 min-w-[90px]">
        {createPayment.isPending ? 'Saving...' : 'Add'}
      </button>
    </form>
  );
}

function AddVisitModalLauncher({ patientId, visits, onCreated }: { patientId:number; visits:any[]; onCreated: ()=>void }) {
  const [open,setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={()=> setOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded shadow">+ Add Visit</button>
      <Modal open={open} onClose={()=> setOpen(false)} title="Add Visit" widthClass="max-w-5xl" footer={null}>
        <UnifiedVisitForm patientId={patientId} visits={visits} onCreated={()=> { setOpen(false); onCreated(); }} />
      </Modal>
    </>
  );
}

interface FollowUpVisitFormProps {
  patientId: number;
  baseVisits: Visit[];
  onCreated: () => void;
  onCancel: () => void;
}

// Replace inline minimal form with expanded card-based form
function FollowUpVisitForm({ patientId, baseVisits, onCreated, onCancel, defaultBaseVisitId }: FollowUpVisitFormProps & { defaultBaseVisitId?: number }) {
  const qc = useQueryClient();
  const [baseVisitId, setBaseVisitId] = useState(defaultBaseVisitId? String(defaultBaseVisitId): '');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState('');
  const [nextApptDate, setNextApptDate] = useState('');
  // Detail rows (no chief complaints per requirement)
  const [findingRows, setFindingRows] = useState<{ tooth: string; findingId: number | '' }[]>([]);
  const [investigationRows, setInvestigationRows] = useState<{ typeOptionId: number | ''; tooth?: string; findings?: string }[]>([]);
  const [treatmentPlanRows, setTreatmentPlanRows] = useState<{ treatmentId: number | ''; tooth?: string }[]>([]);
  const [treatmentDoneRows, setTreatmentDoneRows] = useState<{ treatmentId: number | ''; tooth?: string; notes?: string }[]>([]);
  const [prescriptionRows, setPrescriptionRows] = useState<{ medicineId: number | ''; timing?: string; quantity?: string; days?: string; notes?: string }[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  // Option data
  const findingsQuery = useQuery({ queryKey: ['options','oral-findings'], queryFn: ()=> getJSON<OralFindingOption[]>('/api/options/oral-findings') });
  const treatmentsQuery = useQuery({ queryKey: ['options','treatments'], queryFn: ()=> getJSON<TreatmentOption[]>('/api/options/treatments') });
  const medicinesQuery = useQuery({ queryKey: ['options','medicines'], queryFn: ()=> getJSON<any[]>('/api/options/medicines') });
  const investigationTypesQuery = useQuery({ queryKey: ['options','investigation-types'], queryFn: ()=> getJSON<any[]>('/api/options/investigation-types') });

  function addFindingRow(){ setFindingRows(r=> [...r,{ tooth:'', findingId:'' }]); }
  function setFindingRow(i:number,key:'tooth'|'findingId',val:any){ setFindingRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='findingId' && val? Number(val): val }: row)); }
  function removeFindingRow(i:number){ setFindingRows(r=> r.filter((_,idx)=> idx!==i)); }

  function addInvestigationRow(){ setInvestigationRows(r=> [...r,{ typeOptionId:'', tooth:'', findings:'' }]); }
  function setInvestigationRow(i:number,key:'typeOptionId'|'tooth'|'findings',val:any){ setInvestigationRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='typeOptionId' && val? Number(val): val }: row)); }
  function removeInvestigationRow(i:number){ setInvestigationRows(r=> r.filter((_,idx)=> idx!==i)); }

  function addTreatmentPlanRow(){ setTreatmentPlanRows(r=> [...r,{ treatmentId:'', tooth:'' }]); }
  function setTreatmentPlanRow(i:number,key:'treatmentId'|'tooth',val:any){ setTreatmentPlanRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='treatmentId' && val? Number(val): val }: row)); }
  function removeTreatmentPlanRow(i:number){ setTreatmentPlanRows(r=> r.filter((_,idx)=> idx!==i)); }

  function addTreatmentDoneRow(){ setTreatmentDoneRows(r=> [...r,{ treatmentId:'', tooth:'', notes:'' }]); }
  function setTreatmentDoneRow(i:number,key:'treatmentId'|'tooth'|'notes',val:any){ setTreatmentDoneRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='treatmentId' && val? Number(val): val }: row)); }
  function removeTreatmentDoneRow(i:number){ setTreatmentDoneRows(r=> r.filter((_,idx)=> idx!==i)); }

  function addPrescriptionRow(){ setPrescriptionRows(r=> [...r,{ medicineId:'', timing:'', quantity:'', days:'', notes:'' }]); }
  function setPrescriptionRow(i:number,key:'medicineId'|'timing'|'quantity'|'days'|'notes',val:any){ setPrescriptionRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='medicineId' && val? Number(val): val }: row)); }
  function removePrescriptionRow(i:number){ setPrescriptionRows(r=> r.filter((_,idx)=> idx!==i)); }

  const mutation = useMutation({
    mutationFn: async (payload: any) => {
      const created = await postJSON('/api/visits/follow-up', payload);
      // Upload attachments if any
      if (files && files.length) {
        try {
          setUploading(true);
          const fd = new FormData();
          Array.from(files).forEach(f=> fd.append('files', f));
          const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
          const res = await fetch(`${base}/api/visits/${created.id}/media`, { method: 'POST', body: fd });
          if(!res.ok){ console.error(await res.text()); throw new Error('Attachment upload failed'); }
        } finally {
          setUploading(false);
          setFiles(null);
        }
      }
      return created;
    },
    onSuccess: () => { setBaseVisitId(''); setNotes(''); setDate(''); setNextApptDate(''); setFindingRows([]); setInvestigationRows([]); setTreatmentPlanRows([]); setTreatmentDoneRows([]); setPrescriptionRows([]); qc.invalidateQueries({ queryKey: ['summary'] }); onCreated(); onCancel(); }
  });
  const disabled = mutation.isPending || !baseVisitId;
  const sorted = [...baseVisits].sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());

  function submit(e: React.FormEvent){
    e.preventDefault();
    const oralFindings = findingRows.filter(r=> r.tooth && typeof r.findingId==='number').map(r=> ({ toothNumber: r.tooth, findingOptionId: r.findingId as number }));
    const investigations = investigationRows.filter(r=> typeof r.typeOptionId==='number').map(r=> ({ typeOptionId: r.typeOptionId as number, toothNumber: r.tooth || undefined, findings: r.findings || undefined }));
    const treatmentPlan = treatmentPlanRows.filter(r=> typeof r.treatmentId==='number').map(r=> ({ treatmentOptionId: r.treatmentId as number, toothNumber: r.tooth || undefined }));
    const treatmentDone = treatmentDoneRows.filter(r=> typeof r.treatmentId==='number').map(r=> ({ treatmentOptionId: r.treatmentId as number, toothNumber: r.tooth || undefined, notes: r.notes || undefined }));
    const prescriptions = prescriptionRows.filter(r=> typeof r.medicineId==='number').map((p,idx)=> ({ medicineId: p.medicineId as number, timing: p.timing || undefined, quantity: p.quantity? Number(p.quantity): undefined, days: p.days? Number(p.days): undefined, notes: p.notes || undefined }));
    mutation.mutate({ patientId, baseVisitId: Number(baseVisitId), notes: notes || undefined, date: date || undefined, nextAppointmentDate: nextApptDate || undefined, oralFindings, investigations, treatmentPlan, treatmentDone, prescriptions });
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm text-gray-700">Add Follow-Up</h3>
        <button type="button" onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
      </div>
      <form onSubmit={submit} className="space-y-8">
        {/* Basic Fields */}
        <div className="grid sm:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Base Visit *</label>
            <select value={baseVisitId} onChange={e=>setBaseVisitId(e.target.value)} className="border rounded px-2 py-1 text-sm">
              <option value="">Select...</option>
              {sorted.map(v=> <option key={v.id} value={v.id}>{v.type} {new Date(v.date).toLocaleDateString()}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Clinic Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Next Appt</label>
            <input type="date" value={nextApptDate} onChange={e=>setNextApptDate(e.target.value)} className="border rounded px-2 py-1 text-sm" />
          </div>
          <div className="flex flex-col gap-1 sm:col-span-1">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Notes</label>
            <input value={notes} onChange={e=>setNotes(e.target.value)} className="border rounded px-2 py-1 text-sm" placeholder="Optional notes" />
          </div>
        </div>

        {/* Findings */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-600">Oral Findings</h4>
            <button type="button" onClick={addFindingRow} className="text-xs text-indigo-600">Add</button>
          </div>
          {findingRows.length===0 && <div className="text-[11px] text-gray-400">None added.</div>}
          <div className="space-y-2">
            {findingRows.map((row,idx)=>(
              <div key={idx} className="flex gap-2 items-center">
                <input value={row.tooth} onChange={e=>setFindingRow(idx,'tooth',e.target.value)} placeholder="Tooth" className="border rounded px-2 py-1 text-xs w-20" />
                <select value={row.findingId} onChange={e=>setFindingRow(idx,'findingId',e.target.value)} className="border rounded px-2 py-1 text-xs flex-1">
                  <option value="">Finding</option>
                  {findingsQuery.data?.map(f=> <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
                <button type="button" onClick={()=>removeFindingRow(idx)} className="text-xs text-red-600">✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Investigations */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-600">Investigations</h4>
            <button type="button" onClick={addInvestigationRow} className="text-xs text-indigo-600">Add</button>
          </div>
          {investigationRows.length === 0 && <div className="text-[11px] text-gray-400">None added.</div>}
          <div className="space-y-2">
            {investigationRows.map((row,idx)=>(
              <div key={idx} className="flex flex-col gap-1 border rounded p-2 bg-gray-50">
                <div className="flex gap-2 items-center">
                  <select value={row.typeOptionId} onChange={e=> setInvestigationRow(idx,'typeOptionId', e.target.value)} className="border rounded px-2 py-1 text-xs">
                    <option value="">Type</option>
                    {investigationTypesQuery.data?.map(o=> <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                  <input value={row.tooth} onChange={e=>setInvestigationRow(idx,'tooth',e.target.value)} placeholder="Tooth" className="border rounded px-2 py-1 text-xs w-24" />
                  <button type="button" onClick={()=>removeInvestigationRow(idx)} className="text-xs text-red-600">✕</button>
                </div>
                <input value={row.findings} onChange={e=>setInvestigationRow(idx,'findings',e.target.value)} placeholder="Findings" className="border rounded px-2 py-1 text-xs" />
              </div>
            ))}
          </div>
        </div>

        {/* Treatment Plan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-600">Planned Treatments</h4>
            <button type="button" onClick={addTreatmentPlanRow} className="text-xs text-indigo-600">Add</button>
          </div>
          {treatmentPlanRows.length===0 && <div className="text-[11px] text-gray-400">None added.</div>}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {treatmentPlanRows.map((row,idx)=>(
              <div key={idx} className="flex flex-wrap items-center gap-2 text-xs border rounded p-2 bg-white">
                <select value={row.treatmentId} onChange={e=> setTreatmentPlanRow(idx,'treatmentId', e.target.value)} className="border rounded px-2 py-1 min-w-[160px]">
                  <option value="">Treatment</option>
                  {treatmentsQuery.data?.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                <input value={row.tooth||''} onChange={e=> setTreatmentPlanRow(idx,'tooth', e.target.value)} placeholder="Tooth (opt)" className="border rounded px-2 py-1 w-24" />
                <button type="button" onClick={()=> removeTreatmentPlanRow(idx)} className="text-red-600">✕</button>
              </div>
            ))}
          </div>
          {/* Summary intentionally omitted for compact follow-up form */}
        </div>
        {/* 5. Treatment Done */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">5. Treatment Done</h3>
            <button type="button" onClick={()=> setTreatmentDoneRows(r=> [...r,{ treatmentId:'', tooth:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
          </div>
          {treatmentDoneRows.length===0 && <div className="text-xs text-gray-400">None added.</div>}
          {treatmentDoneRows.map((row,idx)=>(
            <div key={idx} className="flex flex-wrap gap-2 items-center text-xs border rounded p-2 bg-gray-50">
              <select value={row.treatmentId} onChange={e=> setTreatmentDoneRows(list=> list.map((r,i)=> i===idx? { ...r, treatmentId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-2 py-1">
                <option value="">Treatment</option>
                {treatmentsQuery.data?.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <input value={row.tooth||''} onChange={e=> setTreatmentDoneRows(list=> list.map((r,i)=> i===idx? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-2 py-1 w-20" />
              <input value={row.notes||''} onChange={e=> setTreatmentDoneRows(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-2 py-1 flex-1 min-w-[120px]" />
              <button type="button" onClick={()=> setTreatmentDoneRows(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
            </div>
          ))}
        </div>
        {/* 6. Prescriptions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">6. Prescriptions</h3>
            <button type="button" onClick={()=> setPrescriptionRows(r=> [...r,{ medicineId:'', timing:'', quantity:'', days:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
          </div>
          {prescriptionRows.length===0 && <div className="text-xs text-gray-400">None added.</div>}
          {prescriptionRows.map((row,idx)=>(
            <div key={idx} className="grid grid-cols-6 gap-2 items-center text-[11px] border rounded p-2 bg-white">
              <select value={row.medicineId} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, medicineId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 col-span-2">
                <option value="">Medicine</option>
                {medicinesQuery.data?.map((m:any)=> <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input value={row.timing||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, timing: e.target.value }: r))} placeholder="1-0-1" className="border rounded px-1 py-1" />
              <input value={row.quantity||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, quantity: e.target.value }: r))} placeholder="Qty" className="border rounded px-1 py-1 w-14" />
              <input value={row.days||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, days: e.target.value }: r))} placeholder="Days" className="border rounded px-1 py-1 w-14" />
              <div className="flex items-center gap-1">
                <input value={row.notes||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-1 py-1 flex-1" />
                <button type="button" onClick={()=> setPrescriptionRows(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-wide text-gray-500">Attachments</label>
            <input disabled={mutation.isPending} type="file" multiple onChange={e=> setFiles(e.target.files)} className="text-xs" />
            {uploading && <span className="text-[10px] text-indigo-600">Uploading...</span>}
          </div>
          <button type="submit" disabled={disabled} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50">
            {mutation.isPending ? 'Saving...' : 'Save Follow-Up'}
          </button>
          <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-800">Cancel</button>
          {mutation.isError && <span className="text-red-600 text-xs">{(mutation.error as any)?.message || 'Failed'}</span>}
        </div>
      </form>
    </div>
  );
}


// Uploader for follow-up attachments (shares backend endpoint /api/visits/:id/media)
function FollowUpAttachmentUploader({ followUpId, patientId, parentVisitId }: { followUpId: number; patientId: number; parentVisitId: number }) {
  const qc = useQueryClient();
  const [files, setFiles] = useState<FileList | null>(null);
  const [busy, setBusy] = useState(false);
  const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
  async function upload(){
    if(!files || !files.length) return;
    setBusy(true);
    const queryKey = ['patient-full', patientId];
    try {
      const fd = new FormData();
      Array.from(files).forEach(f=> fd.append('files', f));
      const res = await fetch(`${base}/api/visits/${followUpId}/media`, { method: 'POST', body: fd });
      if(!res.ok){ console.error(await res.text()); throw new Error('Upload failed'); }
    } catch(e){
      alert((e as any).message || 'Upload failed');
    } finally {
      setBusy(false); setFiles(null); qc.invalidateQueries({ queryKey });
    }
  }
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <input disabled={busy} type="file" multiple onChange={e=> setFiles(e.target.files)} className="text-[10px]" />
      <button type="button" disabled={busy || !files?.length} onClick={upload} className="bg-indigo-600 disabled:opacity-40 text-white px-2 py-1 rounded">{busy? '...' : 'Upload'}</button>
    </div>
  );
}


// Full edit form for General Visit
function EditGeneralVisitForm({ visit, patientId, onSaved, onCancel }: { visit:any; patientId:number; onSaved: ()=>void; onCancel: ()=>void }) {
  const qc = useQueryClient();
  const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
  // Prefill state
  const [date,setDate] = useState(visit.date? visit.date.split('T')[0]: '');
  const [notes,setNotes] = useState(visit.generalDetails?.notes || '');
  const [nextAppt,setNextAppt] = useState(visit.generalDetails?.nextAppointmentDate? visit.generalDetails.nextAppointmentDate.split('T')[0]: '');
  const [complaints,setComplaints] = useState<{ complaintId:number|''; quadrantId:number|'' }[]>(visit.generalDetails?.complaints?.map((c:any)=> ({ complaintId: c.complaintId, quadrantId: c.quadrantId })) || [{ complaintId:'', quadrantId:'' }]);
  const [findings,setFindings] = useState<{ tooth:string; findingId:number|'' }[]>(visit.generalDetails?.oralFindings?.map((f:any)=> ({ tooth:f.toothNumber, findingId:f.findingId })) || []);
  // Investigations now reference dynamic option table (investigation type options)
  const [investigations,setInvestigations] = useState<{ typeOptionId: number | ''; tooth?:string; findings?:string }[]>(visit.generalDetails?.investigations?.map((i:any)=> ({ typeOptionId: i.typeOptionId || '', tooth: i.toothNumber||'', findings: i.findings||'' })) || []);
  const [plan,setPlan] = useState<{ treatmentId:number|''; tooth?:string }[]>(visit.generalDetails?.treatmentPlans?.map((t:any)=> ({ treatmentId: t.treatmentId, tooth: t.toothNumber||'' })) || []);
  const [done,setDone] = useState<{ treatmentId:number|''; tooth?:string; notes?:string }[]>(visit.generalDetails?.treatmentsDone?.map((t:any)=> ({ treatmentId: t.treatmentId, tooth: t.toothNumber||'', notes: t.notes||'' })) || []);
  const [rx,setRx] = useState<{ medicineId:number|''; timing?:string; quantity?:string; days?:string; notes?:string }[]>(visit.prescriptions?.map((p:any)=> ({ medicineId: p.medicineId, timing:p.timing||'', quantity: p.quantity?.toString()||'', days: p.days?.toString()||'', notes:p.notes||'' })) || []);
  // Options
  const complaintsQuery = useQuery({ queryKey:['options','complaints'], queryFn: ()=> getJSON<any[]>('/api/options/complaints') });
  const quadrantsQuery = useQuery({ queryKey:['options','quadrants'], queryFn: ()=> getJSON<any[]>('/api/options/quadrants') });
  const findingsQuery = useQuery({ queryKey:['options','oral-findings'], queryFn: ()=> getJSON<any[]>('/api/options/oral-findings') });
  const treatmentsQuery = useQuery({ queryKey:['options','treatments'], queryFn: ()=> getJSON<any[]>('/api/options/treatments') });
  const medsQuery = useQuery({ queryKey:['options','medicines'], queryFn: ()=> getJSON<any[]>('/api/options/medicines') });
  const saving = useRef(false);
  const investigationTypesQuery = useQuery({ queryKey:['options','investigation-types'], queryFn: ()=> getJSON<any[]>('/api/options/investigation-types') });
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const mutation = useMutation({
    mutationFn: async ()=> {
      saving.current = true;
      const payload:any = { date, notes: notes||undefined, nextAppointmentDate: nextAppt||undefined };
      payload.complaints = complaints.filter(c=> typeof c.complaintId==='number' && typeof c.quadrantId==='number').map(c=> ({ complaintOptionId: c.complaintId, quadrantOptionId: c.quadrantId }));
      payload.oralFindings = findings.filter(f=> f.tooth && typeof f.findingId==='number').map(f=> ({ toothNumber: f.tooth, findingOptionId: f.findingId }));
  payload.investigations = investigations.filter(i=> typeof i.typeOptionId==='number').map(i=> ({ typeOptionId: i.typeOptionId as number, toothNumber: i.tooth||undefined, findings: i.findings||undefined }));
      payload.treatmentPlan = plan.filter(p=> typeof p.treatmentId==='number').map(p=> ({ treatmentOptionId: p.treatmentId, toothNumber: p.tooth||undefined }));
      payload.treatmentDone = done.filter(d=> typeof d.treatmentId==='number').map(d=> ({ treatmentOptionId: d.treatmentId, toothNumber: d.tooth||undefined, notes: d.notes||undefined }));
      payload.prescriptions = rx.filter(r=> typeof r.medicineId==='number').map((p,idx)=> ({ medicineId: p.medicineId, timing: p.timing||undefined, quantity: p.quantity? Number(p.quantity): undefined, days: p.days? Number(p.days): undefined, notes: p.notes||undefined }));
      const res = await fetch(`${base}/api/visits/general/${visit.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: ()=> { qc.invalidateQueries({ queryKey:['patient-full', patientId] }); onSaved(); },
    onError: (e:any)=> alert(e.message||'Failed'),
    onSettled: ()=> { saving.current=false; }
  });
  function add(listSetter:any, row:any){ listSetter((r:any[])=> [...r,row]); }
  const disabled = saving.current; // simple disabled flag (could be expanded)
  return (
    <form onSubmit={e=> { e.preventDefault(); mutation.mutate(); }} className="border rounded p-3 bg-white space-y-4 text-[11px]">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col"><label className="text-[9px] uppercase text-gray-500">Date</label><input type="date" value={date} onChange={e=> setDate(e.target.value)} className="border rounded px-2 py-1" /></div>
        <div className="flex flex-col"><label className="text-[9px] uppercase text-gray-500">Next Appt</label><input type="date" value={nextAppt} onChange={e=> setNextAppt(e.target.value)} className="border rounded px-2 py-1" /></div>
        <div className="flex flex-col col-span-1"><label className="text-[9px] uppercase text-gray-500">Notes</label><input value={notes} onChange={e=> setNotes(e.target.value)} className="border rounded px-2 py-1" /></div>
      </div>
      {/* Complaints */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Complaints</h4><button type="button" onClick={()=> add(setComplaints,{ complaintId:'', quadrantId:'' })} className="text-indigo-600">Add</button></div>
        {complaints.map((c,i)=> (
          <div key={i} className="flex gap-2 items-center">
            <select value={c.complaintId} onChange={e=> setComplaints(list=> list.map((r,idx)=> idx===i? { ...r, complaintId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 flex-1">
              <option value="">Complaint</option>
              {complaintsQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <select value={c.quadrantId} onChange={e=> setComplaints(list=> list.map((r,idx)=> idx===i? { ...r, quadrantId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 flex-1">
              <option value="">Quadrant</option>
              {quadrantsQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.code}</option>)}
            </select>
            <button type="button" onClick={()=> setComplaints(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* Findings */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Findings</h4><button type="button" onClick={()=> add(setFindings,{ tooth:'', findingId:'' })} className="text-indigo-600">Add</button></div>
        {findings.map((f,i)=>(
          <div key={i} className="flex gap-2 items-center">
            <input value={f.tooth} onChange={e=> setFindings(list=> list.map((r,idx)=> idx===i? { ...r, tooth:e.target.value }: r))} placeholder="Tooth" className="border rounded px-1 py-1 w-20" />
            <select value={f.findingId} onChange={e=> setFindings(list=> list.map((r,idx)=> idx===i? { ...r, findingId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 flex-1">
              <option value="">Finding</option>
              {findingsQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button type="button" onClick={()=> setFindings(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* Investigations */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Investigations</h4><button type="button" onClick={()=> add(setInvestigations,{ typeOptionId:'', tooth:'', findings:'' })} className="text-indigo-600">Add</button></div>
        {investigations.map((iv,i)=>(
          <div key={i} className="flex flex-wrap gap-2 items-center border rounded p-2 bg-gray-50">
            <select value={iv.typeOptionId} onChange={e=> setInvestigations(list=> list.map((r,idx)=> idx===i? { ...r, typeOptionId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1">
              <option value="">Type</option>
              {investigationTypesQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input value={iv.tooth||''} onChange={e=> setInvestigations(list=> list.map((r,idx)=> idx===i? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-1 py-1 w-20" />
            <input value={iv.findings||''} onChange={e=> setInvestigations(list=> list.map((r,idx)=> idx===i? { ...r, findings: e.target.value }: r))} placeholder="Findings" className="border rounded px-1 py-1 flex-1 min-w-[120px]" />
            <button type="button" onClick={()=> setInvestigations(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* Treatment Plan */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Treatment Plan</h4><button type="button" onClick={()=> add(setPlan,{ treatmentId:'', tooth:'' })} className="text-indigo-600">Add</button></div>
        {plan.map((p,i)=>(
          <div key={i} className="flex flex-wrap gap-2 items-center text-xs border rounded p-2">
            <select value={p.treatmentId} onChange={e=> setPlan(list=> list.map((r,idx)=> idx===i? { ...r, treatmentId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 min-w-[160px]">
              <option value="">Treatment</option>
              {treatmentsQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input value={p.tooth||''} onChange={e=> setPlan(list=> list.map((r,idx)=> idx===i? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-1 py-1 w-20" />
            <button type="button" onClick={()=> setPlan(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* Treatment Done */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Treatment Done</h4><button type="button" onClick={()=> setDone(r=> [...r,{ treatmentId:'', tooth:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button></div>
        {done.length===0 && <div className="text-xs text-gray-400">None added.</div>}
        {done.map((row,idx)=>(
          <div key={idx} className="flex flex-wrap gap-2 items-center text-xs border rounded p-2 bg-gray-50">
            <select value={row.treatmentId} onChange={e=> setDone(list=> list.map((r,i)=> i===idx? { ...r, treatmentId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-2 py-1">
              <option value="">Treatment</option>
              {treatmentsQuery.data?.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input value={row.tooth||''} onChange={e=> setDone(list=> list.map((r,i)=> i===idx? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-2 py-1 w-20" />
            <input value={row.notes||''} onChange={e=> setDone(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-2 py-1 flex-1 min-w-[120px]" />
            <button type="button" onClick={()=> setDone(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* 6. Prescriptions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">6. Prescriptions</h3>
          <button type="button" onClick={()=> setRx(r=> [...r,{ medicineId:'', timing:'', quantity:'', days:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
        </div>
        {rx.length===0 && <div className="text-xs text-gray-400">None added.</div>}
        {rx.map((row,idx)=>(
          <div key={idx} className="grid grid-cols-6 gap-2 items-center text-[11px] border rounded p-2 bg-white">
            <select value={row.medicineId} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, medicineId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 col-span-2">
              <option value="">Medicine</option>
              {medsQuery.data?.map((m:any)=> <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input value={row.timing||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, timing: e.target.value }: r))} placeholder="1-0-1" className="border rounded px-1 py-1" />
            <input value={row.quantity||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, quantity: e.target.value }: r))} placeholder="Qty" className="border rounded px-1 py-1 w-14" />
            <input value={row.days||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, days: e.target.value }: r))} placeholder="Days" className="border rounded px-1 py-1 w-14" />
            <div className="flex items-center gap-1">
              <input value={row.notes||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-1 py-1 flex-1" />
              <button type="button" onClick={()=> setRx(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <label className="text-[10px] uppercase tracking-wide text-gray-500">Attachments</label>
          <input disabled={mutation.isPending} type="file" multiple onChange={e=> setFiles(e.target.files)} className="text-xs" />
          {uploading && <span className="text-[10px] text-indigo-600">Uploading...</span>}
        </div>
        <button type="submit" disabled={disabled} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded disabled:opacity-50">
          {mutation.isPending ? 'Saving...' : 'Save Follow-Up'}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-600 hover:text-gray-800">Cancel</button>
        {mutation.isError && <span className="text-red-600 text-xs">{(mutation.error as any)?.message || 'Failed'}</span>}
      </div>
    </form>
  );
}


// Full edit form for Follow-Up (no complaints)
function EditFollowUpVisitForm({ visit, patientId, onSaved, onCancel }: { visit:any; patientId:number; onSaved: ()=>void; onCancel: ()=>void }) {
  const qc = useQueryClient();
  const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
  const [date,setDate] = useState(visit.date? visit.date.split('T')[0]: '');
  const [notes,setNotes] = useState(visit.generalDetails?.notes || '');
  const [nextAppt,setNextAppt] = useState(visit.generalDetails?.nextAppointmentDate? visit.generalDetails.nextAppointmentDate.split('T')[0]: '');
  const [findings,setFindings] = useState<{ tooth:string; findingId:number|'' }[]>(visit.generalDetails?.oralFindings?.map((f:any)=> ({ tooth:f.toothNumber, findingId:f.findingId })) || []);
  const [investigations,setInvestigations] = useState<{ typeOptionId: number | ''; tooth?:string; findings?:string }[]>(visit.generalDetails?.investigations?.map((i:any)=> ({ typeOptionId: i.typeOptionId, tooth: i.toothNumber||'', findings: i.findings||'' })) || []);
  const [plan,setPlan] = useState<{ treatmentId:number|''; tooth?:string }[]>(visit.generalDetails?.treatmentPlans?.map((t:any)=> ({ treatmentId: t.treatmentId, tooth: t.toothNumber||'' })) || []);
  const [done,setDone] = useState<{ treatmentId:number|''; tooth?:string; notes?:string }[]>(visit.generalDetails?.treatmentsDone?.map((t:any)=> ({ treatmentId: t.treatmentId, tooth: t.toothNumber||'', notes: t.notes||'' })) || []);
  const [rx,setRx] = useState<{ medicineId:number|''; timing?:string; quantity?:string; days?:string; notes?:string }[]>(visit.prescriptions?.map((p:any)=> ({ medicineId: p.medicineId, timing:p.timing||'', quantity: p.quantity?.toString()||'', days: p.days?.toString()||'', notes:p.notes||'' })) || []);
  // Option queries
  const findingsQuery = useQuery({ queryKey:['options','oral-findings'], queryFn: ()=> getJSON<any[]>('/api/options/oral-findings') });
  const treatmentsQuery = useQuery({ queryKey:['options','treatments'], queryFn: ()=> getJSON<any[]>('/api/options/treatments') });
  const medsQuery = useQuery({ queryKey:['options','medicines'], queryFn: ()=> getJSON<any[]>('/api/options/medicines') });
  const investigationTypesQuery = useQuery({ queryKey:['options','investigation-types'], queryFn: ()=> getJSON<any[]>('/api/options/investigation-types') });
  const mutation = useMutation({
    mutationFn: async ()=> {
      const payload:any = { date, notes: notes||undefined, nextAppointmentDate: nextAppt||undefined };
      payload.oralFindings = findings.filter(f=> f.tooth && typeof f.findingId==='number').map(f=> ({ toothNumber: f.tooth, findingOptionId: f.findingId }));
      payload.investigations = investigations.filter(i=> i.typeOptionId).map(i=> ({ typeOptionId: i.typeOptionId as number, toothNumber: i.tooth||undefined, findings: i.findings||undefined }));
      payload.treatmentPlan = plan.filter(p=> typeof p.treatmentId==='number').map(p=> ({ treatmentOptionId: p.treatmentId as number, toothNumber: p.tooth||undefined }));
      payload.treatmentDone = done.filter(d=> typeof d.treatmentId==='number').map(d=> ({ treatmentOptionId: d.treatmentId as number, toothNumber: d.tooth||undefined, notes: d.notes||undefined }));
      payload.prescriptions = rx.filter(r=> typeof r.medicineId==='number').map((p,idx)=> ({ medicineId: p.medicineId as number, timing: p.timing||undefined, quantity: p.quantity? Number(p.quantity): undefined, days: p.days? Number(p.days): undefined, notes: p.notes||undefined }));
      const res = await fetch(`${base}/api/visits/follow-up/${visit.id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      if(!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: ()=> { qc.invalidateQueries({ queryKey:['patient-full', patientId] }); onSaved(); },
    onError: (e:any)=> alert(e.message||'Failed')
  });
  function add(setter:any, row:any){ setter((r:any[])=> [...r,row]); }
  return (
    <form onSubmit={e=> { e.preventDefault(); mutation.mutate(); }} className="border rounded p-3 bg-white space-y-4 text-[11px]">
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col"><label className="text-[9px] uppercase text-gray-500">Date</label><input type="date" value={date} onChange={e=> setDate(e.target.value)} className="border rounded px-2 py-1" /></div>
        <div className="flex flex-col"><label className="text-[9px] uppercase text-gray-500">Next Appt</label><input type="date" value={nextAppt} onChange={e=> setNextAppt(e.target.value)} className="border rounded px-2 py-1" /></div>
        <div className="flex flex-col col-span-1"><label className="text-[9px] uppercase text-gray-500">Notes</label><input value={notes} onChange={e=> setNotes(e.target.value)} className="border rounded px-2 py-1" /></div>
      </div>
      {/* Findings */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Findings</h4><button type="button" onClick={()=> add(setFindings,{ tooth:'', findingId:'' })} className="text-indigo-600">Add</button></div>
        {findings.map((f,i)=>(
          <div key={i} className="flex gap-2 items-center">
            <input value={f.tooth} onChange={e=> setFindings(list=> list.map((r,idx)=> idx===i? { ...r, tooth:e.target.value }: r))} placeholder="Tooth" className="border rounded px-1 py-1 w-20" />
            <select value={f.findingId} onChange={e=> setFindings(list=> list.map((r,idx)=> idx===i? { ...r, findingId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 flex-1">
              <option value="">Finding</option>
              {findingsQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <button type="button" onClick={()=> setFindings(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* Investigations */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Investigations</h4><button type="button" onClick={()=> add(setInvestigations,{ typeOptionId:'', tooth:'', findings:'' })} className="text-indigo-600">Add</button></div>
        {investigations.map((iv,i)=>(
          <div key={i} className="flex flex-wrap gap-2 items-center border rounded p-2 bg-gray-50">
            <select value={iv.typeOptionId} onChange={e=> setInvestigations(list=> list.map((r,idx)=> idx===i? { ...r, typeOptionId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1">
              <option value="">Type</option>
              {investigationTypesQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input value={iv.tooth||''} onChange={e=> setInvestigations(list=> list.map((r,idx)=> idx===i? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-1 py-1 w-20" />
            <input value={iv.findings||''} onChange={e=> setInvestigations(list=> list.map((r,idx)=> idx===i? { ...r, findings: e.target.value }: r))} placeholder="Findings" className="border rounded px-1 py-1 flex-1 min-w-[120px]" />
            <button type="button" onClick={()=> setInvestigations(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* Treatment Plan */}
      <section className="space-y-1">
        <div className="flex items-center justify-between"><h4 className="font-semibold text-gray-700">Treatment Plan</h4><button type="button" onClick={()=> add(setPlan,{ treatmentId:'', tooth:'' })} className="text-indigo-600">Add</button></div>
        {plan.map((p,i)=>(
          <div key={i} className="flex flex-wrap gap-2 items-center text-xs border rounded p-2">
            <select value={p.treatmentId} onChange={e=> setPlan(list=> list.map((r,idx)=> idx===i? { ...r, treatmentId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 min-w-[160px]">
              <option value="">Treatment</option>
              {treatmentsQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <input value={p.tooth||''} onChange={e=> setPlan(list=> list.map((r,idx)=> idx===i? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-1 py-1 w-20" />
            <button type="button" onClick={()=> setPlan(list=> list.filter((_,idx)=> idx!==i))} className="text-red-600">✕</button>
          </div>
        ))}
      </section>
      {/* 5. Treatment Done */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">5. Treatment Done</h3>
          <button type="button" onClick={()=> setDone(r=> [...r,{ treatmentId:'', tooth:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
        </div>
        {done.length===0 && <div className="text-xs text-gray-400">None added.</div>}
        {done.map((row,idx)=>(
          <div key={idx} className="flex flex-wrap gap-2 items-center text-xs border rounded p-2 bg-gray-50">
            <select value={row.treatmentId} onChange={e=> setDone(list=> list.map((r,i)=> i===idx? { ...r, treatmentId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-2 py-1">
              <option value="">Treatment</option>
              {treatmentsQuery.data?.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
            <input value={row.tooth||''} onChange={e=> setDone(list=> list.map((r,i)=> i===idx? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-2 py-1 w-20" />
            <input value={row.notes||''} onChange={e=> setDone(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-2 py-1 flex-1 min-w-[120px]" />
            <button type="button" onClick={()=> setDone(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
          </div>
        ))}
      </div>
      {/* 6. Prescriptions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">6. Prescriptions</h3>
          <button type="button" onClick={()=> setRx(r=> [...r,{ medicineId:'', timing:'', quantity:'', days:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
        </div>
        {rx.length===0 && <div className="text-xs text-gray-400">None added.</div>}
        {rx.map((row,idx)=>(
          <div key={idx} className="grid grid-cols-6 gap-2 items-center text-[11px] border rounded p-2 bg-white">
            <select value={row.medicineId} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, medicineId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 col-span-2">
              <option value="">Medicine</option>
              {medsQuery.data?.map((m:any)=> <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input value={row.timing||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, timing: e.target.value }: r))} placeholder="1-0-1" className="border rounded px-1 py-1" />
            <input value={row.quantity||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, quantity: e.target.value }: r))} placeholder="Qty" className="border rounded px-1 py-1 w-14" />
            <input value={row.days||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, days: e.target.value }: r))} placeholder="Days" className="border rounded px-1 py-1 w-14" />
            <div className="flex items-center gap-1">
              <input value={row.notes||''} onChange={e=> setRx(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-1 py-1 flex-1" />
              <button type="button" onClick={()=> setRx(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded disabled:opacity-50">{mutation.isPending? 'Saving...' : 'Save Changes'}</button>
        <button type="button" onClick={onCancel} className="text-xs text-gray-600 hover:text-gray-800">Cancel</button>
      </div>
    </form>
  );
}

// --- Orthodontic Plan Creation Form ---
function AddOrthodonticTreatmentForm({ planId, patientId }: { planId: number; patientId: number }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const mutation = useMutation({
    mutationFn: (payload: any) => postJSON('/api/orthodontic/treatment', payload),
    onSuccess: () => { setLabel(''); setDate(''); qc.invalidateQueries({ queryKey: ['patient-full', patientId] }); }
  });
  const disabled = mutation.isPending || !label;
  return (
    <form onSubmit={e=>{ e.preventDefault(); mutation.mutate({ planId, treatmentLabel: label, date: date || undefined }); }} className="flex items-end gap-1 text-[10px]">
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Treatment" className="border rounded px-1 py-0.5" />
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-1 py-0.5" />
      <button disabled={disabled} className="bg-green-600 text-white px-2 py-0.5 rounded disabled:opacity-50">{mutation.isPending ? '...' : '+'}</button>
    </form>
  );
}

function AddRootCanalProcedureForm({ planId, patientId }: { planId: number; patientId: number }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const mutation = useMutation({
    mutationFn: (payload: any) => postJSON('/api/root-canal/procedure', payload),
    onSuccess: () => { setLabel(''); setDate(''); qc.invalidateQueries({ queryKey: ['patient-full', patientId] }); }
  });
  const disabled = mutation.isPending || !label;
  return (
    <form onSubmit={e=>{ e.preventDefault(); mutation.mutate({ planId, procedureLabel: label, date: date || undefined }); }} className="flex items-end gap-1 text-[10px]">
      <input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Procedure" className="border rounded px-1 py-0.5" />
      <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-1 py-0.5" />
      <button disabled={disabled} className="bg-rose-600 text-white px-2 py-0.5 rounded disabled:opacity-50">{mutation.isPending ? '...' : '+'}</button>
    </form>
  );
}

// ---- Patient History Card (local state only for now) ----
function PatientHistoryCard() {
  const { id } = useParams();
  const patientId = Number(id);
  const qc = useQueryClient();
  // Load full patient (already cached in parent) for initial selections
  const parent = useQuery<PatientFullResponse>({ queryKey: ['patient-full', patientId], queryFn: ()=> getJSON(`/api/patients/${patientId}/full`) });
  const dentalQ = useQuery({ queryKey:['options','dental-history'], queryFn: ()=> getJSON<any[]>('/api/options/dental-history') });
  const medicalQ = useQuery({ queryKey:['options','medical-history'], queryFn: ()=> getJSON<any[]>('/api/options/medical-history') });
  const allergyQ = useQuery({ queryKey:['options','allergies'], queryFn: ()=> getJSON<any[]>('/api/options/allergies') });

  const [openDropdown, setOpenDropdown] = useState<null | 'dental' | 'medical' | 'allergy'>(null);
  const [dentalIds, setDentalIds] = useState<number[]>([]);
  const [medicalIds, setMedicalIds] = useState<number[]>([]);
  const [allergyIds, setAllergyIds] = useState<number[]>([]);

  // New option quick-add fields
  const [newDental, setNewDental] = useState('');
  const [newMedical, setNewMedical] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  // Initialize from parent data when loaded
  useEffect(()=> {
    if(parent.data){
      setDentalIds(parent.data.dentalHistory.map(h=> h.option.id));
      setMedicalIds(parent.data.medicalHistory.map(h=> h.option.id));
      setAllergyIds(parent.data.allergies.map(h=> h.option.id));
    }
  },[parent.data]);

  const patchMutation = useMutation({
    mutationFn: (payload: any)=> patchJSON(`/api/patients/${patientId}/history`, payload),
    onSuccess: ()=> { qc.invalidateQueries({ queryKey:['patient-full', patientId] }); }
  });

  const createMutation = useMutation({
    mutationFn: async ({ kind, label }: { kind: 'dental'|'medical'|'allergy'; label: string })=> {
      const map: Record<string,string> = { dental: '/api/options/dental-history', medical: '/api/options/medical-history', allergy: '/api/options/allergies' };
      return postJSON(map[kind], { label });
    },
    onSuccess: (_d,vars)=> {
      if(vars.kind==='dental') { qc.invalidateQueries({ queryKey:['options','dental-history'] }); setNewDental(''); }
      if(vars.kind==='medical'){ qc.invalidateQueries({ queryKey:['options','medical-history'] }); setNewMedical(''); }
      if(vars.kind==='allergy'){ qc.invalidateQueries({ queryKey:['options','allergies'] }); setNewAllergy(''); }
    }
  });

  function toggleSelection(kind: 'dental'|'medical'|'allergy', id: number) {
    const setter = kind==='dental'? setDentalIds : kind==='medical'? setMedicalIds : setAllergyIds;
    const current = kind==='dental'? dentalIds : kind==='medical'? medicalIds : allergyIds;
    if(current.includes(id)) setter(current.filter(x=> x!==id)); else setter([...current,id]);
  }

  function save(){
    patchMutation.mutate({ dentalHistoryIds: dentalIds, medicalHistoryIds: medicalIds, allergyIds });
  }

  const allBusy = dentalQ.isLoading || medicalQ.isLoading || allergyQ.isLoading || parent.isLoading;
  const disabledSave = patchMutation.isPending || allBusy;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center justify-between">
        <span>Patient History</span>
        <button onClick={save} disabled={disabledSave} className="text-xs bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded shadow-sm">
          {patchMutation.isPending? 'Saving...' : 'Save'}
        </button>
      </h2>
      {allBusy && <div className="text-xs text-gray-500">Loading options...</div>}
      <div className="space-y-5">
        {/* Dental History */}
        <HistoryMultiSelect
          label="Past Dental History"
          kind="dental"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          options={dentalQ.data||[]}
          selectedIds={dentalIds}
          toggle={id=>toggleSelection('dental',id)}
          newValue={newDental}
          setNewValue={setNewDental}
          onAdd={()=> newDental.trim() && createMutation.mutate({ kind:'dental', label:newDental.trim() })}
          busyAdd={createMutation.isPending && newDental.length>0}
        />
        {/* Medical History */}
        <HistoryMultiSelect
          label="Past Medical History"
          kind="medical"
          openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          options={medicalQ.data||[]}
          selectedIds={medicalIds}
          toggle={id=>toggleSelection('medical',id)}
          newValue={newMedical}
          setNewValue={setNewMedical}
          onAdd={()=> newMedical.trim() && createMutation.mutate({ kind:'medical', label:newMedical.trim() })}
          busyAdd={createMutation.isPending && newMedical.length>0}
        />
        {/* Allergies */}
        <HistoryMultiSelect
          label="Drug Allergies"
          kind="allergy"
            openDropdown={openDropdown}
          setOpenDropdown={setOpenDropdown}
          options={allergyQ.data||[]}
          selectedIds={allergyIds}
          toggle={id=>toggleSelection('allergy',id)}
          newValue={newAllergy}
          setNewValue={setNewAllergy}
          onAdd={()=> newAllergy.trim() && createMutation.mutate({ kind:'allergy', label:newAllergy.trim() })}
          busyAdd={createMutation.isPending && newAllergy.length>0}
          badgeClass="bg-red-50 text-red-700 border-red-200"
        />
      </div>
      {patchMutation.isError && <p className="text-xs text-red-600 mt-3">Save failed.</p>}
      {patchMutation.isSuccess && <p className="text-[10px] text-emerald-600 mt-3">Saved.</p>}
    </div>
  );
}

interface HistoryMultiSelectProps {
  label: string;
  kind: 'dental'|'medical'|'allergy';
  options: { id:number; label:string }[];
  selectedIds: number[];
  toggle: (id:number)=>void;
  openDropdown: null | 'dental' | 'medical' | 'allergy';
  setOpenDropdown: (v:null | 'dental' | 'medical' | 'allergy')=>void;
  newValue: string;
  setNewValue: (s:string)=>void;
  onAdd: ()=>void;
  busyAdd: boolean;
  badgeClass?: string;
}

function HistoryMultiSelect({ label, kind, options, selectedIds, toggle, openDropdown, setOpenDropdown, newValue, setNewValue, onAdd, busyAdd, badgeClass }: HistoryMultiSelectProps){
  const selected = options.filter(o=> selectedIds.includes(o.id));
  return (
    <div className="flex flex-col gap-2 relative">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        <button type="button" onClick={()=> setOpenDropdown(openDropdown===kind? null: kind)} className="text-[11px] px-2 py-1 rounded border bg-white hover:bg-gray-50 text-gray-700">{openDropdown===kind? 'Close' : 'Select'}</button>
      </div>
      <div className="flex flex-wrap gap-2 min-h-[28px]">
        {selected.map(s=> (
          <span key={s.id} className={`inline-flex items-center gap-1 text-[11px] border px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 ${badgeClass||''}`}>
            {s.label}
            <button type="button" onClick={()=>toggle(s.id)} className="hover:text-indigo-900">×</button>
          </span>
        ))}
        {!selected.length && <span className="text-[11px] text-gray-400">None selected</span>}
      </div>
      {openDropdown===kind && (
        <div className="absolute z-20 top-full left-0 mt-2 w-full bg-white border rounded shadow-lg p-3 space-y-3 max-h-72 overflow-auto thin-scrollbar">
          <div className="flex items-center gap-2">
            <input value={newValue} onChange={e=>setNewValue(e.target.value)} placeholder={`Add new ${kind} option`} className="border rounded px-2 py-1 text-xs flex-1" />
            <button disabled={!newValue.trim()||busyAdd} onClick={onAdd} className="text-xs bg-green-600 disabled:opacity-50 text-white px-2 py-1 rounded">{busyAdd? '...' : 'Add'}</button>
          </div>
          <ul className="space-y-1">
            {options.map(o=> (
              <li key={o.id}>
                <label className="flex items-center gap-2 text-[11px]">
                  <input type="checkbox" checked={selectedIds.includes(o.id)} onChange={()=>toggle(o.id)} />
                  <span>{o.label}</span>
                </label>
              </li>
            ))}
            {!options.length && <li className="text-[10px] text-gray-500">No options yet.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---- Unified Visit Form ----
function UnifiedVisitForm({ patientId, onCreated, visits }: { patientId: number; onCreated: ()=>void; visits: any[] }) {
  const qc = useQueryClient();
  const [type, setType] = useState<'GENERAL'|'ORTHODONTIC'|'ROOT_CANAL'>('GENERAL');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState<{ complaintId: number | ''; quadrantId: number | '' }[]>([{ complaintId: '', quadrantId: '' }]);
  const [findingRows, setFindingRows] = useState<{ tooth: string; findingId: number | '' }[]>([]);
  // Removed legacy selectedTreatmentIds (now using row-based treatmentPlanRows)
  const [treatmentPlanRows, setTreatmentPlanRows] = useState<{ treatmentId: number | ''; tooth?: string }[]>([]);
  const [treatmentPlanError, setTreatmentPlanError] = useState('');
  function hasDuplicateCandidate(rows:{treatmentId:number|''; tooth?:string}[]) {
    const seen = new Set<string>();
    for (const r of rows) {
      if (typeof r.treatmentId === 'number') {
        const key = r.treatmentId + '|' + (r.tooth || '');
        if (seen.has(key)) return true;
        seen.add(key);
      }
    }
    return false;
  }
  // (helpers defined once earlier; removed duplicate definitions)
  const [investigationRows, setInvestigationRows] = useState<{ typeOptionId: number | ''; tooth?: string; findings?: string }[]>([]);
  const [treatmentDoneRows, setTreatmentDoneRows] = useState<{ treatmentId: number | ''; tooth?: string; notes?: string }[]>([]);
  const [prescriptionRows, setPrescriptionRows] = useState<{ medicineId: number | ''; timing?: string; quantity?: string; days?: string; notes?: string }[]>([]);
  const [nextApptDate, setNextApptDate] = useState('');
  const [orthoTotal, setOrthoTotal] = useState('');
  const [bracketType, setBracketType] = useState('METAL_REGULAR');
  const [doctorName, setDoctorName] = useState('');
  const [rcTotal, setRcTotal] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);

  // Helper functions (defined once)
  function addRow(){ setRows(r=> [...r,{ complaintId:'', quadrantId:'' }]); }
  function removeRow(i:number){ setRows(r=> r.length===1? r : r.filter((_,idx)=> idx!==i)); }
  function addFindingRow(){ setFindingRows(r=> [...r,{ tooth:'', findingId:'' }]); }
  function setFindingRow(i:number,key:'tooth'|'findingId',val:any){ setFindingRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='findingId' && val? Number(val): val }: row)); }
  function removeFindingRow(i:number){ setFindingRows(r=> r.filter((_,idx)=> idx!==i)); }
  function addInvestigationRow(){ setInvestigationRows(r=> [...r,{ typeOptionId:'', tooth:'', findings:'' }]); }
  function setInvestigationRow(i:number,key:'typeOptionId'|'tooth'|'findings',val:any){ setInvestigationRows(r=> r.map((row,idx)=> idx===i? { ...row,[key]: key==='typeOptionId' && val? Number(val): val }: row)); }
  function removeInvestigationRow(i:number){ setInvestigationRows(r=> r.filter((_,idx)=> idx!==i)); }
  function addTreatmentPlanRow(){ setTreatmentPlanRows(r=> [...r,{ treatmentId:'', tooth:'' }]); }
  function setTreatmentPlanRow(i:number,key:'treatmentId'|'tooth',val:any){
    setTreatmentPlanRows(r=> {
      const next = r.map((row,idx)=> idx===i? { ...row,[key]: key==='treatmentId' && val? Number(val): val }: row);
      if(hasDuplicateCandidate(next)) { setTreatmentPlanError('Duplicate treatment (same treatment & tooth) not allowed.'); return r; }
      setTreatmentPlanError('');
      return next;
    });
  }
  function removeTreatmentPlanRow(i:number){ setTreatmentPlanRows(r=> r.filter((_,idx)=> idx!==i)); if(!hasDuplicateCandidate(treatmentPlanRows)) setTreatmentPlanError(''); }

  const complaintsQuery = useQuery({ queryKey: ['options','complaints'], queryFn: ()=> getJSON<ComplaintOption[]>('/api/options/complaints'), enabled: type==='GENERAL' });
  const quadrantsQuery = useQuery({ queryKey: ['options','quadrants'], queryFn: ()=> getJSON<QuadrantOption[]>('/api/options/quadrants'), enabled: type==='GENERAL' });
  const findingsQuery = useQuery({ queryKey: ['options','oral-findings'], queryFn: ()=> getJSON<OralFindingOption[]>('/api/options/oral-findings'), enabled: type==='GENERAL' });
  const treatmentsQuery = useQuery({ queryKey: ['options','treatments'], queryFn: ()=> getJSON<TreatmentOption[]>('/api/options/treatments'), enabled: type==='GENERAL' });
  const medicinesQuery = useQuery({ queryKey: ['options','medicines'], queryFn: ()=> getJSON<any[]>('/api/options/medicines'), enabled: type==='GENERAL' });
  const investigationTypesQuery = useQuery({ queryKey: ['options','investigation-types'], queryFn: ()=> getJSON<any[]>('/api/options/investigation-types') });

  function resetSpecific(){
  setNotes(''); setRows([{ complaintId:'', quadrantId:'' }]); setFindingRows([]); setTreatmentPlanRows([]); setInvestigationRows([]); setTreatmentDoneRows([]); setPrescriptionRows([]); setNextApptDate(''); setOrthoTotal(''); setDoctorName(''); setRcTotal('');
  setNotes(''); setRows([{ complaintId:'', quadrantId:'' }]); setFindingRows([]); setTreatmentPlanRows([]); setInvestigationRows([]); setTreatmentDoneRows([]); setPrescriptionRows([]); setNextApptDate(''); setOrthoTotal(''); setDoctorName(''); setRcTotal('');
  }

  function setRow(idx: number, key: 'complaintId' | 'quadrantId', value: number) { setRows(r => r.map((row,i)=> i===idx ? { ...row, [key]: value } : row)); }
  // (second duplicate helper block removed)

  const mutation = useMutation({
    mutationFn: async () => {
      if (type === 'GENERAL') {
        const complaints = rows.filter(r=> typeof r.complaintId === 'number' && typeof r.quadrantId === 'number').map(r=> ({ complaintOptionId: r.complaintId as number, quadrantOptionId: r.quadrantId as number }));
        const oralFindings = findingRows.filter(r=> r.tooth && typeof r.findingId==='number').map(r=> ({ toothNumber: r.tooth, findingOptionId: r.findingId as number }));
        const treatmentPlan = treatmentPlanRows.filter(r=> typeof r.treatmentId==='number').map(r=> ({ treatmentOptionId: r.treatmentId as number, toothNumber: r.tooth || undefined }));
        const investigations = investigationRows.filter(r=> typeof r.typeOptionId==='number').map(r=> ({ typeOptionId: r.typeOptionId as number, toothNumber: r.tooth || undefined, findings: r.findings || undefined }));
        const treatmentDone = treatmentDoneRows.filter(r=> typeof r.treatmentId==='number').map(r=> ({ treatmentOptionId: r.treatmentId as number, toothNumber: r.tooth || undefined, notes: r.notes || undefined }));
        const prescriptions = prescriptionRows.filter(r=> typeof r.medicineId==='number').map((p,idx)=> ({ medicineId: p.medicineId as number, timing: p.timing || undefined, quantity: p.quantity? Number(p.quantity): undefined, days: p.days? Number(p.days): undefined, notes: p.notes||undefined }));
        const created = await postJSON('/api/visits/general', { patientId, notes: notes || undefined, complaints, oralFindings, treatmentPlan, investigations, date: date || undefined, nextAppointmentDate: nextApptDate || undefined, treatmentDone, prescriptions });
        // Upload attachments if any
        if (attachmentFiles && attachmentFiles.length) {
          try {
            setUploading(true);
            const fd = new FormData();
            Array.from(attachmentFiles).forEach(f=> fd.append('files', f));
            const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
            const res = await fetch(`${base}/api/visits/${created.id}/media`, { method: 'POST', body: fd });
            if (!res.ok) {
              console.error('Upload failed', await res.text());
              throw new Error('Attachment upload failed');
            }
          } finally {
            setUploading(false);
            setAttachmentFiles(null);
          }
        }
      } else if (type === 'ORTHODONTIC') {
        await postJSON('/api/orthodontic/plan', { patientId, bracketType, totalAmount: Number(orthoTotal), doctorName: doctorName || undefined, date: date || undefined });
      } else if (type === 'ROOT_CANAL') {
        await postJSON('/api/root-canal/plan', { patientId, totalAmount: Number(rcTotal), date: date || undefined });
      }
    },
    onSuccess: () => { resetSpecific(); setDate(''); onCreated(); },
  });

  // Chart data (historical + current form inputs)
  const chartDataFindings: ToothChartFinding[] = useMemo(()=> {
    const prev: ToothChartFinding[] = [];
    visits.forEach(v=> {
      if(v.generalDetails?.oralFindings){
        v.generalDetails.oralFindings.forEach((of:any) => {
          if(of.toothNumber){
            const label = of.finding?.label || of.findingLabel || `Finding #${of.findingId}`;
            prev.push({ tooth: of.toothNumber, label, source: 'prev' });
          }
        });
      }
    });
    const current: ToothChartFinding[] = findingRows.filter(r=> r.tooth && typeof r.findingId==='number').map(r=> {
      const label = findingsQuery.data?.find(f=> f.id === r.findingId)?.label || `#${r.findingId}`;
      return { tooth: r.tooth, label, source: 'current' } as ToothChartFinding;
    });
    return [...prev, ...current];
  }, [visits, findingRows, findingsQuery.data]);

  const chartDataTreatments: ToothChartTreatment[] = useMemo(()=> {
    const prev: ToothChartTreatment[] = [];
    visits.forEach(v=> {
      if(v.generalDetails?.treatmentsDone){
        v.generalDetails.treatmentsDone.forEach((td:any) => {
          if(td.toothNumber){
            const label = td.treatment?.label || td.treatmentLabel || `Treatment #${td.treatmentId}`;
            prev.push({ tooth: td.toothNumber, label, source: 'prev' });
          }
        });
      }
    });
    const current: ToothChartTreatment[] = treatmentDoneRows.filter(r=> typeof r.treatmentId==='number' && r.tooth).map(r=> {
      const label = treatmentsQuery.data?.find(t=> t.id === r.treatmentId)?.label || `#${r.treatmentId}`;
      return { tooth: r.tooth!, label, source: 'current' } as ToothChartTreatment;
    });
    return [...prev, ...current];
  }, [visits, treatmentDoneRows, treatmentsQuery.data]);

  const submitDisabled = mutation.isPending || (type==='GENERAL' ? !!treatmentPlanError : (type==='ORTHODONTIC' ? !orthoTotal : !rcTotal));

  const treatmentPlanSummary = useMemo(()=> {
    const groups: { label:string; count:number; teeth:string[] }[] = [];
    const map = new Map<number, { label:string; count:number; teeth:string[] }>();
    treatmentPlanRows.forEach(r=> {
      if (typeof r.treatmentId === 'number') {
        const t = treatmentsQuery.data?.find(t=> t.id === r.treatmentId);
        const existing = map.get(r.treatmentId) || { label: t?.label || ('#'+r.treatmentId), count:0, teeth:[] };
        existing.count++;
        if (r.tooth) existing.teeth.push(r.tooth);
        map.set(r.treatmentId, existing);
      }
    });
    map.forEach(v=> groups.push(v));
    return groups;
  }, [treatmentPlanRows, treatmentsQuery.data]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-gray-800">Add Visit</h2>
  <form onSubmit={(e)=> { e.preventDefault(); mutation.mutate(); }} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Clinic Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">Type</label>
            <select value={type} onChange={e=> { setType(e.target.value as any); resetSpecific(); }} className="border rounded px-3 py-2 text-sm">
              <option value="GENERAL">General Visit</option>
              <option value="ORTHODONTIC">Orthodontic</option>
              <option value="ROOT_CANAL">Root Canal</option>
            </select>
          </div>
        </div>
        {type === 'GENERAL' && (
          <div className="space-y-8">
            <div className="bg-gray-50 border rounded p-2"><ToothChart findings={chartDataFindings} treatments={chartDataTreatments} /></div>
            {/* 1. Chief Complaint (multi) with Quadrants */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">1. Chief Complaint</h3>
                <button type="button" onClick={addRow} className="text-xs text-indigo-600 hover:underline">Add</button>
              </div>
              {rows.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <select className="border rounded px-2 py-1 text-sm flex-1" value={row.complaintId} onChange={e=>setRow(idx,'complaintId', Number(e.target.value))}>
                    <option value="">Complaint</option>
                    {complaintsQuery.data?.map((c:any)=>(<option key={c.id} value={c.id}>{c.label}</option>))}
                  </select>
                  <select className="border rounded px-2 py-1 text-sm flex-1" value={row.quadrantId} onChange={e=>setRow(idx,'quadrantId', Number(e.target.value))}>
                    <option value="">Quadrant</option>
                    {quadrantsQuery.data?.map((q:any)=>(<option key={q.id} value={q.id}>{q.code}</option>))}
                  </select>
                  <button type="button" onClick={()=>removeRow(idx)} className="text-xs text-red-600" disabled={rows.length===1}>✕</button>
                </div>
              ))}
            </div>
            {/* 2. Oral Examination */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">2. Oral Examination</h3>
                <button type="button" onClick={addFindingRow} className="text-xs text-indigo-600 hover:underline">Add</button>
              </div>
              {findingRows.length === 0 && <div className="text-xs text-gray-400">No findings added.</div>}
              {findingRows.map((row, idx)=>(
                <div key={idx} className="grid grid-cols-2 gap-2 items-center">
                  <input value={row.tooth} onChange={e=>setFindingRow(idx,'tooth',e.target.value)} placeholder="Tooth (FDI)" className="border rounded px-2 py-1 text-sm" />
                  <div className="flex gap-2">
                    <select value={row.findingId} onChange={e=>setFindingRow(idx,'findingId', Number(e.target.value))} className="border rounded px-2 py-1 text-sm flex-1">
                      <option value="">Finding</option>
                      {findingsQuery.data?.map(f=> <option key={f.id} value={f.id}>{f.label}</option>)}
                    </select>
                    <button type="button" onClick={()=>removeFindingRow(idx)} className="text-xs text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>
            {/* 3. Investigations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">3. Investigations</h3>
                <button type="button" onClick={addInvestigationRow} className="text-xs text-indigo-600 hover:underline">Add</button>
              </div>
              {investigationRows.length === 0 && <div className="text-xs text-gray-400">None added.</div>}
              <div className="space-y-2">
                {investigationRows.map((row, idx)=>(
                  <div key={idx} className="flex flex-col gap-1 border rounded p-2 bg-gray-50">
                    <div className="flex gap-2 items-center">
                      <select value={row.typeOptionId} onChange={e=> setInvestigationRow(idx,'typeOptionId', e.target.value)} className="border rounded px-2 py-1 text-xs">
                        <option value="">Type</option>
                        {investigationTypesQuery.data?.map((o:any)=> <option key={o.id} value={o.id}>{o.label}</option>)}
                      </select>
                      <input value={row.tooth} onChange={e=> setInvestigationRow(idx,'tooth', e.target.value)} placeholder="Tooth" className="border rounded px-2 py-1 text-xs w-28" />
                      <button type="button" onClick={()=>removeInvestigationRow(idx)} className="text-xs text-red-600">✕</button>
                    </div>
                    <input value={row.findings} onChange={e=> setInvestigationRow(idx,'findings', e.target.value)} placeholder="Findings" className="border rounded px-2 py-1 text-xs" />
                  </div>
                ))}
              </div>
            </div>
            {/* 4. Treatment Plan (row dropdowns with duplicate validation & summary) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">4. Treatment Plan</h3>
                <button type="button" onClick={addTreatmentPlanRow} className="text-xs text-indigo-600 hover:underline">Add</button>
              </div>
              {treatmentPlanRows.length===0 && <div className="text-xs text-gray-400">None added.</div>}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {treatmentPlanRows.map((row,idx)=>(
                  <div key={idx} className="flex flex-wrap items-center gap-2 text-xs border rounded p-2 bg-white">
                    <select value={row.treatmentId} onChange={e=> setTreatmentPlanRow(idx,'treatmentId', e.target.value)} className="border rounded px-2 py-1 min-w-[160px]">
                      <option value="">Treatment</option>
                      {treatmentsQuery.data?.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                    <input value={row.tooth||''} onChange={e=> setTreatmentPlanRow(idx,'tooth', e.target.value)} placeholder="Tooth (opt)" className="border rounded px-2 py-1 w-24" />
                    <button type="button" onClick={()=> removeTreatmentPlanRow(idx)} className="text-red-600">✕</button>
                  </div>
                ))}
              </div>
              {treatmentPlanError && <div className="text-[10px] text-red-600">{treatmentPlanError}</div>}
              {treatmentPlanSummary.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[10px] text-gray-600">
                  {treatmentPlanSummary.map(s=> (
                    <span key={s.label} className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                      {s.label}{s.count>1 && <strong>x{s.count}</strong>}{s.teeth.length ? <em className="not-italic text-[9px]">[{s.teeth.join(',')}]</em> : null}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {/* 5. Treatment Done */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">5. Treatment Done</h3>
                <button type="button" onClick={()=> setTreatmentDoneRows(r=> [...r,{ treatmentId:'', tooth:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
              </div>
              {treatmentDoneRows.length===0 && <div className="text-xs text-gray-400">None added.</div>}
              {treatmentDoneRows.map((row,idx)=>(
                <div key={idx} className="flex flex-wrap gap-2 items-center text-xs border rounded p-2 bg-gray-50">
                  <select value={row.treatmentId} onChange={e=> setTreatmentDoneRows(list=> list.map((r,i)=> i===idx? { ...r, treatmentId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-2 py-1">
                    <option value="">Treatment</option>
                    {treatmentsQuery.data?.map(t=> <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <input value={row.tooth||''} onChange={e=> setTreatmentDoneRows(list=> list.map((r,i)=> i===idx? { ...r, tooth: e.target.value }: r))} placeholder="Tooth" className="border rounded px-2 py-1 w-20" />
                  <input value={row.notes||''} onChange={e=> setTreatmentDoneRows(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-2 py-1 flex-1 min-w-[120px]" />
                  <button type="button" onClick={()=> setTreatmentDoneRows(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
                </div>
              ))}
            </div>
            {/* 6. Prescriptions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">6. Prescriptions</h3>
                <button type="button" onClick={()=> setPrescriptionRows(r=> [...r,{ medicineId:'', timing:'', quantity:'', days:'', notes:'' }])} className="text-xs text-indigo-600 hover:underline">Add</button>
              </div>
              {prescriptionRows.length===0 && <div className="text-xs text-gray-400">None added.</div>}
              {prescriptionRows.map((row,idx)=>(
                <div key={idx} className="grid grid-cols-6 gap-2 items-center text-[11px] border rounded p-2 bg-white">
                  <select value={row.medicineId} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, medicineId: e.target.value? Number(e.target.value): '' }: r))} className="border rounded px-1 py-1 col-span-2">
                    <option value="">Medicine</option>
                    {medicinesQuery.data?.map((m:any)=> <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  <input value={row.timing||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, timing: e.target.value }: r))} placeholder="1-0-1" className="border rounded px-1 py-1" />
                  <input value={row.quantity||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, quantity: e.target.value }: r))} placeholder="Qty" className="border rounded px-1 py-1 w-14" />
                  <input value={row.days||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, days: e.target.value }: r))} placeholder="Days" className="border rounded px-1 py-1 w-14" />
                  <div className="flex items-center gap-1">
                    <input value={row.notes||''} onChange={e=> setPrescriptionRows(list=> list.map((r,i)=> i===idx? { ...r, notes: e.target.value }: r))} placeholder="Notes" className="border rounded px-1 py-1 flex-1" />
                    <button type="button" onClick={()=> setPrescriptionRows(list=> list.filter((_,i)=> i!==idx))} className="text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>

            {/* 7. Next Appointment Date */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-700">7. Next Appointment Date</h3>
              <input type="date" value={nextApptDate} onChange={e=> setNextApptDate(e.target.value)} className="border rounded px-2 py-2 text-sm w-56" />
            </div>
            {/* 8. Notes */}
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-gray-700">8. Notes</h3>
              <textarea className="border rounded px-3 py-2 h-24 text-sm" value={notes} onChange={e=>setNotes(e.target.value)} />
            </div>
            {/* 9. Attachments */}
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-semibold text-gray-700">9. Attachments</h3>
              <input type="file" multiple onChange={e=> setAttachmentFiles(e.target.files)} className="text-xs" />
              {attachmentFiles && attachmentFiles.length > 0 && (
                <div className="text-[10px] text-gray-500">{attachmentFiles.length} file(s) selected</div>
              )}
              {uploading && <div className="text-[10px] text-indigo-600">Uploading...</div>}
            </div>
          </div>
        )}
        {type === 'ORTHODONTIC' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Total Amount</label>
              <input type="number" min={1} value={orthoTotal} onChange={e=>setOrthoTotal(e.target.value)} className="border rounded px-3 py-2 text-sm" required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Bracket Type</label>
              <select value={bracketType} onChange={e=>setBracketType(e.target.value)} className="border rounded px-3 py-2 text-sm">
                <option value="METAL_REGULAR">Metal Regular</option>
                <option value="METAL_PREMIUM">Metal Premium</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Doctor Name (opt)</label>
              <input value={doctorName} onChange={e=>setDoctorName(e.target.value)} className="border rounded px-3 py-2 text-sm" />
            </div>
          </div>
        )}
        {type === 'ROOT_CANAL' && (
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-600">Total Amount</label>
              <input type="number" min={1} value={rcTotal} onChange={e=>setRcTotal(e.target.value)} className="border rounded px-3 py-2 text-sm" required />
            </div>
          </div>
        )}
        {mutation.isError && <div className="text-xs text-red-600" role="alert">{(mutation.error as any)?.message || 'Failed to save visit'}</div>}
        <button disabled={submitDisabled || uploading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-md font-medium disabled:opacity-50 flex items-center justify-center gap-2">
          {uploading ? 'Uploading...' : (mutation.isPending ? 'Saving...' : 'Add Visit')}
        </button>
      </form>
    </div>
  );
}

function openWhatsApp(phone: string){
  const cleaned = phone.replace(/[^0-9+]/g,'')
  const url = `https://wa.me/${cleaned.startsWith('+')? cleaned.substring(1): cleaned}`;
  window.open(url,'_blank','noopener');
}

// Read-only view for a visit (general or follow-up)
function VisitDetailsView({ visit, patientId, setEditingVisitId, setFollowUpFor }: { visit:any; patientId:number; setEditingVisitId:(id:number)=>void; setFollowUpFor:(id:number)=>void }) {
  const qc = useQueryClient();
  if(!visit) return <div className="text-sm text-gray-500">Visit not found.</div>;
  const gd = visit.generalDetails;
  const ortho = (visit as any).orthodonticPlan;
  const rcp = (visit as any).rootCanalPlan;
  const base = (typeof (window as any).VITE_API_URL !== 'undefined' ? (window as any).VITE_API_URL : (import.meta as any)?.env?.VITE_API_URL) || 'http://localhost:4000';
  return (
    <div className="space-y-6 text-sm">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-semibold text-gray-800">{visit.type} Visit</span>
        <span className="text-xs text-gray-500">{new Date(visit.date).toLocaleDateString()}</span>
        {gd?.nextAppointmentDate && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">Next: {new Date(gd.nextAppointmentDate).toLocaleDateString()}</span>}
        <button onClick={()=> setEditingVisitId(visit.id)} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded">Edit</button>
        {visit.type==='GENERAL' && <button onClick={()=> setFollowUpFor(visit.id)} className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded">+ Follow-Up</button>}
      </div>
      {gd?.notes && <div><span className="font-semibold">Notes: </span>{gd.notes}</div>}
      {gd?.complaints?.length ? (
        <div>
          <div className="font-semibold text-gray-700 mb-1">Complaints</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {gd.complaints.map((c:any)=> (<li key={c.id}>{c.complaint?.label || `Complaint #${c.complaintId}`} / {c.quadrant?.code || `Quadrant #${c.quadrantId}`}</li>))}
          </ul>
        </div>
      ) : null}
      {gd?.oralFindings?.length ? (
        <div>
          <div className="font-semibold text-gray-700 mb-1">Oral Findings</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {gd.oralFindings.map((f:any)=>(<li key={f.id}>Tooth {f.toothNumber}: {f.finding?.label || `Finding #${f.findingId}`}</li>))}
          </ul>
        </div>
      ) : null}
      {gd?.treatmentPlans?.length ? (
        <div>
          <div className="font-semibold text-gray-700 mb-1">Planned Treatments</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {gd.treatmentPlans.map((t:any)=>(<li key={t.id}>{t.treatment?.label || `Treatment #${t.treatmentId}`}</li>))}
          </ul>
        </div>
      ) : null}
      {gd?.treatmentsDone?.length ? (
        <div>
          <div className="font-semibold text-gray-700 mb-1">Treatments Done</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {gd.treatmentsDone.map((t:any)=>(<li key={t.id}>{t.treatment?.label || `Treatment #${t.treatmentId}`}{t.toothNumber?` (Tooth ${t.toothNumber})`:''}{t.notes?`: ${t.notes}`:''}</li>))}
          </ul>
        </div>
      ) : null}
      {(visit as any).prescriptions?.length ? (
        <div>
          <div className="font-semibold text-gray-700 mb-1">Prescriptions</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {(visit as any).prescriptions.map((p:any)=>(<li key={p.id}>#{p.slNo} {p.medicine?.name || `Med #${p.medicineId}`} {p.timing?`- ${p.timing}`:''}{p.quantity?` x${p.quantity}`:''}{p.days?` for ${p.days}d`:''}{p.notes?` (${p.notes})`:''}</li>))}
          </ul>
        </div>
      ) : null}
      {gd?.investigations?.length ? (
        <div>
          <div className="font-semibold text-gray-700 mb-1">Investigations</div>
          <ul className="list-disc ml-5 space-y-0.5">
            {gd.investigations.map((inv:any)=>{
              const label = inv.typeOption?.label || inv.typeOptionLabel || inv.type || `Type #${inv.typeOptionId || inv.id}`;
              return (<li key={inv.id}>{label}{inv.toothNumber ? ` (Tooth ${inv.toothNumber})` : ''}{inv.findings ? `: ${inv.findings}` : ''}</li>);
            })}
          </ul>
        </div>
      ) : null}
      {visit.media?.length ? (
        <div className="space-y-2">
          <div className="font-semibold text-gray-700">Attachments <span className="text-xs text-gray-400 font-normal">{visit.media.length}</span></div>
          <div className="flex flex-wrap gap-3 ml-1">
            {visit.media.map((m:any)=> {
              const url = m.path?.startsWith('http') ? m.path : `${base}/${m.path?.replace(/^\\/,'')}`;
              const isImage = m.mimeType?.startsWith('image/');
              const fileName = m.originalName || (m.path?.split('/')?.slice(-1)[0]) || ('file-'+m.id);
              return (
                <a key={m.id} href={url} target="_blank" rel="noopener" className="border rounded p-2 flex flex-col items-center w-24 bg-white hover:shadow">
                  {isImage ? <img src={url} alt={fileName} className="object-cover w-full h-16 rounded" /> : <span className="text-[10px] text-gray-600 h-16 flex items-center justify-center w-full">{m.type || 'FILE'}</span>}
                  <span className="mt-1 text-[10px] text-indigo-600 line-clamp-2 text-center" title={fileName}>{fileName}</span>
                </a>
              );
            })}
          </div>
        </div>
      ) : null}
      {ortho ? (
        <div className="space-y-1 border-t pt-2">
          <div className="font-semibold text-gray-700 flex items-center justify-between">Orthodontic Plan <AddOrthodonticTreatmentForm planId={ortho.id} patientId={patientId} /></div>
          <div className="text-xs text-gray-500">Bracket: {ortho.bracketType.replace('_',' ')} | Total: {ortho.totalAmount}{ortho.doctorName ? ` | Dr: ${ortho.doctorName}` : ''}</div>
          {ortho.treatments.length ? (
            <ul className="list-disc ml-5 space-y-0.5 text-xs">
              {ortho.treatments.map((t:any)=> (<li key={t.id}>{new Date(t.date).toLocaleDateString()} - {t.treatmentLabel}</li>))}
            </ul>
          ) : <div className="text-xs text-gray-400">No treatments yet.</div>}
        </div>
      ) : null}
      {rcp ? (
        <div className="space-y-1 border-t pt-2">
          <div className="font-semibold text-gray-700 flex items-center justify-between">Root Canal Plan <AddRootCanalProcedureForm planId={rcp.id} patientId={patientId} /></div>
          <div className="text-xs text-gray-500">Total: {rcp.totalAmount}</div>
          {rcp.procedures.length ? (
            <ul className="list-disc ml-5 space-y-0.5 text-xs">
              {rcp.procedures.map((p:any)=> (<li key={p.id}>{new Date(p.date).toLocaleDateString()} - {p.procedureLabel}</li>))}
            </ul>
          ) : <div className="text-xs text-gray-400">No procedures yet.</div>}
        </div>
      ) : null}
    </div>
  );
}
