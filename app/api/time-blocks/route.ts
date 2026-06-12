import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/time-blocks?start=ISO&end=ISO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const timeBlocks = await prisma.timeBlock.findMany({
      where: {
        deletedAt: null,
        ...(start && end
          ? {
              startTime: { gte: new Date(start) },
              endTime: { lte: new Date(end) },
            }
          : {}),
      },
      include: {
        tasks: {
          where: { deletedAt: null },
          include: {
            task: {
              select: { id: true, title: true, portfolio: true, status: true },
            },
          },
        },
        allocations: {
          where: { deletedAt: null },
        },
        moodCheckin: {
          select: {
            id: true,
            mood: true,
            energyLevel: true,
            satisfactionLevel: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    })

    return NextResponse.json(timeBlocks)
  } catch (error) {
    console.error('GET /api/time-blocks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch time blocks' },
      { status: 500 }
    )
  }
}

// POST /api/time-blocks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, startTime, endTime, taskIds } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'title, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const start = new Date(startTime)
    const end = new Date(endTime)
    const totalMinutes = Math.round((end.getTime() - start.getTime()) / 60000)

    if (totalMinutes <= 0) {
      return NextResponse.json(
        { error: 'endTime must be after startTime' },
        { status: 400 }
      )
    }

    const timeBlock = await prisma.timeBlock.create({
      data: {
        title,
        startTime: start,
        endTime: end,
        totalMinutes,
        tasks: {
          create:
            taskIds?.map((taskId: string) => ({
              taskId,
              isOriginal: true,
            })) ?? [],
        },
      },
      include: {
        tasks: {
          where: { deletedAt: null },
          include: {
            task: {
              select: { id: true, title: true, portfolio: true },
            },
          },
        },
      },
    })

    return NextResponse.json(timeBlock, { status: 201 })
  } catch (error) {
    console.error('POST /api/time-blocks error:', error)
    return NextResponse.json(
      { error: 'Failed to create time block' },
      { status: 500 }
    )
  }
}
