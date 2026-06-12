'use client';

import { useState, useEffect } from 'react';

interface SleepData {
  totalHours: number;
  qualityPercentage: number;
}

interface MoodData {
  mood: number;
  energyLevel: number;
}

export default function EnergyBar() {
  const [energy, setEnergy] = useState(0);
  const [breakdown, setBreakdown] = useState({
    sleep: 0,
    sleepQuality: 0,
    mood: 0,
    activity: 0,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadEnergyData();
  }, []);

  async function loadEnergyData() {
    try {
      // Fetch latest sleep data
      const sleepRes = await fetch('/api/sleep?limit=1');
      const sleepData = await sleepRes.json();
      const latestSleep: SleepData | null = sleepData[0] || null;

      // Fetch latest mood
      const moodRes = await fetch('/api/mood?limit=1');
      const moodData = await moodRes.json();
      const latestMood: MoodData | null = moodData[0] || null;

      // Calculate energy score (0-100)
      const sleepScore = latestSleep
        ? Math.min(100, (latestSleep.totalHours / 8) * 100)
        : 50;
      const qualityScore = latestSleep ? latestSleep.qualityPercentage : 50;
      const moodScore = latestMood ? (latestMood.mood / 5) * 100 : 50;
      const activityScore = latestMood
        ? (latestMood.energyLevel / 10) * 100
        : 50;

      const newBreakdown = {
        sleep: Math.round(sleepScore),
        sleepQuality: Math.round(qualityScore),
        mood: Math.round(moodScore),
        activity: Math.round(activityScore),
      };

      // Weighted average: sleep 40%, quality 30%, mood 20%, activity 10%
      const totalEnergy = Math.round(
        newBreakdown.sleep * 0.4 +
          newBreakdown.sleepQuality * 0.3 +
          newBreakdown.mood * 0.2 +
          newBreakdown.activity * 0.1
      );

      setBreakdown(newBreakdown);
      setEnergy(totalEnergy);
    } catch {
      setEnergy(50); // Default fallback
    }
    setIsLoaded(true);
  }

  function getEnergyColor(value: number): string {
    if (value < 30) return 'var(--energy-low)';
    if (value < 60) return 'var(--energy-mid)';
    if (value < 80) return 'var(--energy-good)';
    return 'var(--energy-peak)';
  }

  function getEnergyGradient(value: number): string {
    if (value < 30)
      return 'linear-gradient(90deg, hsl(0, 80%, 40%), hsl(0, 80%, 50%))';
    if (value < 60)
      return 'linear-gradient(90deg, hsl(25, 90%, 45%), hsl(45, 90%, 55%))';
    if (value < 80)
      return 'linear-gradient(90deg, hsl(130, 50%, 40%), hsl(130, 60%, 50%))';
    return 'linear-gradient(90deg, hsl(200, 70%, 45%), hsl(200, 80%, 55%))';
  }

  function getEnergyEmoji(value: number): string {
    if (value < 20) return '💀';
    if (value < 40) return '😫';
    if (value < 60) return '😐';
    if (value < 80) return '😊';
    return '🔥';
  }

  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-md)',
        marginBottom: 'var(--space-lg)',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>⚡</span>
          <span
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            Energía
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.25rem' }}>{getEnergyEmoji(energy)}</span>
          <span
            className="font-data"
            style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: getEnergyColor(energy),
            }}
          >
            {isLoaded ? `${energy}%` : '—'}
          </span>
        </div>
      </div>

      {/* Energy Bar */}
      <div
        className="energy-bar"
        onClick={() => setShowTooltip(!showTooltip)}
        style={{ cursor: 'pointer' }}
        role="meter"
        aria-valuenow={energy}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Nivel de energía: ${energy}%`}
      >
        <div
          className="energy-bar__fill"
          style={{
            width: isLoaded ? `${energy}%` : '0%',
            background: getEnergyGradient(energy),
          }}
        />
      </div>

      {/* Tooltip breakdown */}
      {showTooltip && (
        <div
          style={{
            marginTop: 'var(--space-sm)',
            padding: 'var(--space-sm) var(--space-md)',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            animation: 'slide-up 0.2s ease-out',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '6px',
              fontSize: '0.75rem',
            }}
          >
            <div style={{ color: 'var(--text-tertiary)' }}>
              😴 Sueño (40%):{' '}
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>
                {breakdown.sleep}%
              </span>
            </div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              ✨ Calidad (30%):{' '}
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>
                {breakdown.sleepQuality}%
              </span>
            </div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              🧠 Ánimo (20%):{' '}
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>
                {breakdown.mood}%
              </span>
            </div>
            <div style={{ color: 'var(--text-tertiary)' }}>
              💪 Actividad (10%):{' '}
              <span className="font-data" style={{ color: 'var(--text-secondary)' }}>
                {breakdown.activity}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
