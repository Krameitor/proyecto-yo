'use client';

import { useCallback } from 'react';
import styles from './TimeSlider.module.css';

/* ── Types ── */
interface TimeSliderProps {
  taskName: string;
  percentage: number;
  minutes: number;
  isLocked: boolean;
  isPlanned: boolean;
  /** Accent color matching the task's portfolio */
  accentColor?: 'physical' | 'mental' | 'economic';
  onChange: (value: number) => void;
  onToggleLock: () => void;
}

/* ── Component ── */
export default function TimeSlider({
  taskName,
  percentage,
  minutes,
  isLocked,
  isPlanned,
  accentColor = 'mental',
  onChange,
  onToggleLock,
}: TimeSliderProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseInt(e.target.value, 10));
    },
    [onChange],
  );

  const badgeClass = isPlanned ? 'badge badge--planned' : 'badge badge--unplanned';
  const badgeLabel = isPlanned ? '📋 Planificada' : '⚡ Imprevista';

  return (
    <div className={styles.row} data-accent={accentColor}>
      {/* ── Header: name + badge ── */}
      <div className={styles.header}>
        <span className={styles.taskName}>{taskName}</span>
        <span className={badgeClass}>{badgeLabel}</span>
      </div>

      {/* ── Slider + values ── */}
      <div className={styles.sliderRow}>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={percentage}
          onChange={handleChange}
          disabled={isLocked}
          className={`slider-track ${styles.slider}`}
          aria-label={`Asignar porcentaje a ${taskName}`}
          style={
            {
              '--slider-accent': `var(--color-${accentColor})`,
              '--slider-glow': `var(--color-${accentColor}-glow)`,
            } as React.CSSProperties
          }
        />

        {/* ── Data readout ── */}
        <div className={styles.data}>
          <span className={`font-data ${styles.percentage}`}>{percentage}%</span>
          <span className={`font-data ${styles.minutes}`}>{minutes}m</span>
        </div>

        {/* ── Lock toggle ── */}
        <button
          type="button"
          className={`${styles.lockBtn} ${isLocked ? styles.locked : ''}`}
          onClick={onToggleLock}
          aria-label={isLocked ? `Desbloquear ${taskName}` : `Bloquear ${taskName}`}
          title={isLocked ? 'Desbloqueado' : 'Bloqueado'}
        >
          {isLocked ? '🔒' : '🔓'}
        </button>
      </div>
    </div>
  );
}
