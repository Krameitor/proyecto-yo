'use client';

import React, { useRef, useEffect, useState, type FormEvent } from 'react';

interface CreateBlockDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (block: unknown) => void;
  initialHour?: number;
}

const AREAS = [
  { id: 'PHYSICAL', label: 'Física', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
  ), colorClass: 'btn--physical' },
  { id: 'MENTAL', label: 'Mental', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
  ), colorClass: 'btn--mental' },
  { id: 'ECONOMIC', label: 'Económica', icon: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
  ), colorClass: 'btn--economic' }
];

export default function CreateBlockDialog({ open, onClose, onCreated, initialHour }: CreateBlockDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [area, setArea] = useState<string>('MENTAL');
  const [title, setTitle] = useState('Bloque Mental');
  
  const toTimeString = (d: Date) => d.toTimeString().slice(0, 5);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (open) {
      const now = new Date();
      let startH = now.getHours() + 1;
      let startM = 0;
      
      if (initialHour !== undefined) {
        startH = initialHour;
      }
      
      const startD = new Date(now);
      startD.setHours(startH, startM, 0, 0);
      
      const endD = new Date(startD);
      endD.setHours(startD.getHours() + 2);
      
      setStartTime(toTimeString(startD));
      setEndTime(toTimeString(endD));
    }
  }, [open, initialHour]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const clickedInsideDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!clickedInsideDialog) {
        onClose();
      }
    };

    const handleCancel = () => onClose();

    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('click', handleClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  const handleAreaChange = (newArea: string) => {
    setArea(newArea);
    const label = AREAS.find(a => a.id === newArea)?.label || '';
    if (title.startsWith('Bloque')) {
      setTitle(`Bloque ${label}`);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    // Convert time strings to today's date objects
    const startObj = new Date();
    const [startH, startM] = startTime.split(':').map(Number);
    startObj.setHours(startH, startM, 0, 0);

    const endObj = new Date();
    const [endH, endM] = endTime.split(':').map(Number);
    endObj.setHours(endH, endM, 0, 0);

    try {
      const res = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          area,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
        }),
      });

      if (res.ok) {
        const block = await res.json();
        onCreated(block);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create block:', err);
    }
  };

  const selectedAreaObj = AREAS.find(a => a.id === area);

  return (
    <dialog ref={dialogRef} closedby="any" style={{ padding: 0 }}>
      <div style={{ padding: 'var(--space-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ margin: 0 }}>Nuevo Bloque</h3>
          <button className="btn btn--icon" onClick={onClose} type="button" style={{ fontSize: '1rem', background: 'transparent', border: 'none' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* Area selection */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
                Área de Inversión
              </label>
              <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                {AREAS.map(a => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => handleAreaChange(a.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 'var(--space-sm)',
                      background: area === a.id ? `var(--color-${a.id.toLowerCase()}-soft)` : 'var(--bg-elevated)',
                      border: `1px solid ${area === a.id ? `var(--color-${a.id.toLowerCase()})` : 'var(--glass-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: area === a.id ? `var(--color-${a.id.toLowerCase()})` : 'var(--text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {a.icon}
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label htmlFor="block-title" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Título
              </label>
              <input
                id="block-title"
                type="text"
                className="input"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Times */}
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="start-time" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Inicio
                </label>
                <input
                  id="start-time"
                  type="time"
                  className="input font-data"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="end-time" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Fin
                </label>
                <input
                  id="end-time"
                  type="time"
                  className="input font-data"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className={`btn btn--lg ${selectedAreaObj?.colorClass}`} style={{ width: '100%', marginTop: 'var(--space-sm)' }}>
              Crear Bloque
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
