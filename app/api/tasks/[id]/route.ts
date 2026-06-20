import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

// PATCH /api/tasks/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { title, description, area, status, isPinned, deadline, sortOrder } = body

    // Verify task exists and is not soft-deleted
    const existing = await prisma.task.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(area !== undefined && { area }),
        ...(status !== undefined && { status }),
        ...(isPinned !== undefined && { isPinned }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('PATCH /api/tasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

// DELETE /api/tasks/[id] — soft-delete
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const existing = await prisma.task.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const task = await prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json(task)
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}
