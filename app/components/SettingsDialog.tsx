'use client';

import { useState, useEffect, useRef } from 'react';

interface Settings {
  currentWeight: number | null;
  targetWeight: number | null;
  dailyCalorieGoal: number | null;
  sleepGoalHours: number;
}

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [settings, setSettings] = useState<Settings>({
    currentWeight: null,
    targetWeight: null,
    dailyCalorieGoal: 2200,
    sleepGoalHours: 8,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Sync open prop with native <dialog> state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      loadSettings();
    } else if (!open && dialog.open) {
      dialog.close();
      setMessage('');
    }
  }, [open]);

  // Light-dismiss
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect();
      const clickedInsideDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom;

      if (!clickedInsideDialog) {
        onClose();
      }
    };

    const handleCancel = () => onClose();

    dialog.addEventListener('click', handleClick);
    dialog.addEventListener('cancel', handleCancel);
    return () => {
      dialog.removeEventListener('click', handleClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onClose]);

  async function loadSettings() {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          currentWeight: data.currentWeight,
          targetWeight: data.targetWeight,
          dailyCalorieGoal: data.dailyCalorieGoal || 2200,
          sleepGoalHours: data.sleepGoalHours || 8,
        });
      }
    } catch {
      // ignore
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage('Ajustes guardados correctamente ✅');
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage('Error al guardar ❌');
      }
    } catch {
      setMessage('Error de conexión ❌');
    }
    setIsSaving(false);
  }

  return (
    <dialog ref={dialogRef} closedby="any" style={{ padding: 0 }}>
      <div style={{ padding: 'var(--space-lg)', width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-lg)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>⚙️ Configuración</h3>
          <button className="btn btn--icon" onClick={onClose} type="button">✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Objetivo Calórico (kcal)
            </label>
            <input
              type="number"
              className="input"
              value={settings.dailyCalorieGoal || ''}
              onChange={(e) => setSettings({ ...settings, dailyCalorieGoal: Number(e.target.value) || null })}
              placeholder="2200"
              min="1000"
              max="5000"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Peso Actual (kg)
              </label>
              <input
                type="number"
                className="input"
                step="0.1"
                value={settings.currentWeight || ''}
                onChange={(e) => setSettings({ ...settings, currentWeight: Number(e.target.value) || null })}
                placeholder="75.0"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Peso Objetivo (kg)
              </label>
              <input
                type="number"
                className="input"
                step="0.1"
                value={settings.targetWeight || ''}
                onChange={(e) => setSettings({ ...settings, targetWeight: Number(e.target.value) || null })}
                placeholder="70.0"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Horas de Sueño Objetivo
            </label>
            <input
              type="number"
              className="input"
              step="0.5"
              value={settings.sleepGoalHours || ''}
              onChange={(e) => setSettings({ ...settings, sleepGoalHours: Number(e.target.value) || 8 })}
              placeholder="8"
              min="4"
              max="12"
            />
          </div>

          {message && (
            <div style={{ fontSize: '0.8125rem', color: message.includes('✅') ? 'var(--color-success)' : 'var(--color-error)', textAlign: 'center' }}>
              {message}
            </div>
          )}

          <button type="submit" className="btn btn--primary btn--lg" disabled={isSaving} style={{ marginTop: 'var(--space-sm)' }}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </dialog>
  );
}
