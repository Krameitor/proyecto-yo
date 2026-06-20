'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import TimeSlider from './TimeSlider';
import MoodCheckin from './MoodCheckin';
import styles from './TimeTracker.module.css';

/* ═══════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════ */
export interface TimeBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  totalMinutes: number;
  status: string;
}

export interface Task {
  id: string;
  title: string;
  area: 'PHYSICAL' | 'MENTAL' | 'ECONOMIC';
  portfolio?: string;
}

export interface SliderState {
  taskId: string;
  taskName: string;
  percentage: number;
  isLocked: boolean;
  isPlanned: boolean;
  portfolio: 'PHYSICAL' | 'MENTAL' | 'ECONOMIC';
}

export interface TimeAllocationPayload {
  taskId: string;
  taskName: string;
  percentage: number;
  minutes: number;
  type: 'PLANNED' | 'UNPLANNED';
}

interface TimeTrackerProps {
  timeBlockId: string;
  onClose: () => void;
  onSaved: () => void;
}

/* ═══════════════════════════════════════════════
   Redistribution algorithm
   ═══════════════════════════════════════════════ */
function redistribute(
  sliders: SliderState[],
  changedIndex: number,
  newValue: number,
): SliderState[] {
  const next = sliders.map((s) => ({ ...s }));
  next[changedIndex].percentage = Math.min(100, Math.max(0, newValue));

  const lockedTotal = next.reduce(
    (sum, s, i) => (s.isLocked && i !== changedIndex ? sum + s.percentage : sum),
    0,
  );
  const remaining = 100 - next[changedIndex].percentage - lockedTotal;

  const unlocked = next
    .map((s, i) => ({ s, i }))
    .filter(({ s, i }) => !s.isLocked && i !== changedIndex);

  if (unlocked.length === 0) return next;

  const unlockedTotal = unlocked.reduce((sum, { s }) => sum + s.percentage, 0);

  if (remaining <= 0) {
    // Nothing left — zero all unlocked
    for (const { i } of unlocked) next[i].percentage = 0;
    // Clamp changed value so total = 100
    next[changedIndex].percentage = 100 - lockedTotal;
  } else if (unlockedTotal === 0) {
    // Equal distribution
    const each = Math.floor(remaining / unlocked.length);
    let leftover = remaining - each * unlocked.length;
    for (const { i } of unlocked) {
      next[i].percentage = each + (leftover > 0 ? 1 : 0);
      if (leftover > 0) leftover--;
    }
  } else {
    // Proportional scaling
    let assigned = 0;
    for (let j = 0; j < unlocked.length; j++) {
      const { s, i } = unlocked[j];
      if (j === unlocked.length - 1) {
        // Last one gets the remainder to guarantee exact 100
        next[i].percentage = remaining - assigned;
      } else {
        const scaled = Math.round((s.percentage / unlockedTotal) * remaining);
        next[i].percentage = scaled;
        assigned += scaled;
      }
    }
  }

  // Clamp all to [0, 100]
  for (const slider of next) {
    slider.percentage = Math.max(0, Math.min(100, slider.percentage));
  }

  return next;
}

