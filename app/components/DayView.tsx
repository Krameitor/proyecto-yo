'use client';

import React, { useState, useEffect } from 'react';
import DaySummary from './DaySummary';
import CalendarGrid from './CalendarGrid';
import TimeBlockCard from './TimeBlockCard';
import CreateBlockDialog from './CreateBlockDialog';
import TaskAssigner from './TaskAssigner';
import TimeTracker from './TimeTracker';

interface DayViewProps {}

export default function DayView({}: DayViewProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialHour, setCreateInitialHour] = useState<number | undefined>();
  const [assignerState, setAssignerState] = useState<{ open: boolean; blockId: string; area: string; existingIds: string[] }>({
    open: false,
    blockId: '',
    area: '',
    existingIds: []
  });
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null);

  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  const fetchBlocks = async () => {
    try {
      const startOfDay = new Date(currentDate);
      startOfDay.setHours(0,0,0,0);
      const startIso = startOfDay.toISOString();
      
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
      const endIso = endOfDay.toISOString();
      
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
  }, [currentDate]);

  const goToPreviousDay = () => {
    setCurrentDate(prev => new Date(prev.getTime() - 24 * 60 * 60 * 1000));
  };

  const goToNextDay = () => {
    setCurrentDate(prev => new Date(prev.getTime() + 24 * 60 * 60 * 1000));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    }).format(date);
  };

  // Check if currentDate is today (for the red line indicator)
  const isToday = new Date().toDateString() === currentDate.toDateString();

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

  // Sort blocks by start time for the summary (CalendarGrid handles its own visual positioning)
  const sortedBlocks = [...blocks].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const handleEmptyClick = (hour: number) => {
    setCreateInitialHour(hour);
    setIsCreateOpen(true);
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      
      {/* Calendar Navigation Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: 'var(--space-md)',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-sm) var(--space-md)',
      }}>
        <button className="btn btn--icon" onClick={goToPreviousDay} aria-label="Día anterior">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 600, textTransform: 'capitalize', margin: 0 }}>
            {formatDate(currentDate)}
          </h2>
          {!isToday && (
            <button 
              onClick={goToToday}
              style={{ background: 'none', border: 'none', color: 'var(--color-mental)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '2px 8px', marginTop: '2px' }}
            >
              Volver a Hoy
            </button>
          )}
        </div>

        <button className="btn btn--icon" onClick={goToNextDay} aria-label="Día siguiente">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>

      <DaySummary blocks={sortedBlocks} />

      <div style={{ marginTop: 'var(--space-lg)' }}>
        <CalendarGrid 
          blocks={sortedBlocks}
          onStartBlock={handleStartBlock}
          onEndBlock={handleEndBlock}
          onDeleteBlock={handleDeleteBlock}
          onTaskToggle={handleTaskToggle}
          onAssignTask={openAssigner}
          onEmptyClick={handleEmptyClick}
          isToday={isToday}
        />
        
        {sortedBlocks.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-sm)' }}>🌅</div>
            <h3 style={{ marginBottom: 'var(--space-xs)' }}>Lienzo en blanco</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Toca en cualquier hora para crear tu primer bloque del día.</p>
          </div>
        )}

        <button 
          className="btn glass-card" 
          onClick={() => {
            setCreateInitialHour(undefined);
            setIsCreateOpen(true);
          }}
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
        initialHour={createInitialHour}
        targetDate={currentDate}
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
