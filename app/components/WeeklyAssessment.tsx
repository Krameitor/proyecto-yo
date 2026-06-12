'use client';

import { useState, useEffect } from 'react';

// PHQ-4 validated questions (2 for anxiety GAD-2 + 2 for depression PHQ-2)
const PHQ4_QUESTIONS = [
  {
    id: 'phq4Q1',
    text: 'Sentirse nervioso/a, ansioso/a o con los nervios de punta',
    category: 'anxiety',
  },
  {
    id: 'phq4Q2',
    text: 'No poder dejar de preocuparse o no poder controlar la preocupación',
    category: 'anxiety',
  },
  {
    id: 'phq4Q3',
    text: 'Tener poco interés o placer en hacer las cosas',
    category: 'depression',
  },
  {
    id: 'phq4Q4',
    text: 'Sentirse desanimado/a, deprimido/a o sin esperanza',
    category: 'depression',
  },
];

const RESPONSE_OPTIONS = [
  { value: 0, label: 'Nunca', emoji: '😊' },
  { value: 1, label: 'Varios días', emoji: '😐' },
  { value: 2, label: 'Más de la mitad', emoji: '😟' },
  { value: 3, label: 'Casi cada día', emoji: '😫' },
];

// Rotating guided journaling prompts — different each week
const JOURNAL_PROMPTS = [
  '¿Qué momento de esta semana te hizo sentir más orgulloso/a de ti mismo/a?',
  '¿Qué es lo que más te ha preocupado esta semana? ¿Por qué crees que es así?',
  'Si pudieras cambiar una decisión de esta semana, ¿cuál sería y por qué?',
  '¿Qué aprendiste esta semana que no sabías antes? (sobre ti, sobre el mundo, sobre otros)',
  '¿Cuándo fue la última vez que sentiste flow (estar completamente absorto en algo)?',
  'Describe tu relación con el estrés esta semana en 3 palabras. ¿Por qué esas palabras?',
  '¿Qué persona ha influido más en tu semana? ¿De qué manera?',
  '¿Qué te gustaría hacer la próxima semana que no hiciste esta?',
  'Si tu yo de hace 1 año pudiera verte hoy, ¿qué pensaría?',
  '¿Qué actividad te recargó energía esta semana? ¿Cuál te la drenó?',
  '¿Estás invirtiendo tu tiempo en lo que realmente importa? ¿Qué cambiarías?',
  '¿Qué miedo evitaste enfrentar esta semana?',
  'Escribe una carta breve a tu yo del futuro. ¿Qué le dirías?',
  '¿Cómo describirías tu estado emocional medio de esta semana en una metáfora?',
  '¿Qué hábito quieres crear y qué hábito quieres romper?',
  '¿Cuál es tu mayor fuente de gratitud ahora mismo?',
];

function getWeekPrompt(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return JOURNAL_PROMPTS[weekNumber % JOURNAL_PROMPTS.length];
}

function getWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  return Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
}

function getScoreInterpretation(score: number): { label: string; color: string; emoji: string } {
  if (score <= 2) return { label: 'Normal', color: 'var(--color-success)', emoji: '💚' };
  if (score <= 5) return { label: 'Leve', color: 'var(--color-warning)', emoji: '💛' };
  if (score <= 8) return { label: 'Moderado', color: 'hsl(25, 90%, 55%)', emoji: '🧡' };
  return { label: 'Severo', color: 'var(--color-error)', emoji: '❤️' };
}

