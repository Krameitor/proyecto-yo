'use client';

import React, { useRef, useEffect, useState } from 'react';

interface TaskAssignerProps {
  open: boolean;
  blockId: string;
  area: string;
  existingTaskIds: string[];
  onClose: () => void;
  onAssigned: () => void;
}

export default function TaskAssigner({ open, blockId, area, existingTaskIds, onClose, onAssigned }: TaskAssignerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [newTaskName, setNewTaskName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch(`/api/tasks?area=${area}&unassigned=true`)
        .then(res => res.json())
        .then(data => setTasks(data))
        .catch(console.error);
    }
  }, [open, area]);

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
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) {
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

  const handleAssign = async () => {
    if (selectedIds.size === 0) return;
    setIsSaving(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map(taskId =>
          fetch(`/api/time-blocks/${blockId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId })
          })
        )
      );
      setSelectedIds(new Set());
      onAssigned();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleQuickCreate = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskName.trim()) {
      e.preventDefault();
      setIsSaving(true);
      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: newTaskName.trim(), area })
        });
        if (res.ok) {
          const newTask = await res.json();
          await fetch(`/api/time-blocks/${blockId}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskId: newTask.id })
          });
          setNewTaskName('');
          onAssigned();
          onClose();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <dialog ref={dialogRef} closedby="any" style={{ padding: 0 }}>
      <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Asignar tareas</h3>
          <button className="btn btn--icon" onClick={onClose} type="button" style={{ fontSize: '1rem', background: 'transparent', border: 'none' }}>✕</button>
        </div>

        <input
          type="text"
          className="input"
          placeholder="Buscar tareas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0' }}>
          {filteredTasks.map(task => {
            const isAssigned = existingTaskIds.includes(task.id);
            const isSelected = selectedIds.has(task.id);
            return (
              <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', cursor: isAssigned ? 'default' : 'pointer', opacity: isAssigned ? 0.5 : 1 }}>
                <input
                  type="checkbox"
                  checked={isAssigned || isSelected}
                  disabled={isAssigned}
                  onChange={() => toggleSelection(task.id)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '0.875rem' }}>{task.title}</span>
              </label>
            );
          })}
          {filteredTasks.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.875rem', padding: 'var(--space-lg) 0' }}>
              No hay tareas disponibles.
            </p>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--glass-border)', paddingTop: 'var(--space-md)' }}>
          <input
            type="text"
            className="input"
            placeholder="+ Crear tarea rápida (Enter)"
            value={newTaskName}
            onChange={e => setNewTaskName(e.target.value)}
            onKeyDown={handleQuickCreate}
            disabled={isSaving}
          />
        </div>

        {selectedIds.size > 0 && (
          <button className="btn btn--primary" onClick={handleAssign} disabled={isSaving}>
            Añadir {selectedIds.size} tarea(s)
          </button>
        )}
      </div>
    </dialog>
  );
}
