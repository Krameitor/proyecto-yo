'use client';

import React from 'react';

interface DaySummaryProps {
  blocks: Array<{
    id: string;
    status: string;
    task?: {
      area: string;
    };
    totalMinutes: number;
  }>;
}

export default function DaySummary({ blocks }: DaySummaryProps) {
  const totalBlocks = blocks.length;
  const completedBlocks = blocks.filter(b => b.status === 'COMPLETED').length;
  const totalMinutes = blocks.reduce((acc, b) => acc + b.totalMinutes, 0);
  const totalHours = (totalMinutes / 60).toFixed(1).replace('.0', '');
  const completionPercentage = totalBlocks === 0 ? 0 : Math.round((completedBlocks / totalBlocks) * 100);

  const minutesByArea = blocks.reduce((acc, b) => {
    const area = b.task?.area;
    if (area) {
      acc[area] = (acc[area] || 0) + b.totalMinutes;
    }
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="day-header glass-card" style={{ marginBottom: 'var(--space-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--space-sm)' }}>
        <div>
          <h2 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Resumen del día</h2>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '2px' }}>
            <span className="font-data">{completedBlocks}</span>
            <span style={{ color: 'var(--text-tertiary)', fontSize: '1rem' }}>/{totalBlocks}</span>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '8px', fontWeight: 500 }}>
              bloques ({totalHours}h)
            </span>
          </div>
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: completionPercentage === 100 && totalBlocks > 0 ? 'var(--color-success)' : 'var(--text-primary)' }}>
          {completionPercentage}%
        </div>
      </div>

      <div className="progress-segmented" style={{ height: '6px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex', marginBottom: 'var(--space-md)' }}>
        <div className="progress-segmented__fill" style={{ width: `${completionPercentage}%`, background: 'var(--text-primary)', transition: 'width 0.3s ease' }} />
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
        {['PHYSICAL', 'MENTAL', 'ECONOMIC'].map(area => {
          const mins = minutesByArea[area] || 0;
          if (mins === 0) return null;
          const colorVar = `var(--color-${area.toLowerCase()})`;
          return (
            <div key={area} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorVar }} />
              <span className="font-data">{(mins / 60).toFixed(1).replace('.0', '')}h</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
