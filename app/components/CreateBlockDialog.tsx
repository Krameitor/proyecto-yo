'use client';

import React, { useRef, useEffect, useState, type FormEvent } from 'react';

interface Task {
  id: string;
  title: string;
  area: string;
}

interface CreateBlockDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (block: unknown) => void;
  initialHour?: number;
  targetDate?: Date;
}

const AREAS = [
  { id: 'PHYSICAL', label: 'Física', colorClass: 'btn--physical' },
  { id: 'MENTAL', label: 'Mental', colorClass: 'btn--mental' },
  { id: 'ECONOMIC', label: 'Económica', colorClass: 'btn--economic' }
];

export default function CreateBlockDialog({ open, onClose, onCreated, initialHour, targetDate = new Date() }: CreateBlockDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isCreatingNewTask, setIsCreatingNewTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState('MENTAL');
  const [notes, setNotes] = useState('');
  
  const toTimeString = (d: Date) => d.toTimeString().slice(0, 5);
  
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Fetch tasks
  useEffect(() => {
    if (open) {
      fetch('/api/tasks')
        .then(res => res.json())
        .then(data => {
          setTasks(data);
          if (data.length > 0) setSelectedTaskId(data[0].id);
        })
        .catch(console.error);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      const baseDate = targetDate || new Date();
      let startH = baseDate.getHours() + 1;
      let startM = 0;
      
      if (initialHour !== undefined) {
        startH = initialHour;
      }
      
      const startD = new Date(baseDate);
      startD.setHours(startH, startM, 0, 0);
      
      const endD = new Date(startD);
      endD.setHours(startD.getHours() + 2);
      
      setStartTime(toTimeString(startD));
      setEndTime(toTimeString(endD));
      setNotes('');
      setIsCreatingNewTask(false);
      setNewTaskTitle('');
    }
  }, [open, initialHour, targetDate]);

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    let finalTaskId = selectedTaskId;

    if (isCreatingNewTask) {
      if (!newTaskTitle.trim()) return;
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTaskTitle, area: newTaskArea }),
        });
        if (res.ok) {
          const created = await res.json();
          finalTaskId = created.id;
        } else {
          return; // handle error
        }
      } catch (err) {
        console.error('Failed to create new task:', err);
        return;
      }
    }

    if (!finalTaskId) return;

    // Convert time strings to the target date objects
    const startObj = new Date(targetDate || new Date());
    const [startH, startM] = startTime.split(':').map(Number);
    startObj.setHours(startH, startM, 0, 0);

    const endObj = new Date(targetDate || new Date());
    const [endH, endM] = endTime.split(':').map(Number);
    endObj.setHours(endH, endM, 0, 0);

    // If end is before start, assume it crosses midnight and is the next day
    if (endObj < startObj) {
      endObj.setDate(endObj.getDate() + 1);
    }

    try {
      const res = await fetch('/api/time-blocks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: finalTaskId,
          startTime: startObj.toISOString(),
          endTime: endObj.toISOString(),
          notes: notes.trim() ? notes : undefined
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

  return (
    <dialog ref={dialogRef} closedby="any" style={{ padding: 0 }}>
      <div style={{ padding: 'var(--space-lg)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ margin: 0 }}>Agendar Tarea</h3>
          <button className="btn btn--icon" onClick={onClose} type="button" style={{ fontSize: '1rem', background: 'transparent', border: 'none' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            
            {/* Task selection / creation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Tarea a realizar
                </label>
                <button
                  type="button"
                  onClick={() => setIsCreatingNewTask(!isCreatingNewTask)}
                  style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {isCreatingNewTask ? 'Seleccionar existente' : '+ Crear nueva'}
                </button>
              </div>

              {isCreatingNewTask ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Título de la nueva tarea"
                    value={newTaskTitle}
                    onChange={e => setNewTaskTitle(e.target.value)}
                    required
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    {AREAS.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setNewTaskArea(a.id)}
                        style={{
                          flex: 1,
                          padding: 'var(--space-sm)',
                          background: newTaskArea === a.id ? `var(--color-${a.id.toLowerCase()}-soft)` : 'var(--bg-elevated)',
                          border: `1px solid ${newTaskArea === a.id ? `var(--color-${a.id.toLowerCase()})` : 'var(--glass-border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: newTaskArea === a.id ? `var(--color-${a.id.toLowerCase()})` : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <select
                  className="input"
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  required
                >
                  <option value="" disabled>Selecciona una tarea</option>
                  {tasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} ({AREAS.find(a => a.id === t.area)?.label})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Time */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <div style={{ flex: 1 }}>
                <label htmlFor="block-start" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Inicio
                </label>
                <input
                  id="block-start"
                  type="time"
                  className="input"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="block-end" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                  Fin
                </label>
                <input
                  id="block-end"
                  type="time"
                  className="input"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="block-notes" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
                Notas del Bloque (Opcional)
              </label>
              <textarea
                id="block-notes"
                className="input"
                style={{ resize: 'vertical', minHeight: '60px' }}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ej: Solo leer el capítulo 1 y 2"
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn--primary`}
              style={{ marginTop: 'var(--space-md)' }}
            >
              Agendar Tarea
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}
