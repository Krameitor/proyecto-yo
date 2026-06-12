'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { TimeBlock } from './TimeTracker';

interface TimelineProps {
  onEndBlock: (block: TimeBlock) => void;
}

export default function Timeline({ onEndBlock }: TimelineProps) {
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [gcalEvents, setGcalEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { data: session, status } = useSession();

  // Fetch today's blocks
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    Promise.all([
      fetch(`/api/time-blocks?start=${today.toISOString()}&end=${tomorrow.toISOString()}`).then((r) => (r.ok ? r.json() : [])),
      session ? fetch('/api/calendar').then((r) => (r.ok ? r.json() : { events: [] })) : Promise.resolve({ events: [] })
    ])
      .then(([blocksData, calendarData]) => {
        setBlocks(blocksData);
        if (calendarData.events) {
          setGcalEvents(calendarData.events);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const activeBlocks = blocks.filter((b) => b.status === 'ACTIVE');
  const completedBlocks = blocks.filter((b) => b.status === 'COMPLETED');

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
        <div className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          ⏳ Timeline del Día
        </h3>
        
        {status === 'loading' ? (
          <div className="skeleton" style={{ width: 100, height: 28, borderRadius: 14 }} />
        ) : session ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              Hola, {session.user?.name?.split(' ')[0]}
            </span>
            <button className="btn btn--ghost" onClick={() => signOut()} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <button className="btn btn--primary" onClick={() => signIn('google')} style={{ fontSize: '0.75rem', padding: '4px 8px' }}>
            + Google Calendar
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {activeBlocks.length === 0 && completedBlocks.length === 0 && gcalEvents.length === 0 && (
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: 'var(--space-md) 0' }}>
            No hay bloques ni eventos programados para hoy.
          </p>
        )}

        {/* Active Blocks */}
        {activeBlocks.map((block) => (
          <div
            key={block.id}
            style={{
              padding: 'var(--space-md)',
              background: 'linear-gradient(135deg, var(--bg-card), rgba(255,255,255,0.02))',
              borderLeft: '3px solid var(--color-mental)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '2px' }}>{block.title}</div>
              <div className="font-data" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {block.startTime} — {block.endTime} • {(block.totalMinutes / 60).toFixed(1)}h
              </div>
            </div>
            <button
              className="btn btn--primary"
              onClick={() => onEndBlock(block)}
              style={{ padding: '6px 12px', fontSize: '0.8125rem' }}
            >
              Cerrar
            </button>
          </div>
        ))}

        {/* Google Calendar Events */}
        {gcalEvents.map((event) => {
          const startTime = event.start?.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'Todo el día';
          const endTime = event.end?.dateTime ? new Date(event.end.dateTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
          
          return (
            <div
              key={event.id}
              style={{
                padding: 'var(--space-md)',
                background: 'rgba(66, 133, 244, 0.1)',
                borderLeft: '3px solid #4285F4',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: '2px', color: '#e8f0fe' }}>
                  📅 {event.summary}
                </div>
                <div className="font-data" style={{ fontSize: '0.75rem', color: '#aecbfa' }}>
                  {startTime} {endTime ? `— ${endTime}` : ''}
                </div>
              </div>
            </div>
          );
        })}

        {/* Completed Blocks */}
        {completedBlocks.length > 0 && <div style={{ borderTop: '1px solid var(--glass-border)', margin: 'var(--space-sm) 0' }} />}
        
        {completedBlocks.map((block) => (
          <div
            key={block.id}
            style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              opacity: 0.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                <span style={{ marginRight: '6px' }}>✅</span>
                {block.title}
              </div>
              <div className="font-data" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {block.startTime} — {block.endTime}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
