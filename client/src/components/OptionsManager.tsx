import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJSON, postJSON } from '../services/api';

interface Option { id:number; label:string }

export default function OptionsManager(){
  const qc = useQueryClient();
  // Visit form options
  const complaints = useQuery({ queryKey:['options','complaints'], queryFn: ()=> getJSON<Option[]>('/api/options/complaints') });
  const findings = useQuery({ queryKey:['options','oral-findings'], queryFn: ()=> getJSON<Option[]>('/api/options/oral-findings') });
  const investigations = useQuery({ queryKey:['options','investigation-types'], queryFn: ()=> getJSON<Option[]>('/api/options/investigation-types') });
  const treatments = useQuery({ queryKey:['options','treatments'], queryFn: ()=> getJSON<Option[]>('/api/options/treatments') });
  const medicines = useQuery({ queryKey:['options','medicines'], queryFn: ()=> getJSON<{id:number;name:string}[]>('/api/options/medicines') });
  // Patient history options
  const dental = useQuery({ queryKey:['options','dental-history'], queryFn: ()=> getJSON<Option[]>('/api/options/dental-history') });
  const medical = useQuery({ queryKey:['options','medical-history'], queryFn: ()=> getJSON<Option[]>('/api/options/medical-history') });
  const allergy = useQuery({ queryKey:['options','allergies'], queryFn: ()=> getJSON<Option[]>('/api/options/allergies') });

  const [complaintsNew, setComplaintsNew] = useState('');
  const [findingsNew, setFindingsNew] = useState('');
  const [investigationsNew, setInvestigationsNew] = useState('');
  const [treatmentsNew, setTreatmentsNew] = useState('');
  const [medicinesNew, setMedicinesNew] = useState('');
  const [dentalNew,setDentalNew] = useState('');
  const [medicalNew,setMedicalNew] = useState('');
  const [allergyNew,setAllergyNew] = useState('');

  const create = useMutation({
    mutationFn: ({ path, payload }: { path:string; payload:any })=> postJSON(path, payload),
    onSuccess: (_d, vars)=> {
      if(vars.path.includes('complaints')){ qc.invalidateQueries({ queryKey:['options','complaints'] }); setComplaintsNew(''); }
      if(vars.path.includes('oral-findings')){ qc.invalidateQueries({ queryKey:['options','oral-findings'] }); setFindingsNew(''); }
      if(vars.path.includes('investigation-types')){ qc.invalidateQueries({ queryKey:['options','investigation-types'] }); setInvestigationsNew(''); }
      if(vars.path.includes('treatments')){ qc.invalidateQueries({ queryKey:['options','treatments'] }); setTreatmentsNew(''); }
      if(vars.path.includes('medicines')){ qc.invalidateQueries({ queryKey:['options','medicines'] }); setMedicinesNew(''); }
      if(vars.path.includes('dental-history')){ qc.invalidateQueries({ queryKey:['options','dental-history'] }); setDentalNew(''); }
      if(vars.path.includes('medical-history')){ qc.invalidateQueries({ queryKey:['options','medical-history'] }); setMedicalNew(''); }
      if(vars.path.includes('allergies')){ qc.invalidateQueries({ queryKey:['options','allergies'] }); setAllergyNew(''); }
    }
  });
  return (
    <div className="space-y-8">
      <h1 className="text-xl font-semibold">Visit & Patient Options Management</h1>
      
      {/* Visit Form Options */}
      <div>
        <h2 className="text-lg font-medium mb-4 text-gray-700">Visit Form Options</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <OptionColumn 
            title="Chief Complaints" 
            query={complaints} 
            value={complaintsNew} 
            setValue={setComplaintsNew} 
            onAdd={()=> complaintsNew.trim() && create.mutate({ path:'/api/options/complaints', payload: { label: complaintsNew.trim() } })} 
            creating={create.isPending} 
          />
          <OptionColumn 
            title="Oral Findings" 
            query={findings} 
            value={findingsNew} 
            setValue={setFindingsNew} 
            onAdd={()=> findingsNew.trim() && create.mutate({ path:'/api/options/oral-findings', payload: { label: findingsNew.trim() } })} 
            creating={create.isPending} 
          />
          <OptionColumn 
            title="Investigation Types" 
            query={investigations} 
            value={investigationsNew} 
            setValue={setInvestigationsNew} 
            onAdd={()=> investigationsNew.trim() && create.mutate({ path:'/api/options/investigation-types', payload: { label: investigationsNew.trim() } })} 
            creating={create.isPending} 
          />
          <OptionColumn 
            title="Treatments" 
            query={treatments} 
            value={treatmentsNew} 
            setValue={setTreatmentsNew} 
            onAdd={()=> treatmentsNew.trim() && create.mutate({ path:'/api/options/treatments', payload: { label: treatmentsNew.trim() } })} 
            creating={create.isPending} 
          />
          <MedicineColumn 
            query={medicines} 
            value={medicinesNew} 
            setValue={setMedicinesNew} 
            onAdd={()=> medicinesNew.trim() && create.mutate({ path:'/api/options/medicines', payload: { name: medicinesNew.trim() } })} 
            creating={create.isPending} 
          />
        </div>
      </div>

      {/* Patient History Options */}
      <div>
        <h2 className="text-lg font-medium mb-4 text-gray-700">Patient History Options</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <OptionColumn title="Dental History" query={dental} value={dentalNew} setValue={setDentalNew} onAdd={()=> dentalNew.trim() && create.mutate({ path:'/api/options/dental-history', payload: { label: dentalNew.trim() } })} creating={create.isPending} />
          <OptionColumn title="Medical History" query={medical} value={medicalNew} setValue={setMedicalNew} onAdd={()=> medicalNew.trim() && create.mutate({ path:'/api/options/medical-history', payload: { label: medicalNew.trim() } })} creating={create.isPending} />
          <OptionColumn title="Drug Allergies" query={allergy} value={allergyNew} setValue={setAllergyNew} onAdd={()=> allergyNew.trim() && create.mutate({ path:'/api/options/allergies', payload: { label: allergyNew.trim() } })} creating={create.isPending} badgeClass="bg-red-50 text-red-700" />
        </div>
      </div>
    </div>
  );
}

