'use client';

import { useState, useEffect } from 'react';

interface WeightEntry {
  id: string;
  weight: number;
  createdAt: string;
}

export default function WeightTracker() {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [newWeight, setNewWeight] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/weight?limit=30')
      .then((r) => r.ok ? r.json() : [])
      .then(setEntries)
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 20 || weight > 300) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight }),
      });
      if (res.ok) {
        const entry = await res.json();
        setEntries((prev) => [entry, ...prev]);
        setNewWeight('');
      }
    } catch {
      // silently fail
    }
    setIsSubmitting(false);
  }

  // Calculate sparkline
  const sparklineData = [...entries].reverse().slice(-15);
  const maxWeight = sparklineData.length > 0 ? Math.max(...sparklineData.map((e) => e.weight)) : 100;
  const minWeight = sparklineData.length > 0 ? Math.min(...sparklineData.map((e) => e.weight)) : 0;
  const weightRange = maxWeight - minWeight || 1;

  // Trend calculation
  const latestWeight = entries[0]?.weight;
  const previousWeight = entries[1]?.weight;
  const trend = latestWeight && previousWeight
    ? latestWeight - previousWeight
    : null;

  return (
    <div
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur))',
        WebkitBackdropFilter: 'blur(var(--glass-blur))',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-lg)',
      }}
    >
      <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 'var(--space-md)' }}>
        ⚖️ Peso
      </h3>

      {/* Current weight display */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: 'var(--space-md)' }}>
        <span className="font-data" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          {latestWeight ? latestWeight.toFixed(1) : '—'}
        </span>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>kg</span>
        {trend !== null && (
          <span
            className="font-data"
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: trend < 0 ? 'var(--color-success)' : trend > 0 ? 'var(--color-warning)' : 'var(--text-tertiary)',
              marginLeft: 'auto',
            }}
          >
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}kg
          </span>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData.length > 1 && (
        <div className="sparkline" style={{ marginBottom: 'var(--space-md)', height: '40px' }}>
          {sparklineData.map((entry, i) => {
            const height = ((entry.weight - minWeight) / weightRange) * 100;
            return (
              <div
                key={entry.id}
                className="sparkline__bar"
                style={{
                  height: `${Math.max(8, height)}%`,
                  background: i === sparklineData.length - 1 ? 'var(--color-physical)' : 'var(--color-physical)',
                  opacity: i === sparklineData.length - 1 ? 1 : 0.3 + (i / sparklineData.length) * 0.5,
                }}
                title={`${entry.weight}kg — ${new Date(entry.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
              />
            );
          })}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 'var(--space-sm)' }}>
        <input
          type="number"
          className="input"
          placeholder="75.5"
          value={newWeight}
          onChange={(e) => setNewWeight(e.target.value)}
          step="0.1"
          min="20"
          max="300"
          style={{ flex: 1 }}
          id="weight-input"
        />
        <button
          type="submit"
          className="btn btn--physical"
          disabled={isSubmitting || !newWeight}
        >
          {isSubmitting ? '...' : '+ Registrar'}
        </button>
      </form>
    </div>
  );
}
