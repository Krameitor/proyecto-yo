'use client';

import React, { useState, useEffect } from 'react';
import DaySummary from './DaySummary';
import TimeBlockCard from './TimeBlockCard';
import CreateBlockDialog from './CreateBlockDialog';
import TaskAssigner from './TaskAssigner';
import TimeTracker from './TimeTracker';

interface DayViewProps {}

export default function DayView({}: DayViewProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [assignerState, setAssignerState] = useState<{ open: boolean; blockId: string; area: string; existingIds: string[] }>({
    open: false,
    blockId: '',
    area: '',
    existingIds: []
  });
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null);

  const fetchBlocks = async () => {
    try {
      const today = new Date();
      today.setHours(0,0,0,0);
      const startIso = today.toISOString();
      const endIso = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString();
      
      const res = await fetch(`/api/time-blocks?start=${startIso}&end=${endIso}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  const handleStartBlock = async (id: string) => {
    try {
      await fetch(`/api/time-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', startTime: new Date().toISOString() })
      });
      fetchBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndBlock = async (id: string) => {
    try {
      await fetch(`/api/time-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED', endTime: new Date().toISOString() })
      });
      fetchBlocks();
      setCompletedBlockId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('¿Eliminar este bloque?')) return;
    try {
      await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' });
      fetchBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: completed ? 'COMPLETED' : 'ACTIVE' })
      });
      fetchBlocks();
    } catch (err) {
      console.error(err);
    }
  };

  const openAssigner = (blockId: string, area: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const existingIds = block.tasks.map((bt: any) => bt.taskId);
    setAssignerState({ open: true, blockId, area, existingIds });
  };

  if (isLoading) {
    return <div style={{ padding: 'var(--space-xl) 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>Cargando tu día...</div>;
  }

  // Sort blocks by start time
  const sortedBlocks = [...blocks].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div style={{ paddingBottom: '100px' }}>
      <DaySummary blocks={sortedBlocks} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
        {sortedBlocks.map(block => (
          <TimeBlockCard
            key={block.id}
            block={block}
            onStartBlock={handleStartBlock}
            onEndBlock={handleEndBlock}
            onDeleteBlock={handleDeleteBlock}
            onTaskToggle={handleTaskToggle}
            onAssignTask={openAssigner}
          />
        ))}

        {sortedBlocks.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🌅</div>
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>Lienzo en blanco</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Aún no has planificado ningún bloque para hoy.</p>
          </div>
        )}

        <button 
          className="btn glass-card" 
          onClick={() => setIsCreateOpen(true)}
          style={{ width: '100%', marginTop: 'var(--space-md)', borderStyle: 'dashed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-primary)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          Nuevo Bloque
        </button>
      </div>

      <CreateBlockDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={fetchBlocks}
      />

      {assignerState.open && (
        <TaskAssigner
          open={assignerState.open}
          blockId={assignerState.blockId}
          area={assignerState.area}
          existingTaskIds={assignerState.existingIds}
          onClose={() => setAssignerState({ ...assignerState, open: false })}
          onAssigned={fetchBlocks}
        />
      )}

      {/* The TimeTracker component handles the review/allocations after a block is completed */}
      {completedBlockId && (
        <TimeTracker
          timeBlockId={completedBlockId}
          onClose={() => setCompletedBlockId(null)}
          onSaved={fetchBlocks}
        />
      )}
    </div>
  );
}
