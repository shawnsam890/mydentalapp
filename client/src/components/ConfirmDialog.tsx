import React from 'react';
import Modal from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string | React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ConfirmDialog({ open, title='Confirm', message, confirmLabel='Confirm', cancelLabel='Cancel', destructive, onConfirm, onCancel, loading }: ConfirmDialogProps){
  return (
    <Modal open={open} onClose={onCancel} title={title} widthClass="max-w-md" footer={null}>
      <div className="space-y-4 text-sm">
        <div>{message}</div>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} disabled={loading} className="px-4 py-2 text-sm rounded border border-gray-300 hover:bg-gray-100">{cancelLabel}</button>
          <button type="button" onClick={onConfirm} disabled={loading} className={`px-4 py-2 text-sm rounded text-white font-medium ${destructive? 'bg-red-600 hover:bg-red-700':'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}>{loading? '...' : confirmLabel}</button>
        </div>
      </div>
    </Modal>
  );
}