/* ═══════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════ */
export default function TimeTracker({
  timeBlockId,
  onClose,
  onSaved,
}: TimeTrackerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  
  const [timeBlock, setTimeBlock] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/time-blocks/${timeBlockId}`)
      .then(res => res.json())
      .then(data => {
        setTimeBlock(data);
        if (data.tasks) {
          setTasks(data.tasks.map((bt: any) => bt.task));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, [timeBlockId]);

  /* ── Slider state ── */
  const initialSliders = useMemo<SliderState[]>(() => {
    if (tasks.length === 0) return [];
    const each = Math.floor(100 / tasks.length);
    const leftover = 100 - each * tasks.length;
    return tasks.map((t, i) => ({
      taskId: t.id,
      taskName: t.title,
      percentage: each + (i < leftover ? 1 : 0),
      isLocked: false,
      isPlanned: true,
      portfolio: t.area || t.portfolio || 'PHYSICAL',
    }));
  }, [tasks]);

  const [sliders, setSliders] = useState<SliderState[]>([]);
  const [unplannedCounter, setUnplannedCounter] = useState(0);
  const [newTaskName, setNewTaskName] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  /* ── Mood state ── */
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState(5);
  const [satisfaction, setSatisfaction] = useState<number | null>(null);

  /* ── Saving state ── */
  const [isSaving, setIsSaving] = useState(false);

  /* Reset when tasks change */
  useEffect(() => {
    setSliders(initialSliders);
  }, [initialSliders]);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg || isLoading) return;

    if (!dlg.open) {
      dlg.showModal();
    }
  }, [isLoading]);

  // Safari fallback: close on backdrop click
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;

    const handleClick = (e: MouseEvent) => {
      if (e.target === dlg) onClose();
    };
    const handleCancel = (e: Event) => {
      e.preventDefault();
      onClose();
    };

    dlg.addEventListener('click', handleClick);
    dlg.addEventListener('cancel', handleCancel);
    return () => {
      dlg.removeEventListener('click', handleClick);
      dlg.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  /* ── Computed values ── */
  const totalPercentage = sliders.reduce((sum, s) => sum + s.percentage, 0);
  const isValid = totalPercentage === 100 && mood !== null;
  const totalHours = timeBlock ? (timeBlock.totalMinutes / 60).toFixed(1).replace('.0', '') : '0';

  /* ── Handlers ── */
  const handleSliderChange = useCallback(
    (index: number, newValue: number) => {
      setSliders((prev) => redistribute(prev, index, newValue));
    },
    [],
  );

  const handleToggleLock = useCallback((index: number) => {
    setSliders((prev) =>
      prev.map((s, i) => (i === index ? { ...s, isLocked: !s.isLocked } : s)),
    );
  }, []);

  const handleAddUnplanned = useCallback(() => {
    const name = newTaskName.trim();
    if (!name) return;

    const newSlider: SliderState = {
      taskId: `unplanned-${Date.now()}-${unplannedCounter}`,
      taskName: name,
      percentage: 0,
      isLocked: false,
      isPlanned: false,
      portfolio: 'MENTAL', // default portfolio for unplanned
    };

    setSliders((prev) => [...prev, newSlider]);
    setUnplannedCounter((c) => c + 1);
    setNewTaskName('');
    setIsAddingTask(false);
  }, [newTaskName, unplannedCounter]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddUnplanned();
      } else if (e.key === 'Escape') {
        setIsAddingTask(false);
        setNewTaskName('');
      }
    },
    [handleAddUnplanned],
  );

  const handleSave = useCallback(async () => {
    if (!isValid || isSaving) return;
    setIsSaving(true);

    try {
      const allocations: TimeAllocationPayload[] = sliders.map((s) => ({
        taskId: s.taskId,
        taskName: s.taskName,
        percentage: s.percentage,
        minutes: Math.round((s.percentage / 100) * timeBlock.totalMinutes),
        type: s.isPlanned ? 'PLANNED' : 'UNPLANNED',
      }));

      // POST allocations
      await fetch(`/api/time-blocks/${timeBlock.id}/allocations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocations }),
      });

      // POST mood check-in
      await fetch('/api/mood', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeBlockId: timeBlock.id,
          mood,
          energyLevel: energy,
          satisfactionLevel: satisfaction ?? 2,
        }),
      });

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error saving time allocation:', err);
    } finally {
      setIsSaving(false);
    }
  }, [isValid, isSaving, sliders, timeBlock, mood, energy, satisfaction, onSaved, onClose]);

  /* ── Portfolio to accent mapping ── */
  const portfolioAccent = (p: 'PHYSICAL' | 'MENTAL' | 'ECONOMIC') => {
    const map = { PHYSICAL: 'physical', MENTAL: 'mental', ECONOMIC: 'economic' } as const;
    return map[p] || 'physical';
  };

  /* ── Render ── */
  if (isLoading) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      closedby="any"
    >
      <div className={styles.content}>
        {/* ── Header ── */}
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>{timeBlock.title}</h2>
            <p className={styles.subtitle}>
              <span className="font-data">{timeBlock.startTime}</span>
              {' — '}
              <span className="font-data">{timeBlock.endTime}</span>
              <span className={styles.totalTime}>{totalHours}h</span>
            </p>
          </div>
          <button
            type="button"
            className="btn btn--icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </header>

        {/* ── Sliders ── */}
        <section className={styles.sliders} aria-label="Asignación de tiempo">
          {sliders.map((slider, i) => (
            <TimeSlider
              key={slider.taskId}
              taskName={slider.taskName}
              percentage={slider.percentage}
              minutes={Math.round((slider.percentage / 100) * timeBlock.totalMinutes)}
              isLocked={slider.isLocked}
              isPlanned={slider.isPlanned}
              accentColor={portfolioAccent(slider.portfolio)}
              onChange={(val) => handleSliderChange(i, val)}
              onToggleLock={() => handleToggleLock(i)}
            />
          ))}
        </section>

        {/* ── Add Unplanned ── */}
        <div className={styles.addSection}>
          {isAddingTask ? (
            <div className={styles.addRow}>
              <input
                type="text"
                className={`input ${styles.addInput}`}
                placeholder="Nombre de la tarea imprevista…"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              <button
                type="button"
                className="btn btn--primary"
                disabled={!newTaskName.trim()}
                onClick={handleAddUnplanned}
              >
                Añadir
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setIsAddingTask(false);
                  setNewTaskName('');
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => setIsAddingTask(true)}
            >
              + Añadir Imprevisto
            </button>
          )}
        </div>

        {/* ── Total Bar ── */}
        <div className={styles.totalBar} data-status={totalPercentage === 100 ? 'ok' : 'error'}>
          <div className={styles.totalTrack}>
            <div
              className={styles.totalFill}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
          <span className={`font-data ${styles.totalLabel}`}>
            {totalPercentage === 100
              ? '100% asignado ✓'
              : `${totalPercentage}% — faltan ${100 - totalPercentage}%`}
          </span>
        </div>

        {/* ── Mood Check-in ── */}
        <MoodCheckin
          mood={mood}
          energy={energy}
          satisfaction={satisfaction}
          onMoodChange={setMood}
          onEnergyChange={setEnergy}
          onSatisfactionChange={setSatisfaction}
        />

        {/* ── Save ── */}
        <footer className={styles.footer}>
          <button
            type="button"
            className={`btn btn--primary btn--lg ${styles.saveBtn}`}
            disabled={!isValid || isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Guardando…' : 'Guardar Inversión'}
          </button>
          {!isValid && (
            <p className={styles.hint}>
              {totalPercentage !== 100 && 'Asigna exactamente 100%.'}
              {totalPercentage === 100 && mood === null && 'Selecciona tu estado de ánimo.'}
            </p>
          )}
        </footer>
      </div>
    </dialog>
  );
}
