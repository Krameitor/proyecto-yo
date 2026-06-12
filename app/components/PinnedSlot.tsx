'use client'

import { useState, useCallback, type DragEvent } from 'react'
import TaskCard, { type Task } from './TaskCard'

interface PinnedSlotProps {
  pinnedTask: Task | null
  portfolio: string
  onPin: (task: Task) => void
  onUnpin: () => void
  onTaskUpdate: (task: Task) => void
}

export default function PinnedSlot({
  pinnedTask,
  portfolio,
  onPin,
  onUnpin,
  onTaskUpdate,
}: PinnedSlotProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    // Only set false if we're leaving the slot itself, not entering a child
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragOver(false)

      try {
        const data = e.dataTransfer.getData('application/json')
        if (!data) return
        const task: Task = JSON.parse(data)

        // Only accept tasks from the same portfolio
        if (task.portfolio !== portfolio) return

        onPin(task)
      } catch {
        // Invalid data, ignore
      }
    },
    [portfolio, onPin]
  )

  const handleUnpinClick = useCallback(() => {
    onUnpin()
  }, [onUnpin])

  const slotClasses = [
    'pinned-slot',
    pinnedTask ? 'pinned-slot--filled' : 'pinned-slot--empty',
    isDragOver ? 'drag-over' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={slotClasses}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="region"
      aria-label={`Misión Principal — ${portfolio}`}
    >
      {pinnedTask ? (
        <div
          onClick={handleUnpinClick}
          style={{ width: '100%', cursor: 'pointer' }}
          title="Click para desanclar"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleUnpinClick() }}
        >
          <TaskCard
            task={pinnedTask}
            onUpdate={onTaskUpdate}
            isDraggable={false}
            isHighlighted
          />
        </div>
      ) : null}
      {/* Empty state is handled by .pinned-slot--empty::before in CSS */}
    </div>
  )
}
