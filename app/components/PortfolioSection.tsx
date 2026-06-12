'use client'

import { useState, useEffect, useCallback, type DragEvent } from 'react'
import TaskCard, { type Task } from './TaskCard'
import PinnedSlot from './PinnedSlot'
import CreateTaskDialog from './CreateTaskDialog'

type PortfolioType = 'PHYSICAL' | 'MENTAL' | 'ECONOMIC'

interface PortfolioConfig {
  type: PortfolioType
  emoji: string
  title: string
  glassClass: string
  iconBg: string
}

const PORTFOLIOS: PortfolioConfig[] = [
  {
    type: 'PHYSICAL',
    emoji: '🏋️',
    title: 'Cartera Física',
    glassClass: 'glass-card--physical',
    iconBg: 'var(--color-physical-soft)',
  },
  {
    type: 'MENTAL',
    emoji: '🧠',
    title: 'Cartera Mental',
    glassClass: 'glass-card--mental',
    iconBg: 'var(--color-mental-soft)',
  },
  {
    type: 'ECONOMIC',
    emoji: '💰',
    title: 'Cartera Económica',
    glassClass: 'glass-card--economic',
    iconBg: 'var(--color-economic-soft)',
  },
]

export default function PortfolioSection() {
  const [tasksByPortfolio, setTasksByPortfolio] = useState<Record<PortfolioType, Task[]>>({
    PHYSICAL: [],
    MENTAL: [],
    ECONOMIC: [],
  })
  const [openAccordions, setOpenAccordions] = useState<Record<PortfolioType, boolean>>({
    PHYSICAL: true,
    MENTAL: true,
    ECONOMIC: true,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogPortfolio, setDialogPortfolio] = useState<PortfolioType>('PHYSICAL')
  const [loading, setLoading] = useState(true)

  // Fetch all tasks grouped by portfolio
  const fetchAllTasks = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks')
      if (!res.ok) return
      const allTasks: Task[] = await res.json()

      const grouped: Record<PortfolioType, Task[]> = {
        PHYSICAL: [],
        MENTAL: [],
        ECONOMIC: [],
      }

      for (const task of allTasks) {
        if (task.status !== 'ARCHIVED' && grouped[task.portfolio]) {
          grouped[task.portfolio].push(task)
        }
      }

      setTasksByPortfolio(grouped)
    } catch (err) {
      console.error('Failed to fetch tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllTasks()
  }, [fetchAllTasks])

  // Toggle accordion
  const toggleAccordion = useCallback((portfolio: PortfolioType) => {
    setOpenAccordions((prev) => ({
      ...prev,
      [portfolio]: !prev[portfolio],
    }))
  }, [])

  // Open create dialog for a specific portfolio
  const openCreateDialog = useCallback((portfolio: PortfolioType) => {
    setDialogPortfolio(portfolio)
    setDialogOpen(true)
  }, [])

  // Handle task creation
  const handleTaskCreated = useCallback(
    (newTask: unknown) => {
      const task = newTask as Task
      setTasksByPortfolio((prev) => ({
        ...prev,
        [task.portfolio]: [...prev[task.portfolio], task],
      }))
    },
    []
  )

  // Handle task update (from checkbox, etc.)
  const handleTaskUpdate = useCallback((updatedTask: Task) => {
    setTasksByPortfolio((prev) => {
      const result = { ...prev }
      for (const portfolio of Object.keys(result) as PortfolioType[]) {
        result[portfolio] = result[portfolio].map((t) =>
          t.id === updatedTask.id ? updatedTask : t
        )
      }
      return result
    })
  }, [])

  // Pin task
  const handlePin = useCallback(
    async (task: Task, portfolio: PortfolioType) => {
      // Unpin any currently pinned task in this portfolio
      const currentPinned = tasksByPortfolio[portfolio].find((t) => t.isPinned)
      if (currentPinned && currentPinned.id !== task.id) {
        await fetch(`/api/tasks/${currentPinned.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPinned: false }),
        })
      }

      // Pin the new task
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: true }),
      })

      if (res.ok) {
        setTasksByPortfolio((prev) => ({
          ...prev,
          [portfolio]: prev[portfolio].map((t) => ({
            ...t,
            isPinned: t.id === task.id ? true : (t.isPinned && t.id === currentPinned?.id ? false : t.isPinned),
          })),
        }))
      }
    },
    [tasksByPortfolio]
  )

  // Unpin task
  const handleUnpin = useCallback(
    async (portfolio: PortfolioType) => {
      const pinned = tasksByPortfolio[portfolio].find((t) => t.isPinned)
      if (!pinned) return

      const res = await fetch(`/api/tasks/${pinned.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: false }),
      })

      if (res.ok) {
        setTasksByPortfolio((prev) => ({
          ...prev,
          [portfolio]: prev[portfolio].map((t) =>
            t.id === pinned.id ? { ...t, isPinned: false } : t
          ),
        }))
      }
    },
    [tasksByPortfolio]
  )

  // Drag & drop between portfolios
  const handleDropOnPortfolio = useCallback(
    async (e: DragEvent<HTMLDivElement>, targetPortfolio: PortfolioType) => {
      e.preventDefault()

      try {
        const data = e.dataTransfer.getData('application/json')
        if (!data) return
        const task: Task = JSON.parse(data)

        // Skip if dropping in same portfolio
        if (task.portfolio === targetPortfolio) return

        const res = await fetch(`/api/tasks/${task.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolio: targetPortfolio, isPinned: false }),
        })

        if (res.ok) {
          const updatedTask = await res.json()
          setTasksByPortfolio((prev) => {
            const result = { ...prev }
            // Remove from source
            result[task.portfolio] = result[task.portfolio].filter((t) => t.id !== task.id)
            // Add to target
            result[targetPortfolio] = [...result[targetPortfolio], updatedTask]
            return result
          })
        }
      } catch {
        // Invalid data
      }
    },
    []
  )

  if (loading) {
    return (
      <section className="section">
        <div className="section__header">
          <h2 className="section__title">Carteras de Inversión</h2>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton"
              style={{ height: 72, borderRadius: 'var(--radius-lg)' }}
            />
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="section">
      <div className="section__header">
        <h2 className="section__title">Carteras de Inversión</h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {PORTFOLIOS.map((portfolio) => {
          const tasks = tasksByPortfolio[portfolio.type]
          const isOpen = openAccordions[portfolio.type]
          const pinnedTask = tasks.find((t) => t.isPinned) || null
          const unpinnedTasks = tasks.filter((t) => !t.isPinned && t.status !== 'COMPLETED')
          const completedTasks = tasks.filter((t) => t.status === 'COMPLETED')
          const activeCount = tasks.filter((t) => t.status !== 'COMPLETED').length

          return (
            <PortfolioAccordion
              key={portfolio.type}
              config={portfolio}
              isOpen={isOpen}
              activeCount={activeCount}
              pinnedTask={pinnedTask}
              unpinnedTasks={unpinnedTasks}
              completedTasks={completedTasks}
              onToggle={() => toggleAccordion(portfolio.type)}
              onCreateClick={() => openCreateDialog(portfolio.type)}
              onTaskUpdate={handleTaskUpdate}
              onPin={(task) => handlePin(task, portfolio.type)}
              onUnpin={() => handleUnpin(portfolio.type)}
              onDropOnPortfolio={(e) => handleDropOnPortfolio(e, portfolio.type)}
            />
          )
        })}
      </div>

      <CreateTaskDialog
        open={dialogOpen}
        portfolio={dialogPortfolio}
        onClose={() => setDialogOpen(false)}
        onCreated={handleTaskCreated}
      />
    </section>
  )
}

// --- Internal Accordion component ---

interface PortfolioAccordionProps {
  config: PortfolioConfig
  isOpen: boolean
  activeCount: number
  pinnedTask: Task | null
  unpinnedTasks: Task[]
  completedTasks: Task[]
  onToggle: () => void
  onCreateClick: () => void
  onTaskUpdate: (task: Task) => void
  onPin: (task: Task) => void
  onUnpin: () => void
  onDropOnPortfolio: (e: DragEvent<HTMLDivElement>) => void
}

function PortfolioAccordion({
  config,
  isOpen,
  activeCount,
  pinnedTask,
  unpinnedTasks,
  completedTasks,
  onToggle,
  onCreateClick,
  onTaskUpdate,
  onPin,
  onUnpin,
  onDropOnPortfolio,
}: PortfolioAccordionProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      setIsDragOver(false)
      onDropOnPortfolio(e)
    },
    [onDropOnPortfolio]
  )

  return (
    <div
      className={`accordion ${config.glassClass}`}
      data-open={isOpen}
      style={{
        ...(isDragOver
          ? {
              borderColor: 'rgba(255, 255, 255, 0.2)',
              boxShadow: 'var(--shadow-md)',
            }
          : {}),
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Trigger */}
      <button className="accordion__trigger" onClick={onToggle} aria-expanded={isOpen}>
        <span
          className="accordion__icon"
          style={{ background: config.iconBg }}
        >
          {config.emoji}
        </span>

        <span>{config.title}</span>

        {/* Count badge */}
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 700,
            fontFamily: 'var(--font-data)',
            color: 'var(--text-tertiary)',
            background: 'var(--bg-elevated)',
            borderRadius: 'var(--radius-full)',
            padding: '2px 8px',
            minWidth: 24,
            textAlign: 'center',
          }}
        >
          {activeCount}
        </span>

        <span className="accordion__chevron" aria-hidden="true">
          ▼
        </span>
      </button>

      {/* Content */}
      <div className="accordion__content">
        <div className="accordion__inner">
          {/* Pinned Slot */}
          <PinnedSlot
            pinnedTask={pinnedTask}
            portfolio={config.type}
            onPin={onPin}
            onUnpin={onUnpin}
            onTaskUpdate={onTaskUpdate}
          />

          {/* Task list */}
          <div
            role="list"
            style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}
          >
            {unpinnedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
              />
            ))}

            {/* Completed tasks (dimmed, at bottom) */}
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onUpdate={onTaskUpdate}
                isDraggable={false}
              />
            ))}
          </div>

          {/* Empty state */}
          {unpinnedTasks.length === 0 && completedTasks.length === 0 && !pinnedTask && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-tertiary)',
                fontSize: '0.8125rem',
                padding: 'var(--space-md) 0',
              }}
            >
              Sin tareas aún. ¡Crea tu primera inversión!
            </p>
          )}

          {/* Ghost create button */}
          <button
            className="btn btn--ghost"
            onClick={onCreateClick}
            style={{
              width: '100%',
              marginTop: 'var(--space-md)',
            }}
          >
            + Nueva Tarea
          </button>
        </div>
      </div>
    </div>
  )
}
