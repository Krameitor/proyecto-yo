'use client';

import { useState, useEffect } from 'react';

interface TimeAllocationSummary {
  area: string;
  totalMinutes: number;
}

const TOTAL_WEEKLY_HOURS = 168;
const SLEEP_HOURS = 56; // 8h × 7 days default

const AREA_COLORS: Record<string, string> = {
  SLEEP: 'hsl(230, 30%, 35%)',
  PHYSICAL: 'hsl(16, 85%, 58%)',
  MENTAL: 'hsl(262, 70%, 62%)',
  ECONOMIC: 'hsl(155, 70%, 48%)',
  UNASSIGNED: 'hsl(0, 0%, 18%)',
};

const AREA_LABELS: Record<string, string> = {
  SLEEP: '😴 Sueño',
  PHYSICAL: '🏋️ Física',
  MENTAL: '🧠 Mental',
  ECONOMIC: '💰 Económica',
  UNASSIGNED: '⬜ Sin asignar',
};

export default function WeekBudget() {
  const [allocations, setAllocations] = useState<TimeAllocationSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadWeekData();
  }, []);

  async function loadWeekData() {
    try {
      // Get current week's time blocks
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const res = await fetch(
        `/api/time-blocks?start=${startOfWeek.toISOString()}&end=${endOfWeek.toISOString()}`
      );
      if (!res.ok) throw new Error('Failed to load');
      const blocks = await res.json();

      // Aggregate by area
      const areaMinutes: Record<string, number> = {
        PHYSICAL: 0,
        MENTAL: 0,
        ECONOMIC: 0,
      };

      for (const block of blocks) {
        if (block.allocations) {
          for (const alloc of block.allocations) {
            const allocArea = alloc.task?.area || alloc.task?.portfolio;
            if (allocArea && areaMinutes[allocArea] !== undefined) {
              areaMinutes[allocArea] += alloc.minutes || 0;
            }
          }
        }
      }

      setAllocations(
        Object.entries(areaMinutes).map(([area, totalMinutes]) => ({
          area,
          totalMinutes,
        }))
      );
    } catch {
      // Use empty defaults
      setAllocations([
        { area: 'PHYSICAL', totalMinutes: 0 },
        { area: 'MENTAL', totalMinutes: 0 },
        { area: 'ECONOMIC', totalMinutes: 0 },
      ]);
    }
    setIsLoaded(true);
  }

  // Calculate segments for donut
  const sleepHours = SLEEP_HOURS;
  const physicalHours = (allocations.find((a) => a.area === 'PHYSICAL')?.totalMinutes || 0) / 60;
  const mentalHours = (allocations.find((a) => a.area === 'MENTAL')?.totalMinutes || 0) / 60;
  const economicHours = (allocations.find((a) => a.area === 'ECONOMIC')?.totalMinutes || 0) / 60;
  const assignedHours = sleepHours + physicalHours + mentalHours + economicHours;
  const unassignedHours = Math.max(0, TOTAL_WEEKLY_HOURS - assignedHours);

  const segments = [
    { key: 'SLEEP', hours: sleepHours, color: AREA_COLORS.SLEEP },
    { key: 'PHYSICAL', hours: physicalHours, color: AREA_COLORS.PHYSICAL },
    { key: 'MENTAL', hours: mentalHours, color: AREA_COLORS.MENTAL },
    { key: 'ECONOMIC', hours: economicHours, color: AREA_COLORS.ECONOMIC },
    { key: 'UNASSIGNED', hours: unassignedHours, color: AREA_COLORS.UNASSIGNED },
  ];

  // Build conic-gradient
  let cumulative = 0;
  const gradientStops = segments
    .map((seg) => {
      const percentage = (seg.hours / TOTAL_WEEKLY_HOURS) * 100;
      const start = cumulative;
      cumulative += percentage;
      return `${seg.color} ${start}% ${cumulative}%`;
    })
    .join(', ');

  const conicGradient = `conic-gradient(from 0deg, ${gradientStops})`;

  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
        marginBottom: 'var(--space-lg)',
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📊 Presupuesto Semanal
        </h2>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-lg)',
        }}
      >
        {/* Donut Chart */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: isLoaded ? conicGradient : 'var(--bg-elevated)',
              position: 'relative',
              transition: 'all 0.5s ease-out',
            }}
            role="img"
            aria-label={`Presupuesto semanal: ${assignedHours.toFixed(0)}h asignadas de ${TOTAL_WEEKLY_HOURS}h`}
          >
            {/* Inner circle (donut hole) */}
            <div
              style={{
                position: 'absolute',
                inset: '28%',
                borderRadius: '50%',
                background: 'var(--bg-primary)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="font-data"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  lineHeight: 1,
                }}
              >
                {Math.round(unassignedHours)}h
              </span>
              <span
                style={{
                  fontSize: '0.625rem',
                  color: 'var(--text-tertiary)',
                  marginTop: '2px',
                }}
              >
                libres
              </span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {segments.filter(s => s.hours > 0 || s.key !== 'UNASSIGNED' || unassignedHours > 0).map((seg) => (
            <div
              key={seg.key}
              onMouseEnter={() => setHoveredSegment(seg.key)}
              onMouseLeave={() => setHoveredSegment(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.75rem',
                padding: '3px 6px',
                borderRadius: 'var(--radius-sm)',
                background: hoveredSegment === seg.key ? 'rgba(255,255,255,0.04)' : 'transparent',
                transition: 'background var(--transition-fast)',
                cursor: 'default',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '3px',
                  background: seg.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-secondary)', flex: 1 }}>
                {AREA_LABELS[seg.key]}
              </span>
              <span className="font-data" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                {seg.hours.toFixed(seg.hours % 1 === 0 ? 0 : 1)}h
              </span>
              <span className="font-data" style={{ color: 'var(--text-tertiary)', fontSize: '0.625rem' }}>
                {((seg.hours / TOTAL_WEEKLY_HOURS) * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
