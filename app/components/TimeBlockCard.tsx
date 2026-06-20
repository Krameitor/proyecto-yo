'use client';

import React, { useState, useEffect } from 'react';

interface TimeBlockCardProps {
  block: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    totalMinutes: number;
    status: string; // SCHEDULED | ACTIVE | COMPLETED
    area: string; // PHYSICAL | MENTAL | ECONOMIC
    tasks: Array<{
      id: string;
      taskId: string;
      task: { id: string; title: string; area: string; status: string };
    }>;
  };
  onStartBlock: (blockId: string) => void;
  onEndBlock: (blockId: string) => void;
  onDeleteBlock: (blockId: string) => void;
  onTaskToggle: (taskId: string, completed: boolean) => void;
  onAssignTask: (blockId: string, area: string) => void;
}

const formatTime = (isoString: string) => {
  const d = new Date(isoString);
  return d.toTimeString().slice(0, 5);
};

export default function TimeBlockCard({
  block,
  onStartBlock,
  onEndBlock,
  onDeleteBlock,
  onTaskToggle,
  onAssignTask
}: TimeBlockCardProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (block.status === 'ACTIVE') {
      const start = new Date(block.startTime).getTime();
      const interval = setInterval(() => {
        setElapsed(Math.floor((Date.now() - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [block.status, block.startTime]);

  const formatElapsed = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    return `${m}m ${s}s`;
  };

  const getAreaIcon = (area: string) => {
    switch(area) {
      case 'PHYSICAL': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
      case 'MENTAL': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
      case 'ECONOMIC': return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>;
      default: return null;
    }
  };

  const getAreaName = (area: string) => {
    switch(area) {
      case 'PHYSICAL': return 'Física';
      case 'MENTAL': return 'Mental';
      case 'ECONOMIC': return 'Económica';
      default: return area;
    }
  };

  const statusClass = `time-block-card--${block.status.toLowerCase()}`;
  const areaColorVar = `var(--color-${block.area.toLowerCase()})`;
  const areaBgVar = `var(--color-${block.area.toLowerCase()}-soft)`;

  return (
    <div className={`glass-card time-block-card ${statusClass}`} style={{ 
      borderColor: block.status === 'ACTIVE' ? areaColorVar : undefined,
      borderLeft: `4px solid ${areaColorVar}`,
      opacity: block.status === 'COMPLETED' ? 0.6 : 1,
      position: 'relative',
      padding: 'var(--space-md)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-sm)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 600, color: areaColorVar, background: areaBgVar, padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
              {getAreaIcon(block.area)}
              {getAreaName(block.area)}
            </span>
            <span className="font-data" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {formatTime(block.startTime)} - {formatTime(block.endTime)} ({Math.round(block.totalMinutes / 60 * 10) / 10}h)
            </span>
          </div>
          <h3 style={{ fontSize: '1.125rem', margin: 0, color: 'var(--text-primary)' }}>{block.title}</h3>
        </div>
        
        {block.status === 'SCHEDULED' && (
          <button className="btn btn--icon" onClick={() => onDeleteBlock(block.id)} style={{ padding: '4px', color: 'var(--text-secondary)', background: 'transparent', border: 'none' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        )}
      </div>

      {/* Timer for Active block */}
      {block.status === 'ACTIVE' && (
        <div className="font-data" style={{ fontSize: '1.5rem', fontWeight: 700, color: areaColorVar, marginBottom: 'var(--space-sm)' }}>
          {formatElapsed(elapsed)}
        </div>
      )}

      {/* Tasks List */}
      <div className="time-block-card__tasks" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 'var(--space-md)' }}>
        {block.tasks.map(bt => {
          const t = bt.task;
          const isCompleted = t.status === 'COMPLETED';
          return (
            <label key={t.id} className={`task-chip ${isCompleted ? 'task-chip--completed' : ''}`} style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', 
              background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', opacity: isCompleted ? 0.6 : 1,
              border: '1px solid var(--glass-border)'
            }}>
              <input 
                type="checkbox" 
                checked={isCompleted} 
                onChange={(e) => onTaskToggle(t.id, e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: areaColorVar }}
              />
              <span style={{ fontSize: '0.875rem', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                {t.title}
              </span>
            </label>
          );
        })}
        
        {block.status !== 'COMPLETED' && (
          <button 
            type="button"
            onClick={() => onAssignTask(block.id, block.area)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', 
              background: 'transparent', border: '1px dashed var(--glass-border)', borderRadius: 'var(--radius-sm)',
              color: 'var(--text-secondary)', fontSize: '0.8125rem', cursor: 'pointer', width: '100%', justifyContent: 'center'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Añadir tarea
          </button>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
        {block.status === 'SCHEDULED' && (
          <button className="btn" onClick={() => onStartBlock(block.id)} style={{ width: '100%', background: areaColorVar, color: '#fff', border: 'none' }}>
            Iniciar Bloque
          </button>
        )}
        {block.status === 'ACTIVE' && (
          <button className="btn" onClick={() => onEndBlock(block.id)} style={{ width: '100%', background: 'transparent', border: `1px solid ${areaColorVar}`, color: areaColorVar }}>
            Terminar Bloque
          </button>
        )}
        {block.status === 'COMPLETED' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-success)', fontSize: '0.875rem', fontWeight: 600 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Completado
          </div>
        )}
      </div>
    </div>
  );
}
