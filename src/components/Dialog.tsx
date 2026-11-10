import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  children: ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}

export function Dialog({ children, title, onClose, className }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return <dialog ref={ref} className={`dialog ${className ?? ''}`} aria-labelledby={titleId} onCancel={onClose} onClick={event => {
    if (event.target === event.currentTarget) onClose();
  }}>
    <button className="icon-button dialog-close" aria-label="Fechar" title="Fechar" onClick={onClose}><X size={20} /></button>
    <h2 id={titleId} className="sr-only">{title}</h2>
    {children}
  </dialog>;
}
