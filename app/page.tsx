'use client';

import { useState, useCallback } from 'react';
import EnergyBar from './components/EnergyBar';
import WeekBudget from './components/WeekBudget';
import PortfolioSection from './components/PortfolioSection';
import TimeTracker, {
  type TimeBlock,
  type Task as TimeTask,
  type TimeAllocationPayload,
} from './components/TimeTracker';
import SleepUploader from './components/SleepUploader';
import MealLogger from './components/MealLogger';
import WeightTracker from './components/WeightTracker';
import EarningsTracker from './components/EarningsTracker';
import WeeklyAssessment from './components/WeeklyAssessment';
import Timeline from './components/Timeline';
import SettingsDialog from './components/SettingsDialog';

export default function Home() {
  // Demo time tracker state (will be connected to timeline later)
  const [showSettings, setShowSettings] = useState(false);
  const [activeTimeBlock, setActiveTimeBlock] = useState<TimeBlock | null>(null);
  const [demoTasks] = useState<TimeTask[]>([
    { id: 'demo-1', title: 'Proyecto LEINN', portfolio: 'ECONOMIC' },
    { id: 'demo-2', title: 'Essay semanal', portfolio: 'MENTAL' },
    { id: 'demo-3', title: 'Estudio autodidacta', portfolio: 'MENTAL' },
  ]);

  const handleTimeTrackerSave = useCallback(
    (allocations: TimeAllocationPayload[]) => {
      console.log('Time allocations saved:', allocations);
      setActiveTimeBlock(null);
    },
    []
  );

  const handleEndBlock = useCallback((block: TimeBlock) => {
    setActiveTimeBlock(block);
  }, []);

  return (
    <main className="app-shell">
      {/* ═══ Header ═══ */}
      <header
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 16px) + 16px)',
          marginBottom: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
              }}
            >
              <span className="text-gradient">Proyecto Yo</span>
            </h1>
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
                marginTop: '4px',
              }}
            >
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>

          <button
            className="btn btn--icon"
            onClick={() => setShowSettings(true)}
            style={{ fontSize: '1.25rem' }}
            aria-label="Configuración"
          >
            ⚙️
          </button>
        </div>

        {/* Energy Bar */}
        <EnergyBar />
      </header>

      {/* ═══ Weekly Budget ═══ */}
      <section className="section">
        <WeekBudget />
      </section>

      {/* ═══ Timeline ═══ */}
      <section className="section">
        <Timeline onEndBlock={handleEndBlock} />
      </section>

      {/* ═══ Investment Portfolios (To-Do replacement) ═══ */}
      <PortfolioSection />

      {/* ═══ Health Section ═══ */}
      <section className="section">
        <div className="section__header">
          <h2 className="section__title">🏥 Salud</h2>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
          }}
        >
          {/* Sleep Tracker */}
          <SleepUploader />

          {/* Meal Logger */}
          <MealLogger />

          {/* Weight Tracker */}
          <WeightTracker />
        </div>
      </section>

      {/* ═══ Mental Health Section ═══ */}
      <section className="section">
        <div className="section__header">
          <h2 className="section__title">🧠 Salud Mental</h2>
        </div>

        <WeeklyAssessment />
      </section>

      {/* ═══ Economic Section ═══ */}
      <section className="section">
        <div className="section__header">
          <h2 className="section__title">📈 Económica</h2>
        </div>

        <EarningsTracker />
      </section>

      {/* ═══ Footer spacer ═══ */}
      <div style={{ height: 'var(--space-3xl)' }} />

      {/* ═══ Time Tracker Modal ═══ */}
      {activeTimeBlock && (
        <TimeTracker
          timeBlock={activeTimeBlock}
          tasks={demoTasks}
          isOpen={true}
          onClose={() => setActiveTimeBlock(null)}
          onSave={handleTimeTrackerSave}
        />
      )}

      {/* ═══ Settings Dialog ═══ */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </main>
  );
}
