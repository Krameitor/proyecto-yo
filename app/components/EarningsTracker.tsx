'use client';

import { useState, useEffect } from 'react';

interface Earning {
  id: string;
  amount: number;
  currency: string;
  source: string;
  description: string | null;
  createdAt: string;
}

export default function EarningsTracker() {
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [source, setSource] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch('/api/earnings')
      .then((r) => (r.ok ? r.json() : []))
      .then(setEarnings)
      .catch(() => {});
  }, []);

  // Calculate totals
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);

  const monthlyTotal = earnings
    .filter((e) => new Date(e.createdAt) >= startOfMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  const weeklyTotal = earnings
    .filter((e) => new Date(e.createdAt) >= startOfWeek)
    .reduce((sum, e) => sum + e.amount, 0);

  const allTimeTotal = earnings.reduce((sum, e) => sum + e.amount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0 || !source.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/earnings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          source: source.trim(),
          description: description.trim() || null,
        }),
      });

      if (res.ok) {
        const entry = await res.json();
        setEarnings((prev) => [entry, ...prev]);
        setAmount('');
        setSource('');
        setDescription('');
        setIsAdding(false);
      }
    } catch {
      // silently fail
    }
    setIsSubmitting(false);
  }

  // Recent entries (last 5)
  const recentEntries = earnings.slice(0, 5);

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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)',
        }}
      >
        <h3
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          💰 Ingresos
        </h3>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--space-sm)',
          marginBottom: 'var(--space-md)',
        }}
      >
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.5625rem',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '2px',
            }}
          >
            Esta semana
          </div>
          <div
            className="font-data"
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: weeklyTotal > 0 ? 'var(--color-economic)' : 'var(--text-tertiary)',
            }}
          >
            {weeklyTotal.toFixed(0)}€
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.5625rem',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '2px',
            }}
          >
            Este mes
          </div>
          <div
            className="font-data"
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: monthlyTotal > 0 ? 'var(--color-economic)' : 'var(--text-tertiary)',
            }}
          >
            {monthlyTotal.toFixed(0)}€
          </div>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-sm) var(--space-md)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: '0.5625rem',
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '2px',
            }}
          >
            Total
          </div>
          <div
            className="font-data"
            style={{
              fontSize: '1.125rem',
              fontWeight: 800,
              color: allTimeTotal > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
            }}
          >
            {allTimeTotal.toFixed(0)}€
          </div>
        </div>
      </div>

      {/* Add form or button */}
      {isAdding ? (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            animation: 'slide-up 0.2s ease-out',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 'var(--space-sm)',
              marginBottom: 'var(--space-sm)',
            }}
          >
            <div>
              <label
                htmlFor="earning-amount"
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                Cantidad (€)
              </label>
              <input
                id="earning-amount"
                type="number"
                className="input"
                placeholder="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                min="0"
                required
                autoFocus
              />
            </div>
            <div>
              <label
                htmlFor="earning-source"
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--text-tertiary)',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                Fuente
              </label>
              <input
                id="earning-source"
                type="text"
                className="input"
                placeholder="Freelance, LEINN..."
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>
          </div>
          <div style={{ marginBottom: 'var(--space-sm)' }}>
            <label
              htmlFor="earning-desc"
              style={{
                fontSize: '0.6875rem',
                color: 'var(--text-tertiary)',
                display: 'block',
                marginBottom: '2px',
              }}
            >
              Descripción (opcional)
            </label>
            <input
              id="earning-desc"
              type="text"
              className="input"
              placeholder="Logo para cliente X..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              type="submit"
              className="btn btn--economic"
              disabled={isSubmitting || !amount || !source.trim()}
              style={{ flex: 1 }}
            >
              {isSubmitting ? '...' : '💰 Registrar'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => setIsAdding(false)}
            >
              ✕
            </button>
          </div>
        </form>
      ) : (
        <button
          className="btn btn--economic"
          style={{ width: '100%', marginBottom: 'var(--space-md)' }}
          onClick={() => setIsAdding(true)}
        >
          + Registrar Ingreso
        </button>
      )}

      {/* Recent entries */}
      {recentEntries.length > 0 && (
        <div>
          <div
            style={{
              fontSize: '0.6875rem',
              color: 'var(--text-tertiary)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Recientes
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: '6px var(--space-sm)',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                }}
              >
                <span
                  style={{
                    flex: 1,
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.source}
                </span>
                <span
                  className="font-data"
                  style={{
                    color: 'var(--color-economic)',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                  }}
                >
                  +{entry.amount.toFixed(0)}€
                </span>
                <span
                  style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '0.625rem',
                  }}
                >
                  {new Date(entry.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
