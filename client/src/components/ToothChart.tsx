import React, { useMemo, useState } from 'react';

/**
 * ToothChart
 * Simple FDI (permanent) tooth chart visualization showing counts + details of
 *  - existing (historical) findings
 *  - existing (historical) treatments done
 *  - in-progress (current form) findings & treatments
 *
 * Props accept already-resolved labels so the component is presentation-only.
 */
export interface ToothChartFinding { tooth: string; label: string; source: 'prev' | 'current'; }
export interface ToothChartTreatment { tooth: string; label: string; source: 'prev' | 'current'; }

export interface ToothChartProps {
  findings: ToothChartFinding[]; // includes previous + current
  treatments: ToothChartTreatment[]; // includes previous + current
  className?: string;
}

// FDI permanent teeth layout (adult) - represented as arrays for rows.
const upperRightToLeft = ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28'];
const lowerLeftToRight = ['38','37','36','35','34','33','32','31','41','42','43','44','45','46','47','48'];

export const ToothChart: React.FC<ToothChartProps> = ({ findings, treatments, className }) => {
  const [activeTooth, setActiveTooth] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map: Record<string, { findings: ToothChartFinding[]; treatments: ToothChartTreatment[] }> = {};
    function ensure(t: string){ if(!map[t]) map[t] = { findings: [], treatments: [] }; return map[t]; }
    findings.forEach(f => { if(!f.tooth) return; ensure(f.tooth).findings.push(f); });
    treatments.forEach(t => { if(!t.tooth) return; ensure(t.tooth).treatments.push(t); });
    return map;
  }, [findings, treatments]);

  function renderRow(teeth: string[], rowKey: string){
    return (
      <div className="flex gap-1 justify-center" key={rowKey}>
        {teeth.map(t => {
          const data = grouped[t];
          const findingCount = data?.findings.length || 0;
            const currentFindingCount = data?.findings.filter(f=> f.source==='current').length || 0;
          const treatmentCount = data?.treatments.length || 0;
          const currentTreatmentCount = data?.treatments.filter(tr=> tr.source==='current').length || 0;
          const hasAny = findingCount || treatmentCount;
          const isActive = activeTooth === t;
          return (
            <button
              type="button"
              key={t}
              onClick={()=> setActiveTooth(isActive ? null : t)}
              className={[
                'relative w-10 h-10 rounded border text-[10px] flex flex-col items-center justify-center select-none transition-colors',
                hasAny ? 'bg-white' : 'bg-gray-50',
                isActive ? 'ring-2 ring-indigo-500 z-10' : 'hover:border-indigo-400'
              ].join(' ')}
              title={`Tooth ${t}`}
            >
              <span className="font-semibold text-gray-700">{t}</span>
              <div className="flex gap-0.5 mt-0.5">
                {findingCount > 0 && (
                  <span className="inline-flex items-center px-1 rounded bg-amber-100 text-amber-700 font-medium">
                    F{findingCount}{currentFindingCount?`+${currentFindingCount}`:''}
                  </span>
                )}
                {treatmentCount > 0 && (
                  <span className="inline-flex items-center px-1 rounded bg-emerald-100 text-emerald-700 font-medium">
                    T{treatmentCount}{currentTreatmentCount?`+${currentTreatmentCount}`:''}
                  </span>
                )}
              </div>
              {currentFindingCount>0 && <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />}
              {currentTreatmentCount>0 && <span className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-emerald-500" />}
            </button>
          );
        })}
      </div>
    );
  }

  const active = activeTooth ? grouped[activeTooth] : null;

  return (
    <div className={['flex flex-col gap-2', className].filter(Boolean).join(' ')}>
      <div className="text-xs text-gray-500 font-medium">Tooth Chart (FDI)</div>
      {renderRow(upperRightToLeft, 'upper')}
      <div className="h-1" />
      {renderRow(lowerLeftToRight, 'lower')}
      {activeTooth && active && (
        <div className="mt-2 border rounded p-2 bg-white shadow-sm text-[11px] max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="font-semibold text-gray-700">Tooth {activeTooth}</div>
            <button type="button" onClick={()=> setActiveTooth(null)} className="text-xs text-gray-500 hover:text-gray-700">Close</button>
          </div>
          {!active.findings.length && !active.treatments.length && <div className="text-gray-400">No data.</div>}
          {active.findings.length>0 && (
            <div className="mb-2">
              <div className="font-medium text-amber-700">Findings</div>
              <ul className="list-disc ml-4 space-y-0.5">
                {active.findings.map((f,i)=>(<li key={i} className={f.source==='current' ? 'text-indigo-600' : ''}>{f.label}{f.source==='current'? ' (new)':''}</li>))}
              </ul>
            </div>
          )}
          {active.treatments.length>0 && (
            <div>
              <div className="font-medium text-emerald-700">Treatments</div>
              <ul className="list-disc ml-4 space-y-0.5">
                {active.treatments.map((t,i)=>(<li key={i} className={t.source==='current' ? 'text-indigo-600' : ''}>{t.label}{t.source==='current'? ' (new)':''}</li>))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="text-[10px] text-gray-400 mt-1">
        F = Findings, T = Treatments. Colored dot indicates newly added in current form.
      </div>
    </div>
  );
};

export default ToothChart;
