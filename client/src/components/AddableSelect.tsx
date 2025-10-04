import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { postJSON } from '../services/api';

interface AddableSelectProps<T extends { id:number; label?:string; name?:string }>{
  value: number | '';
  onChange: (id:number| '')=>void;
  options: T[] | undefined;
  placeholder: string;
  // endpoint to POST { label } (or { label, category })
  createPath: string;
  queryKey: any[]; // react-query key to invalidate
  extractLabel?: (o:T)=>string;
  size?: 'xs' | 'sm';
}

export default function AddableSelect<T extends { id:number; label?:string; name?:string }>(props: AddableSelectProps<T>){
  const { value, onChange, options, placeholder, createPath, queryKey, extractLabel, size='sm' } = props;
  const qc = useQueryClient();
  const [open,setOpen] = useState(false);
  const [newLabel,setNewLabel] = useState('');
  const mutation = useMutation({
    mutationFn: async () => {
      const body = { label: newLabel.trim() };
      const created = await postJSON(createPath, body);
      return created as any;
    },
    onSuccess: (created:any) => {
      setNewLabel('');
      setOpen(false);
      qc.invalidateQueries({ queryKey });
      if(created?.id) onChange(created.id);
    }
  });
  const cls = size==='xs'? 'px-2 py-1 text-xs' : 'px-2 py-1 text-sm';
  return (
    <div className="relative inline-flex items-center gap-1">
      <select value={value} onChange={e=> onChange(e.target.value? Number(e.target.value): '')} className={`border rounded ${cls}`}>
        <option value="">{placeholder}</option>
        {options?.map(o=> <option key={o.id} value={o.id}>{extractLabel? extractLabel(o) : (o.label || (o as any).name)}</option>)}
      </select>
      <button type="button" onClick={()=> setOpen(o=> !o)} className={`border rounded bg-white hover:bg-gray-50 text-gray-600 ${cls}`}>+</button>
      {open && (
        <div className="absolute z-30 top-full left-0 mt-1 w-56 bg-white border rounded shadow p-2 flex flex-col gap-2">
          <input value={newLabel} onChange={e=> setNewLabel(e.target.value)} placeholder="New label" className="border rounded px-2 py-1 text-xs" />
          <div className="flex gap-2">
            <button type="button" disabled={!newLabel.trim()||mutation.isPending} onClick={()=> mutation.mutate()} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] px-2 py-1 rounded flex-1">{mutation.isPending? 'Adding...' : 'Add'}</button>
            <button type="button" onClick={()=> { setOpen(false); setNewLabel(''); }} className="text-[11px] px-2 py-1 text-gray-500 hover:text-gray-700">Cancel</button>
          </div>
          {mutation.isError && <div className="text-[10px] text-red-600">Failed.</div>}
        </div>
      )}
    </div>
  );
}