'use client'

import { useCallback, useMemo, type DragEvent } from 'react'

export interface Task {
  id: string
  title: string
  description: string | null
  portfolio: 'PHYSICAL' | 'MENTAL' | 'ECONOMIC'
  isPinned: boolean
  deadline: string | null
  status: string
  sortOrder: number
  createdAt: string
}

interface TaskCardProps {
  task: Task
  onUpdate: (task: Task) => void
  onDragStart?: (e: DragEvent<HTMLDivElement>, task: Task) => void
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void
  isDraggable?: boolean
  isHighlighted?: boolean
}

type DegradationLevel = 'none' | 'calm' | 'warning' | 'urgent' | 'critical' | 'overdue'

interface DegradationInfo {
  color: string
  level: DegradationLevel
  label: string
}

function getDegradation(deadline: string | null): DegradationInfo {
  if (!deadline) {
    return { color: 'var(--text-tertiary)', level: 'none', label: '' }
  }

  const now = new Date()
  const dl = new Date(deadline)
  const diffMs = dl.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  const diffDays = diffMs / (1000 * 60 * 60 * 24)

  if (diffMs < 0) {
    const overdueDays = Math.abs(Math.ceil(diffDays))
    return {
      color: 'hsl(0, 70%, 40%)',
      level: 'overdue',
      label: `🔥 ${overdueDays}d atrasada`,
    }
  }

  if (diffHours < 24) {
    const hoursLeft = Math.max(1, Math.ceil(diffHours))
    return {
      color: 'hsl(0, 85%, 55%)',
      level: 'critical',
      label: `${hoursLeft}h`,
    }
  }

  if (diffDays <= 3) {
    const daysLeft = Math.ceil(diffDays)
    return {
      color: 'hsl(25, 90%, 55%)',
      level: 'urgent',
      label: `${daysLeft}d`,
    }
  }

  if (diffDays <= 7) {
    const daysLeft = Math.ceil(diffDays)
    return {
      color: 'hsl(45, 90%, 55%)',
      level: 'warning',
      label: `${daysLeft}d`,
    }
  }

  const daysLeft = Math.ceil(diffDays)
  return {
    color: 'hsl(210, 70%, 55%)',
    level: 'calm',
    label: `${daysLeft}d`,
  }
}

const PORTFOLIO_BADGE: Record<string, string> = {
  PHYSICAL: 'badge--physical',
  MENTAL: 'badge--mental',
  ECONOMIC: 'badge--economic',
}

const PORTFOLIO_LABEL: Record<string, string> = {
  PHYSICAL: '🏋️ Física',
  MENTAL: '🧠 Mental',
  ECONOMIC: '💰 Económica',
}

export default function TaskCard({
  task,
  onUpdate,
  onDragStart,
  onDragEnd,
  isDraggable = true,
  isHighlighted = false,
}: TaskCardProps) {
  const degradation = useMemo(() => getDegradation(task.deadline), [task.deadline])

  const handleComplete = useCallback(async () => {
    const newStatus = task.status === 'COMPLETED' ? 'ACTIVE' : 'COMPLETED'
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        onUpdate(updated)
      }
    } catch (err) {
      console.error('Failed to update task:', err)
    }
  }, [task.id, task.status, onUpdate])

  const handleDragStart = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/json', JSON.stringify(task))
      e.dataTransfer.effectAllowed = 'move'
      ;(e.currentTarget as HTMLDivElement).classList.add('dragging')
      onDragStart?.(e, task)
    },
    [task, onDragStart]
  )

  const handleDragEnd = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      ;(e.currentTarget as HTMLDivElement).classList.remove('dragging')
      onDragEnd?.(e)
    },
    [onDragEnd]
  )

  const isCompleted = task.status === 'COMPLETED'
  const isOverdue = degradation.level === 'overdue'
  const isCritical = degradation.level === 'critical'

  const cardClasses = [
    'task-card',
    isOverdue ? 'task-card--overdue' : '',
  ].filter(Boolean).join(' ')

  const cardStyle: React.CSSProperties = {
    '--degradation-color': degradation.color,
    opacity: isCompleted ? 0.55 : 1,
    ...(isHighlighted
      ? {
          borderColor: 'var(--color-gold)',
          boxShadow: '0 0 12px rgba(255, 215, 0, 0.15)',
        }
      : {}),
    ...(isCritical
      ? { animation: 'pulse-soft 2s ease-in-out infinite' }
      : {}),
  } as React.CSSProperties

  return (
    <div
      className={cardClasses}
      style={cardStyle}
      draggable={isDraggable && !isCompleted}
      onDragStart={isDraggable ? handleDragStart : undefined}
      onDragEnd={isDraggable ? handleDragEnd : undefined}
      role="listitem"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-sm)' }}>
        {/* Checkbox */}
        <button
          onClick={handleComplete}
          aria-label={isCompleted ? 'Marcar como activa' : 'Marcar como completada'}
          style={{
            width: 22,
            height: 22,
            borderRadius: 'var(--radius-sm)',
            border: `2px solid ${isCompleted ? 'var(--color-success)' : 'var(--glass-border)'}`,
            background: isCompleted ? 'var(--color-success)' : 'transparent',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-base)',
            color: 'white',
            fontSize: '0.75rem',
            padding: 0,
          }}
        >
          {isCompleted && '✓'}
        </button>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="task-card__title"
            style={{
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
            }}
          >
            {isOverdue && '🔥 '}{task.title}
          </div>

          {task.description && (
            <p
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-tertiary)',
                marginBottom: 'var(--space-xs)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.description}
            </p>
          )}

          <div className="task-card__meta">
            <span className={`badge ${PORTFOLIO_BADGE[task.portfolio] || ''}`}>
              {PORTFOLIO_LABEL[task.portfolio] || task.portfolio}
            </span>

            {degradation.label && (
              <span className="task-card__deadline" style={{ '--degradation-color': degradation.color } as React.CSSProperties}>
                {degradation.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
