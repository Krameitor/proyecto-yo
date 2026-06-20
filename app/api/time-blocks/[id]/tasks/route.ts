import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

// GET /api/time-blocks/[id]/tasks
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id: timeBlockId } = await context.params

    const timeBlock = await prisma.timeBlock.findFirst({
      where: { id: timeBlockId, deletedAt: null },
    })

    if (!timeBlock) {
      return NextResponse.json(
        { error: 'Time block not found' },
        { status: 404 }
      )
    }

    const blockTasks = await prisma.timeBlockTask.findMany({
      where: { timeBlockId, deletedAt: null },
      include: { task: true },
    })

    return NextResponse.json(blockTasks)
  } catch (error) {
    console.error('GET /api/time-blocks/[id]/tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch block tasks' },
      { status: 500 }
    )
  }
}

// POST /api/time-blocks/[id]/tasks — assign a task
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: timeBlockId } = await context.params
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const timeBlock = await prisma.timeBlock.findFirst({
      where: { id: timeBlockId, deletedAt: null },
    })

    if (!timeBlock) {
      return NextResponse.json(
        { error: 'Time block not found' },
        { status: 404 }
      )
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, deletedAt: null },
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check if already assigned (and not soft-deleted)
    const existing = await prisma.timeBlockTask.findFirst({
      where: { timeBlockId, taskId, deletedAt: null },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Task is already assigned to this block' },
        { status: 409 }
      )
    }

    const blockTask = await prisma.timeBlockTask.create({
      data: {
        timeBlockId,
        taskId,
        isOriginal: false,
      },
      include: { task: true },
    })

    return NextResponse.json(blockTask, { status: 201 })
  } catch (error) {
    console.error('POST /api/time-blocks/[id]/tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to assign task' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-blocks/[id]/tasks — unassign a task (soft-delete)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: timeBlockId } = await context.params
    const body = await request.json()
    const { taskId } = body

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 }
      )
    }

    const blockTask = await prisma.timeBlockTask.findFirst({
      where: { timeBlockId, taskId, deletedAt: null },
    })

    if (!blockTask) {
      return NextResponse.json(
        { error: 'Task assignment not found' },
        { status: 404 }
      )
    }

    const updated = await prisma.timeBlockTask.update({
      where: { id: blockTask.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('DELETE /api/time-blocks/[id]/tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to unassign task' },
      { status: 500 }
    )
  }
}
