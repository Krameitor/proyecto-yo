'use client';

import { useState, useRef } from 'react';

interface SleepResult {
  totalHours: number;
  qualityPercentage: number;
}

export default function SleepUploader({ onSleepLogged }: { onSleepLogged?: (data: SleepResult) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SleepResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function compressImage(file: File): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 1200;
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
        if (!ctx) { reject(new Error('No canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (blob) resolve(blob);
            else reject(new Error('Compression failed'));
          },
          'image/jpeg',
          0.7
        );
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
      img.src = url;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setResult(null);

    // Show preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    setIsLoading(true);

    try {
      // Compress
      const compressed = await compressImage(file);

      // Send to API
      const formData = new FormData();
      formData.append('image', compressed, 'sleep.jpg');

      const res = await fetch('/api/sleep/analyze', { method: 'POST', body: formData });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al analizar la imagen');
      }

      const data: SleepResult = await res.json();
      setResult(data);
      onSleepLogged?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  }

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
        😴 Sleep Cycle
      </h3>

      {/* Upload Zone */}
      {!result && !isLoading && (
        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
        >
          <div className="upload-zone__icon">📸</div>
          <div className="upload-zone__text">
            Sube tu captura de Sleep Cycle
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            Se comprimirá automáticamente
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="visually-hidden"
        id="sleep-upload-input"
      />

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: 'var(--space-lg)' }}>
          {preview && (
            <div style={{
              width: '100%',
              height: '120px',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              marginBottom: 'var(--space-md)',
              opacity: 0.5,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Sleep capture preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
          <div className="skeleton" style={{ height: '60px', marginBottom: 'var(--space-sm)' }} />
          <div className="skeleton" style={{ height: '20px', width: '60%', margin: '0 auto' }} />
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginTop: 'var(--space-md)' }}>
            Analizando con AI...
          </p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div style={{ animation: 'scale-in 0.3s ease-out' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-md)',
          }}>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Horas
              </div>
              <div className="font-data" style={{ fontSize: '1.75rem', fontWeight: 800, color: result.totalHours >= 7 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {result.totalHours.toFixed(1)}
              </div>
            </div>
            <div style={{
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Calidad
              </div>
              <div className="font-data" style={{ fontSize: '1.75rem', fontWeight: 800, color: result.qualityPercentage >= 70 ? 'var(--color-success)' : 'var(--color-warning)' }}>
                {result.qualityPercentage}%
              </div>
            </div>
          </div>

          <button
            className="btn btn--ghost"
            style={{ width: '100%', marginTop: 'var(--space-md)' }}
            onClick={() => { setResult(null); setPreview(null); }}
          >
            📸 Subir otra captura
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{
          background: 'hsl(0, 75%, 55%, 0.1)',
          border: '1px solid hsl(0, 75%, 55%, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--space-md)',
          color: 'var(--color-error)',
          fontSize: '0.8125rem',
          textAlign: 'center',
        }}>
          {error}
          <button
            className="btn btn--ghost"
            style={{ marginTop: 'var(--space-sm)', width: '100%' }}
            onClick={() => { setError(null); setPreview(null); }}
          >
            Reintentar
          </button>
        </div>
      )}
    </div>
  );
}
