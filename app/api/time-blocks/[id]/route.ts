import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

// PATCH /api/time-blocks/[id]
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { taskId, status, startTime, endTime, notes } = body

    const existing = await prisma.timeBlock.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Time block not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {}

    if (taskId !== undefined) updateData.taskId = taskId
    if (status !== undefined) updateData.status = status
    if (startTime !== undefined) updateData.startTime = new Date(startTime)
    if (endTime !== undefined) updateData.endTime = new Date(endTime)
    if (notes !== undefined) updateData.notes = notes

    // Recalculate totalMinutes if times changed
    if (startTime !== undefined || endTime !== undefined) {
      const newStart = startTime
        ? new Date(startTime)
        : existing.startTime
      const newEnd = endTime ? new Date(endTime) : existing.endTime
      updateData.totalMinutes = Math.round(
        (newEnd.getTime() - newStart.getTime()) / 60000
      )
    }

    const timeBlock = await prisma.timeBlock.update({
      where: { id },
      data: updateData,
      include: {
        task: true,
      },
    })

    return NextResponse.json(timeBlock)
  } catch (error) {
    console.error('PATCH /api/time-blocks/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to update time block' },
      { status: 500 }
    )
  }
}

// DELETE /api/time-blocks/[id] — soft-delete
export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const existing = await prisma.timeBlock.findFirst({
      where: { id, deletedAt: null },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Time block not found' },
        { status: 404 }
      )
    }

    const timeBlock = await prisma.timeBlock.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json(timeBlock)
  } catch (error) {
    console.error('DELETE /api/time-blocks/[id] error:', error)
    return NextResponse.json(
      { error: 'Failed to delete time block' },
      { status: 500 }
    )
  }
}
