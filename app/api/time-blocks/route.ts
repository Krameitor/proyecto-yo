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
            task: true,
          },
        },
        allocations: {
          where: { deletedAt: null },
          include: {
            task: true,
          },
        },
        moodCheckin: true,
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
    const { title, startTime, endTime, area, taskIds } = body

    if (!title || !startTime || !endTime || !area) {
      return NextResponse.json(
        { error: 'title, startTime, endTime, and area are required' },
        { status: 400 }
      )
    }

    const validAreas = ['PHYSICAL', 'MENTAL', 'ECONOMIC']
    if (!validAreas.includes(area)) {
      return NextResponse.json(
        { error: `area must be one of: ${validAreas.join(', ')}` },
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
        area,
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
            task: true,
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