export default function WeeklyAssessment() {
  const [answers, setAnswers] = useState<Record<string, number>>({
    phq4Q1: -1,
    phq4Q2: -1,
    phq4Q3: -1,
    phq4Q4: -1,
  });
  const [journalText, setJournalText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [step, setStep] = useState<'phq4' | 'journal' | 'summary'>('phq4');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const weekPrompt = getWeekPrompt();
  const weekNumber = getWeekNumber();
  const year = new Date().getFullYear();

  // Check if already submitted this week
  useEffect(() => {
    fetch(`/api/weekly-assessment?week=${weekNumber}&year=${year}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setSubmitted(true);
          setAnswers({
            phq4Q1: data.phq4Q1,
            phq4Q2: data.phq4Q2,
            phq4Q3: data.phq4Q3,
            phq4Q4: data.phq4Q4,
          });
          if (data.aiSummary) setAiSummary(data.aiSummary);
        }
      })
      .catch(() => {});
  }, [weekNumber, year]);

  const allAnswered = Object.values(answers).every((v) => v >= 0);
  const totalScore = allAnswered
    ? Object.values(answers).reduce((sum, v) => sum + v, 0)
    : 0;
  const anxietyScore = (answers.phq4Q1 >= 0 ? answers.phq4Q1 : 0) + (answers.phq4Q2 >= 0 ? answers.phq4Q2 : 0);
  const depressionScore = (answers.phq4Q3 >= 0 ? answers.phq4Q3 : 0) + (answers.phq4Q4 >= 0 ? answers.phq4Q4 : 0);
  const interpretation = getScoreInterpretation(totalScore);

  // Audio recording
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      alert('No se pudo acceder al micrófono. Verifica los permisos.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }

  async function handleSubmit() {
    if (!allAnswered) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('weekNumber', String(weekNumber));
      formData.append('year', String(year));
      formData.append('phq4Q1', String(answers.phq4Q1));
      formData.append('phq4Q2', String(answers.phq4Q2));
      formData.append('phq4Q3', String(answers.phq4Q3));
      formData.append('phq4Q4', String(answers.phq4Q4));
      formData.append('journalText', journalText);
      formData.append('journalPrompt', weekPrompt);
      if (audioBlob) {
        formData.append('audio', audioBlob, 'journal.webm');
      }

      const res = await fetch('/api/weekly-assessment', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setSubmitted(true);
        setStep('summary');
        if (data.aiSummary) setAiSummary(data.aiSummary);
      }
    } catch (err) {
      console.error('Error submitting assessment:', err);
    }
    setIsSubmitting(false);
  }

  if (submitted && step !== 'summary') {
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
          🧘 Assessment Semanal
        </h3>
        <div style={{ textAlign: 'center', padding: 'var(--space-md)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Ya completaste el assessment de esta semana
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)', marginTop: 'var(--space-md)' }}>
            <div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>PHQ-4</div>
              <div className="font-data" style={{ fontSize: '1.25rem', fontWeight: 800, color: interpretation.color }}>
                {totalScore}/12
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Estado</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: interpretation.color }}>
                {interpretation.emoji} {interpretation.label}
              </div>
            </div>
          </div>
          {aiSummary && (
            <div style={{
              marginTop: 'var(--space-md)',
              padding: 'var(--space-md)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                🤖 Análisis AI
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {aiSummary}
              </p>
            </div>
          )}
          <button
            className="btn btn--ghost"
            style={{ marginTop: 'var(--space-md)' }}
            onClick={() => { setSubmitted(false); setStep('phq4'); }}
          >
            Ver detalles
          </button>
        </div>
      </div>
    );
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
        🧘 Assessment Semanal
      </h3>

      {/* Step indicator */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: 'var(--space-lg)' }}>
        {['phq4', 'journal', 'summary'].map((s, i) => (
          <div
            key={s}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: '2px',
              background: i <= ['phq4', 'journal', 'summary'].indexOf(step)
                ? 'var(--color-mental)'
                : 'var(--bg-elevated)',
              transition: 'background var(--transition-base)',
            }}
          />
        ))}
      </div>

      {/* Step 1: PHQ-4 */}
      {step === 'phq4' && (
        <div style={{ animation: 'fade-in 0.3s ease-out' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 'var(--space-lg)' }}>
            En las últimas <strong style={{ color: 'var(--text-secondary)' }}>2 semanas</strong>, ¿con qué frecuencia te ha molestado alguno de los siguientes problemas?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            {PHQ4_QUESTIONS.map((q) => (
              <div key={q.id}>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', fontWeight: 500 }}>
                  {q.text}
                </p>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {RESPONSE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.value }))}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                        border: answers[q.id] === opt.value
                          ? '1px solid var(--color-mental)'
                          : '1px solid var(--glass-border)',
                        borderRadius: 'var(--radius-sm)',
                        background: answers[q.id] === opt.value
                          ? 'var(--color-mental-soft)'
                          : 'var(--bg-card)',
                        color: answers[q.id] === opt.value
                          ? 'var(--color-mental)'
                          : 'var(--text-tertiary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        fontFamily: 'var(--font-ui)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Score preview */}
          {allAnswered && (
            <div style={{
              marginTop: 'var(--space-lg)',
              padding: 'var(--space-md)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              animation: 'slide-up 0.2s ease-out',
            }}>
              <div>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>PHQ-4 Score</div>
                <div className="font-data" style={{ fontSize: '1.5rem', fontWeight: 800, color: interpretation.color }}>
                  {totalScore}/12
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)' }}>
                  Ansiedad: <span className="font-data">{anxietyScore}/6</span> | Depresión: <span className="font-data">{depressionScore}/6</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: interpretation.color }}>
                  {interpretation.emoji} {interpretation.label}
                </div>
              </div>
            </div>
          )}

          <button
            className="btn btn--mental btn--lg"
            style={{ width: '100%', marginTop: 'var(--space-lg)' }}
            disabled={!allAnswered}
            onClick={() => setStep('journal')}
          >
            Siguiente → Journaling
          </button>
        </div>
      )}

      {/* Step 2: Guided Journaling */}
      {step === 'journal' && (
        <div style={{ animation: 'fade-in 0.3s ease-out' }}>
          {/* Weekly prompt */}
          <div style={{
            background: 'linear-gradient(135deg, var(--color-mental-soft), rgba(22, 22, 42, 0.3))',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--space-md)',
            marginBottom: 'var(--space-md)',
            borderLeft: '3px solid var(--color-mental)',
          }}>
            <div style={{ fontSize: '0.625rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
              Pregunta de la semana {weekNumber}
            </div>
            <p style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {weekPrompt}
            </p>
          </div>

          {/* Text input */}
          <textarea
            className="input"
            placeholder="Escribe lo que sientas..."
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            rows={5}
            style={{
              resize: 'vertical',
              minHeight: '100px',
              marginBottom: 'var(--space-md)',
              lineHeight: 1.6,
            }}
          />

          {/* Audio recording */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-sm)',
            marginBottom: 'var(--space-lg)',
          }}>
            {!isRecording ? (
              <button
                className="btn"
                onClick={startRecording}
                style={{
                  flex: 1,
                  background: audioBlob ? 'var(--color-mental-soft)' : 'var(--bg-card)',
                  borderColor: audioBlob ? 'var(--color-mental)' : 'var(--glass-border)',
                  color: audioBlob ? 'var(--color-mental)' : 'var(--text-secondary)',
                }}
              >
                🎤 {audioBlob ? '✅ Audio grabado — Regrabar' : 'Grabar audio (opcional)'}
              </button>
            ) : (
              <button
                className="btn btn--danger"
                onClick={stopRecording}
                style={{ flex: 1 }}
              >
                <span style={{ animation: 'pulse-soft 1s infinite' }}>🔴</span>
                Grabando... Tap para parar
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
            <button
              className="btn"
              onClick={() => setStep('phq4')}
              style={{ flex: 1 }}
            >
              ← Volver
            </button>
            <button
              className="btn btn--mental btn--lg"
              style={{ flex: 2 }}
              onClick={handleSubmit}
              disabled={isSubmitting || (!journalText.trim() && !audioBlob)}
            >
              {isSubmitting ? 'Analizando...' : '🧠 Guardar y Analizar'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 'summary' && (
        <div style={{ animation: 'scale-in 0.3s ease-out', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
            {interpretation.emoji}
          </div>
          <h4 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '4px' }}>
            Assessment Completo
          </h4>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem', marginBottom: 'var(--space-lg)' }}>
            Semana {weekNumber} • PHQ-4: <span className="font-data" style={{ color: interpretation.color }}>{totalScore}/12</span>
          </p>

          {aiSummary && (
            <div style={{
              padding: 'var(--space-md)',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              textAlign: 'left',
              marginBottom: 'var(--space-md)',
            }}>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)', marginBottom: '6px', textTransform: 'uppercase' }}>
                🤖 Conclusiones AI
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                {aiSummary}
              </p>
            </div>
          )}

          <button
            className="btn btn--ghost"
            onClick={() => setStep('phq4')}
          >
            Ver respuestas
          </button>
        </div>
      )}
    </div>
  );
}
