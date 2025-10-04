import React, { useEffect, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  widthClass?: string; // Tailwind width classes
  footer?: React.ReactNode;
}

export default function Modal({ open, onClose, title, children, widthClass='max-w-3xl', footer }: ModalProps){
  const backdropRef = useRef<HTMLDivElement|null>(null);
  const firstFocusable = useRef<HTMLButtonElement|null>(null);
  useEffect(()=> {
    function onKey(e: KeyboardEvent){
      if(e.key === 'Escape') onClose();
    }
    if(open){
      document.addEventListener('keydown', onKey);
      setTimeout(()=> firstFocusable.current?.focus(), 10);
      document.body.style.overflow='hidden';
    } else {
      document.body.style.overflow='';
    }
    return ()=> { document.removeEventListener('keydown', onKey); document.body.style.overflow=''; };
  }, [open,onClose]);
  if(!open) return null;
  return (
    <div ref={backdropRef} className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`bg-white rounded-xl shadow-xl w-full ${widthClass} animate-fade-in-up border border-gray-200`}>        
        <div className="flex items-start justify-between px-4 pt-4 pb-2 border-b">
          <div className="flex flex-col gap-0.5">
            {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
          </div>
          <button ref={firstFocusable} aria-label="Close" onClick={onClose} className="text-gray-500 hover:text-gray-800 px-2 py-1 rounded">✕</button>
        </div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="px-4 py-3 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">{footer}</div>
        )}
      </div>
    </div>
  );
}

// Simple animation classes (could be moved to global css)
// .animate-fade-in-up { animation: fadeInUp .25s ease; }
// @keyframes fadeInUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
