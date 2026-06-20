'use client';

import React, { useRef, useEffect } from 'react';

interface BlockDetailsDialogProps {
  open: boolean;
  block: any;
  onClose: () => void;
  onStartBlock: (id: string) => void;
  onEndBlock: (id: string) => void;
  onDeleteBlock: (id: string) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
}

export default function BlockDetailsDialog({
  open,
  block,
  onClose,
  onStartBlock,
  onEndBlock,
  onDeleteBlock,
  onTaskToggle
}: BlockDetailsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  if (!block || !block.task) return null;

  const isScheduled = block.status === 'SCHEDULED';
  const isActive = block.status === 'ACTIVE';
  const isCompleted = block.status === 'COMPLETED';
  
  const area = block.task.area.toLowerCase();

  return (
    <dialog ref={dialogRef} className="glass-card" style={{ padding: 'var(--space-lg)', maxWidth: '400px', width: '90vw' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: `var(--color-${area})` }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              {block.task.area}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{block.task.title}</h3>
          <p className="font-data" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {new Date(block.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(block.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <button className="btn btn--icon" onClick={onClose}>✕</button>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Estado de la Tarea</h4>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={block.task.status === 'COMPLETED'}
            onChange={(e) => onTaskToggle(block.task.id, e.target.checked)}
          />
          <span style={{ fontSize: '0.875rem', textDecoration: block.task.status === 'COMPLETED' ? 'line-through' : 'none', color: block.task.status === 'COMPLETED' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
            Marcar tarea como completada
          </span>
        </label>
        
        {block.notes && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>Notas del Bloque</h4>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{block.notes}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {isScheduled && (
          <>
            <button className={`btn btn--${area}`} style={{ flex: 1 }} onClick={() => { onStartBlock(block.id); onClose(); }}>
              ▶ Iniciar
            </button>
            <button className="btn" onClick={() => { onDeleteBlock(block.id); onClose(); }}>
              🗑️
            </button>
          </>
        )}
        {isActive && (
          <button className={`btn btn--${area}`} style={{ flex: 1 }} onClick={() => { onEndBlock(block.id); onClose(); }}>
            ⏹ Terminar Bloque
          </button>
        )}
        {isCompleted && (
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--color-success)', fontWeight: 600, padding: 'var(--space-sm) 0' }}>
            ✓ Bloque Completado
          </div>
        )}
      </div>
    </dialog>
  );
}
