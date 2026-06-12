'use client';

import { useCallback } from 'react';
import styles from './MoodCheckin.module.css';

/* ── Types ── */
export interface MoodCheckinData {
  mood: number | null;        // 1-5
  energy: number;             // 1-10
  satisfaction: number | null; // 1-3
}

interface MoodCheckinProps {
  mood: number | null;
  energy: number;
  satisfaction: number | null;
  onMoodChange: (value: number) => void;
  onEnergyChange: (value: number) => void;
  onSatisfactionChange: (value: number) => void;
}

/* ── Constants ── */
const MOOD_OPTIONS = [
  { value: 1, emoji: '💀', label: 'Terrible' },
  { value: 2, emoji: '😫', label: 'Mal' },
  { value: 3, emoji: '😐', label: 'Normal' },
  { value: 4, emoji: '😊', label: 'Bien' },
  { value: 5, emoji: '🔥', label: 'Increíble' },
] as const;

const SATISFACTION_OPTIONS = [
  { value: 1, emoji: '👎', label: 'No satisfecho' },
  { value: 2, emoji: '😐', label: 'Neutral' },
  { value: 3, emoji: '👍', label: 'Satisfecho' },
] as const;

/* ── Component ── */
export default function MoodCheckin({
  mood,
  energy,
  satisfaction,
  onMoodChange,
  onEnergyChange,
  onSatisfactionChange,
}: MoodCheckinProps) {
  const handleEnergyChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onEnergyChange(parseInt(e.target.value, 10));
    },
    [onEnergyChange],
  );

  return (
    <section className={styles.container} aria-label="Check-in de ánimo">
      {/* ── Mood Row ── */}
      <div className={styles.row}>
        <span className={styles.label}>¿Cómo te sientes?</span>
        <div className="mood-picker" role="radiogroup" aria-label="Estado de ánimo">
          {MOOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={mood === opt.value}
              aria-label={opt.label}
              className="mood-picker__option"
              data-selected={mood === opt.value ? 'true' : undefined}
              onClick={() => onMoodChange(opt.value)}
            >
              {opt.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* ── Energy Row ── */}
      <div className={styles.row}>
        <span className={styles.label}>¿Nivel de energía?</span>
        <div className={styles.energyRow}>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={energy}
            onChange={handleEnergyChange}
            className={`slider-track ${styles.energySlider}`}
            aria-label="Nivel de energía"
          />
          <span className={`font-data ${styles.energyValue}`} data-level={energy}>
            {energy}
          </span>
        </div>
      </div>

      {/* ── Satisfaction Row ── */}
      <div className={styles.row}>
        <span className={styles.label}>¿Satisfecho con tu inversión?</span>
        <div className="mood-picker" role="radiogroup" aria-label="Satisfacción">
          {SATISFACTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={satisfaction === opt.value}
              aria-label={opt.label}
              className="mood-picker__option"
              data-selected={satisfaction === opt.value ? 'true' : undefined}
              onClick={() => onSatisfactionChange(opt.value)}
            >
              {opt.emoji}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
