'use client'

import { useRef, useEffect, useCallback, useState, type FormEvent } from 'react'

interface CreateTaskDialogProps {
  open: boolean
  onClose: () => void
  onCreated: (task: unknown) => void
  initialArea?: 'PHYSICAL' | 'MENTAL' | 'ECONOMIC'
}

const PORTFOLIO_INFO: Record<string, { emoji: string; label: string; btnClass: string }> = {
  PHYSICAL: { emoji: '🏋️', label: 'Cartera Física', btnClass: 'btn--physical' },
  MENTAL: { emoji: '🧠', label: 'Cartera Mental', btnClass: 'btn--mental' },
  ECONOMIC: { emoji: '💰', label: 'Cartera Económica', btnClass: 'btn--economic' },
}

export default function CreateTaskDialog({
  open,
  initialArea = 'PHYSICAL',
  onClose,
  onCreated,
}: CreateTaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [area, setArea] = useState(initialArea)
  const info = PORTFOLIO_INFO[area]

  // Sync open prop with native <dialog> state
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  // Light-dismiss fallback (click on backdrop)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    const handleClick = (e: MouseEvent) => {
      const rect = dialog.getBoundingClientRect()
      const clickedInsideDialog =
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom

      if (!clickedInsideDialog) {
        onClose()
      }
    }

    const handleCancel = () => {
      onClose()
    }

    dialog.addEventListener('click', handleClick)
    dialog.addEventListener('cancel', handleCancel)
    return () => {
      dialog.removeEventListener('click', handleClick)
      dialog.removeEventListener('cancel', handleCancel)
    }
  }, [onClose])

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)

      const title = (formData.get('title') as string)?.trim()
      if (!title) return

      const description = (formData.get('description') as string)?.trim() || null
      const deadline = (formData.get('deadline') as string) || null

      try {
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description,
            area,
            deadline: deadline || undefined,
          }),
        })

        if (res.ok) {
          const newTask = await res.json()
          onCreated(newTask)
          onClose()
          // Reset form
          ;(e.target as HTMLFormElement).reset()
        }
      } catch (err) {
        console.error('Failed to create task:', err)
      }
    },
    [area, onCreated, onClose]
  )

  return (
    <dialog
      ref={dialogRef}
      closedby="any"
    >
      <div
        style={{
          padding: 'var(--space-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 'var(--space-lg)',
          }}
        >
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <span>{info.emoji}</span>
            Nueva Tarea
          </h3>
          <button
            className="btn btn--icon"
            onClick={onClose}
            aria-label="Cerrar"
            type="button"
            style={{ fontSize: '1rem' }}
          >
            ✕
          </button>
        </div>

        {/* Area badge */}
        <div style={{ marginBottom: 'var(--space-md)' }}>
          <span
            className={`badge badge--${area.toLowerCase()}`}
          >
            {info.label}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {/* Title */}
            <div>
              <label
                htmlFor="task-title"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                Título *
              </label>
              <input
                id="task-title"
                name="title"
                type="text"
                className="input"
                placeholder="¿Qué vas a hacer?"
                required
                autoFocus
                autoComplete="off"
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="task-desc"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                Descripción
              </label>
              <textarea
                id="task-desc"
                name="description"
                className="input"
                placeholder="Detalles opcionales..."
                rows={3}
                style={{ resize: 'vertical', minHeight: 60 }}
              />
            </div>

            {/* Deadline */}
            <div>
              <label
                htmlFor="task-deadline"
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)',
                }}
              >
                Fecha límite
              </label>
              <input
                id="task-deadline"
                name="deadline"
                type="datetime-local"
                className="input"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={`btn btn--lg ${info.btnClass}`}
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
            >
              Crear Tarea
            </button>
          </div>
        </form>
      </div>
    </dialog>
  )
}
