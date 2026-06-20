'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

import CreateBlockDialog from './CreateBlockDialog';
import TaskAssigner from './TaskAssigner';
import TimeTracker from './TimeTracker';
import BlockDetailsDialog from './BlockDetailsDialog';

const locales = {
  'es': es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface DayViewProps {}

export default function DayView({}: DayViewProps) {
  const [blocks, setBlocks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialogs state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createInitialHour, setCreateInitialHour] = useState<number | undefined>();
  const [createTargetDate, setCreateTargetDate] = useState<Date>(new Date());
  
  const [detailsState, setDetailsState] = useState<{ open: boolean; block: any }>({ open: false, block: null });
  
  const [assignerState, setAssignerState] = useState<{ open: boolean; blockId: string; area: string; existingIds: string[] }>({
    open: false,
    blockId: '',
    area: '',
    existingIds: []
  });
  
  const [completedBlockId, setCompletedBlockId] = useState<string | null>(null);

  // Default to week view
  const [view, setView] = useState(Views.WEEK);
  const [date, setDate] = useState(new Date());

  const fetchBlocks = async (targetDate: Date, targetView: string) => {
    try {
      // Calculate start and end bounds based on view
      const start = new Date(targetDate);
      const end = new Date(targetDate);

      if (targetView === Views.DAY) {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
      } else if (targetView === Views.WEEK) {
        const day = start.getDay();
        const diff = start.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        start.setDate(diff);
        start.setHours(0,0,0,0);
        end.setDate(start.getDate() + 6);
        end.setHours(23,59,59,999);
      } else if (targetView === Views.MONTH) {
        start.setDate(1);
        start.setHours(0,0,0,0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23,59,59,999);
      } else {
        start.setHours(0,0,0,0);
        end.setHours(23,59,59,999);
      }

      const res = await fetch(`/api/time-blocks?start=${start.toISOString()}&end=${end.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
        
        // Map to Calendar Events
        const mappedEvents = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          start: new Date(b.startTime),
          end: new Date(b.endTime),
          resource: b,
          isDraggable: b.status === 'SCHEDULED',
        }));
        setEvents(mappedEvents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocks(date, view);
  }, [date, view]);

  const handleNavigate = (newDate: Date) => setDate(newDate);
  const handleViewChange = (newView: any) => setView(newView);

  // Calendar Interactions
  const onEventDrop = useCallback(
    async ({ event, start, end }: any) => {
      if (event.resource.status !== 'SCHEDULED') return;
      
      const updatedEvent = { ...event, start, end };
      setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));

      try {
        await fetch(`/api/time-blocks/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString() })
        });
        fetchBlocks(date, view);
      } catch (e) {
        console.error(e);
      }
    },
    [date, view]
  );

  const onEventResize = useCallback(
    async ({ event, start, end }: any) => {
      if (event.resource.status !== 'SCHEDULED') return;

      const updatedEvent = { ...event, start, end };
      setEvents(prev => prev.map(e => e.id === event.id ? updatedEvent : e));

      try {
        await fetch(`/api/time-blocks/${event.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startTime: start.toISOString(), endTime: end.toISOString() })
        });
        fetchBlocks(date, view);
      } catch (e) {
        console.error(e);
      }
    },
    [date, view]
  );

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setCreateTargetDate(start);
    setCreateInitialHour(start.getHours());
    setIsCreateOpen(true);
  };

  const handleSelectEvent = (event: any) => {
    setDetailsState({ open: true, block: event.resource });
  };

  const eventPropGetter = (event: any) => {
    const area = event.resource.area.toLowerCase();
    const status = event.resource.status.toLowerCase();
    return {
      className: `area-${area} event-${status}`
    };
  };

  // Block Actions (passed to Details Dialog)
  const handleStartBlock = async (id: string) => {
    try {
      await fetch(`/api/time-blocks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE', startTime: new Date().toISOString() })
      });
      fetchBlocks(date, view);
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
      fetchBlocks(date, view);
      setCompletedBlockId(id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm('¿Eliminar este bloque?')) return;
    try {
      await fetch(`/api/time-blocks/${id}`, { method: 'DELETE' });
      fetchBlocks(date, view);
      setDetailsState({ open: false, block: null });
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
      // Refresh blocks and update details dialog state immediately
      const res = await fetch(`/api/time-blocks?start=${new Date(date).toISOString().split('T')[0]}&end=${new Date(date.getTime() + 7*24*60*60*1000).toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        const updatedBlock = data.find((b: any) => b.id === detailsState.block.id);
        if (updatedBlock) {
          setDetailsState(prev => ({ ...prev, block: updatedBlock }));
        }
      }
      fetchBlocks(date, view);
    } catch (err) {
      console.error(err);
    }
  };

  const openAssigner = (blockId: string, area: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    const existingIds = block.tasks.map((bt: any) => bt.taskId);
    setAssignerState({ open: true, blockId, area, existingIds });
    setDetailsState({ open: false, block: null }); // close details when opening assigner
  };

  return (
    <div style={{ height: 'calc(100vh - 80px)', paddingBottom: '100px', display: 'flex', flexDirection: 'column' }}>
      
      <div style={{ flex: 1, background: 'var(--bg-primary)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          date={date}
          view={view as any}
          onNavigate={handleNavigate}
          onView={handleViewChange}
          onEventDrop={onEventDrop}
          onEventResize={onEventResize}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          selectable
          resizable
          step={15}
          timeslots={4}
          eventPropGetter={eventPropGetter}
          culture="es"
          messages={{
            today: 'Hoy',
            previous: 'Atrás',
            next: 'Siguiente',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
          }}
          style={{ height: '100%' }}
        />
      </div>

      <CreateBlockDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => fetchBlocks(date, view)}
        initialHour={createInitialHour}
        targetDate={createTargetDate}
      />

      <BlockDetailsDialog
        open={detailsState.open}
        block={detailsState.block}
        onClose={() => setDetailsState({ open: false, block: null })}
        onStartBlock={handleStartBlock}
        onEndBlock={handleEndBlock}
        onDeleteBlock={handleDeleteBlock}
        onTaskToggle={handleTaskToggle}
        onAssignTask={openAssigner}
      />

      {assignerState.open && (
        <TaskAssigner
          open={assignerState.open}
          blockId={assignerState.blockId}
          area={assignerState.area}
          existingTaskIds={assignerState.existingIds}
          onClose={() => setAssignerState({ ...assignerState, open: false })}
          onAssigned={() => {
            fetchBlocks(date, view);
            // optionally reopen block details here
          }}
        />
      )}

      {completedBlockId && (
        <TimeTracker
          timeBlockId={completedBlockId}
          onClose={() => setCompletedBlockId(null)}
          onSaved={() => fetchBlocks(date, view)}
        />
      )}
    </div>
  );
}