function OptionColumn({ title, query, value, setValue, onAdd, creating, badgeClass }:{ title:string; query:any; value:string; setValue:(v:string)=>void; onAdd:()=>void; creating:boolean; badgeClass?:string }){
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col gap-3">
      <h2 className="font-medium text-sm text-gray-700">{title}</h2>
      <div className="flex gap-2">
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="New option" className="border rounded px-2 py-1 text-xs flex-1" />
        <button disabled={!value.trim()||creating} onClick={onAdd} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded disabled:opacity-50">{creating? '...' : 'Add'}</button>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] min-h-[32px]">
        {query.isLoading && <span className="text-gray-400">Loading...</span>}
        {query.data?.map((o:any)=> <span key={o.id} className={`inline-flex items-center px-2 py-1 rounded-full border bg-indigo-50 text-indigo-700 ${badgeClass||''}`}>{o.label}</span>)}
        {!query.isLoading && (!query.data || !query.data.length) && <span className="text-gray-400">No options yet.</span>}
      </div>
    </div>
  );
}

function MedicineColumn({ query, value, setValue, onAdd, creating }:{ query:any; value:string; setValue:(v:string)=>void; onAdd:()=>void; creating:boolean }){
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4 flex flex-col gap-3">
      <h2 className="font-medium text-sm text-gray-700">Medicines</h2>
      <div className="flex gap-2">
        <input value={value} onChange={e=>setValue(e.target.value)} placeholder="New medicine" className="border rounded px-2 py-1 text-xs flex-1" />
        <button disabled={!value.trim()||creating} onClick={onAdd} className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded disabled:opacity-50">{creating? '...' : 'Add'}</button>
      </div>
      <div className="flex flex-wrap gap-2 text-[11px] min-h-[32px]">
        {query.isLoading && <span className="text-gray-400">Loading...</span>}
        {query.data?.map((m:any)=> <span key={m.id} className="inline-flex items-center px-2 py-1 rounded-full border bg-indigo-50 text-indigo-700">{m.name}</span>)}
        {!query.isLoading && (!query.data || !query.data.length) && <span className="text-gray-400">No medicines yet.</span>}
      </div>
    </div>
  );
}