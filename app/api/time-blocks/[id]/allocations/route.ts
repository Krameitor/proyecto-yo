import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

interface AllocationInput {
  taskId: string
  percentage: number
  minutes: number
  type: string // PLANNED | UNPLANNED
}

// POST /api/time-blocks/[id]/allocations
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: timeBlockId } = await context.params
    const body = await request.json()
    const { allocations } = body as { allocations: AllocationInput[] }

    if (!allocations || !Array.isArray(allocations) || allocations.length === 0) {
      return NextResponse.json(
        { error: 'allocations array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Verify time block exists and is not soft-deleted
    const timeBlock = await prisma.timeBlock.findFirst({
      where: { id: timeBlockId, deletedAt: null },
    })

    if (!timeBlock) {
      return NextResponse.json(
        { error: 'Time block not found' },
        { status: 404 }
      )
    }

    // Soft-delete any existing allocations for this block first
    await prisma.timeAllocation.updateMany({
      where: { timeBlockId, deletedAt: null },
      data: { deletedAt: new Date() },
    })

    // Create new allocations
    const created = await prisma.$transaction(
      allocations.map((alloc) =>
        prisma.timeAllocation.create({
          data: {
            timeBlockId,
            taskId: alloc.taskId,
            percentage: alloc.percentage,
            minutes: alloc.minutes,
            type: alloc.type,
          },
        })
      )
    )

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('POST /api/time-blocks/[id]/allocations error:', error)
    return NextResponse.json(
      { error: 'Failed to create allocations' },
      { status: 500 }
    )
  }
}
