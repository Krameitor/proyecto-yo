'use client';

import { useState, useRef } from 'react';

interface MealResult {
  description: string;
  estimatedCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: string[];
}

interface MealEntry {
  id: string;
  description: string;
  estimatedCalories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  mealType: string;
  createdAt: string;
}

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: '🌅 Desayuno' },
  { value: 'LUNCH', label: '☀️ Comida' },
  { value: 'DINNER', label: '🌙 Cena' },
  { value: 'SNACK', label: '🍎 Snack' },
];

export default function MealLogger() {
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedMealType, setSelectedMealType] = useState('LUNCH');
  const [lastResult, setLastResult] = useState<MealResult | null>(null);
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState(2200);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Calculate daily totals
  const today = new Date().toDateString();
  const todayMeals = meals.filter(
    (m) => new Date(m.createdAt).toDateString() === today
  );
  const totalCalories = todayMeals.reduce(
    (sum, m) => sum + (m.estimatedCalories || 0),
    0
  );
  const totalProtein = todayMeals.reduce(
    (sum, m) => sum + (m.protein || 0),
    0
  );
  const totalCarbs = todayMeals.reduce(
    (sum, m) => sum + (m.carbs || 0),
    0
  );
  const totalFat = todayMeals.reduce(
    (sum, m) => sum + (m.fat || 0),
    0
  );
  const caloriePercentage = Math.min(100, (totalCalories / dailyCalorieGoal) * 100);

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1024;
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = (height / width) * MAX_SIZE;
            width = MAX_SIZE;
          } else {
            width = (width / height) * MAX_SIZE;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('No ctx')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Compress failed'));
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Load failed')); };
      img.src = url;
    });
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLastResult(null);
    setPreview(URL.createObjectURL(file));
    setIsAnalyzing(true);

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('image', compressed, 'meal.jpg');
      formData.append('mealType', selectedMealType);

      const res = await fetch('/api/meals/analyze', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Error al analizar');

      const data: MealResult = await res.json();
      setLastResult(data);

      // Auto-save to meals list
      const saveRes = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: data.description,
          estimatedCalories: data.estimatedCalories,
          protein: data.protein,
          carbs: data.carbs,
          fat: data.fat,
          mealType: selectedMealType,
        }),
      });

      if (saveRes.ok) {
        const saved = await saveRes.json();
        setMeals((prev) => [saved, ...prev]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsAnalyzing(false);
    }
  }

  // Load today's meals on mount
  useState(() => {
    fetch(`/api/meals?date=${new Date().toISOString().split('T')[0]}`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMeals)
      .catch(() => {});
  });

  // Load settings
  useState(() => {
    fetch('/api/settings')
      .then((r) => r.ok ? r.json() : null)
      .then((s) => { if (s?.dailyCalorieGoal) setDailyCalorieGoal(s.dailyCalorieGoal); })
      .catch(() => {});
  });

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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          🍽️ Nutrición
        </h3>
        <button
          className="btn btn--icon"
          style={{ width: '32px', height: '32px', fontSize: '0.875rem' }}
          onClick={() => setShowSettings(!showSettings)}
          aria-label="Configuración de nutrición"
        >
          ⚙️
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
          animation: 'slide-up 0.2s ease-out',
        }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
            Objetivo calórico diario
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <input
              type="number"
              className="input"
              value={dailyCalorieGoal}
              onChange={(e) => setDailyCalorieGoal(Number(e.target.value) || 2200)}
              min={1000}
              max={5000}
              step={50}
              style={{ flex: 1 }}
            />
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>kcal</span>
          </div>
        </div>
      )}

      {/* Daily Progress Bar */}
      <div style={{ marginBottom: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span className="font-data" style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            {totalCalories}
          </span>
          <span className="font-data" style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', alignSelf: 'flex-end' }}>
            / {dailyCalorieGoal} kcal
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '8px',
          background: 'var(--bg-elevated)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${caloriePercentage}%`,
            background: caloriePercentage > 100
              ? 'linear-gradient(90deg, var(--color-warning), var(--color-error))'
              : 'linear-gradient(90deg, var(--color-economic), hsl(170, 70%, 50%))',
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-slow)',
          }} />
        </div>

        {/* Macro summary */}
        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-sm)', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            🥩 <span className="font-data" style={{ color: 'var(--text-secondary)' }}>{totalProtein.toFixed(0)}g</span> prot
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            🍞 <span className="font-data" style={{ color: 'var(--text-secondary)' }}>{totalCarbs.toFixed(0)}g</span> carbs
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            🥑 <span className="font-data" style={{ color: 'var(--text-secondary)' }}>{totalFat.toFixed(0)}g</span> grasa
          </span>
        </div>
      </div>

      {/* Meal Type Selector */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: 'var(--space-md)' }}>
        {MEAL_TYPES.map((mt) => (
          <button
            key={mt.value}
            onClick={() => setSelectedMealType(mt.value)}
            style={{
              flex: 1,
              padding: '6px 4px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              border: selectedMealType === mt.value ? '1px solid var(--color-economic)' : '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-sm)',
              background: selectedMealType === mt.value ? 'var(--color-economic-soft)' : 'var(--bg-card)',
              color: selectedMealType === mt.value ? 'var(--color-economic)' : 'var(--text-tertiary)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              fontFamily: 'var(--font-ui)',
            }}
          >
            {mt.label}
          </button>
        ))}
      </div>

      {/* Photo capture button */}
      <button
        className="btn btn--economic btn--lg"
        style={{ width: '100%', fontSize: '0.9375rem' }}
        onClick={() => fileInputRef.current?.click()}
        disabled={isAnalyzing}
      >
        📸 Fotografiar comida
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoCapture}
        className="visually-hidden"
        id="meal-photo-input"
      />

      {/* Loading */}
      {isAnalyzing && (
        <div style={{ textAlign: 'center', padding: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
          {preview && (
            <div style={{
              width: '100%',
              height: '100px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 'var(--space-sm)',
              opacity: 0.6,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Meal preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div className="skeleton" style={{ height: '40px', marginBottom: '8px' }} />
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            Analizando tu comida con AI...
          </p>
        </div>
      )}

      {/* Last result */}
      {lastResult && !isAnalyzing && (
        <div style={{
          marginTop: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-economic-soft)',
          animation: 'scale-in 0.3s ease-out',
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '6px' }}>
            ✅ {lastResult.description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '0.75rem' }}>
            <span className="font-data" style={{ color: 'var(--text-primary)' }}>
              {lastResult.estimatedCalories} kcal
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>
              P:{lastResult.protein}g
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>
              C:{lastResult.carbs}g
            </span>
            <span style={{ color: 'var(--text-tertiary)' }}>
              G:{lastResult.fat}g
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          marginTop: 'var(--space-md)',
          padding: 'var(--space-md)',
          background: 'hsl(0, 75%, 55%, 0.1)',
          borderRadius: 'var(--radius-md)',
          color: 'var(--color-error)',
          fontSize: '0.8125rem',
          textAlign: 'center',
        }}>
          {error}
        </div>
      )}

      {/* Today's meals list */}
      {todayMeals.length > 0 && (
        <div style={{ marginTop: 'var(--space-md)' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoy
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {todayMeals.map((meal) => (
              <div
                key={meal.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  padding: '8px var(--space-sm)',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8125rem',
                }}
              >
                <span style={{ fontSize: '0.6875rem' }}>
                  {MEAL_TYPES.find((t) => t.value === meal.mealType)?.label.split(' ')[0] || '🍽️'}
                </span>
                <span style={{ flex: 1, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {meal.description}
                </span>
                <span className="font-data" style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.75rem' }}>
                  {meal.estimatedCalories} kcal
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
