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
  onAssignTask: (blockId: string, area: string) => void;
}

export default function BlockDetailsDialog({
  open,
  block,
  onClose,
  onStartBlock,
  onEndBlock,
  onDeleteBlock,
  onTaskToggle,
  onAssignTask
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

  if (!block) return null;

  const isScheduled = block.status === 'SCHEDULED';
  const isActive = block.status === 'ACTIVE';
  const isCompleted = block.status === 'COMPLETED';

  return (
    <dialog ref={dialogRef} className="glass-card" style={{ padding: 'var(--space-lg)', maxWidth: '400px', width: '90vw' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-md)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: `var(--color-${block.area.toLowerCase()})` }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
              {block.area}
            </span>
          </div>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{block.title}</h3>
          <p className="font-data" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            {new Date(block.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(block.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </p>
        </div>
        <button className="btn btn--icon" onClick={onClose}>✕</button>
      </div>

      <div style={{ marginBottom: 'var(--space-lg)' }}>
        <h4 style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Tareas</h4>
        {block.tasks && block.tasks.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {block.tasks.map((bt: any) => (
              <label key={bt.taskId} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={bt.task.status === 'COMPLETED'}
                  onChange={(e) => onTaskToggle(bt.taskId, e.target.checked)}
                />
                <span style={{ fontSize: '0.875rem', textDecoration: bt.task.status === 'COMPLETED' ? 'line-through' : 'none', color: bt.task.status === 'COMPLETED' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                  {bt.task.title}
                </span>
              </label>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>No hay tareas asignadas a este bloque.</p>
        )}
        
        {!isCompleted && (
          <button 
            onClick={() => onAssignTask(block.id, block.area)}
            style={{ background: 'none', border: 'none', color: `var(--color-${block.area.toLowerCase()})`, fontSize: '0.875rem', fontWeight: 600, marginTop: '12px', cursor: 'pointer', padding: 0 }}
          >
            + Asignar tarea
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        {isScheduled && (
          <>
            <button className={`btn btn--${block.area.toLowerCase()}`} style={{ flex: 1 }} onClick={() => { onStartBlock(block.id); onClose(); }}>
              ▶ Iniciar
            </button>
            <button className="btn" onClick={() => { onDeleteBlock(block.id); onClose(); }}>
              🗑️
            </button>
          </>
        )}
        {isActive && (
          <button className={`btn btn--${block.area.toLowerCase()}`} style={{ flex: 1 }} onClick={() => { onEndBlock(block.id); onClose(); }}>
            ⏹ Terminar Bloque
          </button>
        )}
        {isCompleted && (
          <div style={{ flex: 1, textAlign: 'center', color: 'var(--color-success)', fontWeight: 600, padding: 'var(--space-sm) 0' }}>
            ✓ Completado
          </div>
        )}
      </div>
    </dialog>
  );
}
