'use client';

import { useState } from 'react';
import BottomNav from './components/BottomNav';
import DayView from './components/DayView';
import TasksView from './components/TasksView';
import DataView from './components/DataView';
import SettingsDialog from './components/SettingsDialog';
import EnergyBar from './components/EnergyBar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'today' | 'tasks' | 'data' | 'settings'>('today');
  const [showSettings, setShowSettings] = useState(false);

  const handleTabChange = (tab: 'today' | 'tasks' | 'data' | 'settings') => {
    if (tab === 'settings') {
      setShowSettings(true);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <main className="app-shell" style={{ paddingBottom: '80px' }}>
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
        </div>

        {/* Energy Bar is always visible at the top */}
        <EnergyBar />
      </header>

      {/* ═══ Main Content Area based on active tab ═══ */}
      <section>
        {activeTab === 'today' && <DayView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'data' && <DataView />}
      </section>

      {/* ═══ Bottom Navigation ═══ */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* ═══ Settings Dialog ═══ */}
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </main>
  );
}
