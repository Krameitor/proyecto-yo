import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tasks?area=PHYSICAL|MENTAL|ECONOMIC
// GET /api/tasks?unassigned=true&date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')
    const unassigned = searchParams.get('unassigned')
    const date = searchParams.get('date')

    // Return tasks not assigned to any time block on a given date
    if (unassigned === 'true' && date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`)
      const dayEnd = new Date(`${date}T23:59:59.999Z`)

      const tasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          status: 'ACTIVE',
          ...(area ? { area } : {}),
          NOT: {
            timeBlocks: {
              some: {
                deletedAt: null,
                startTime: { gte: dayStart },
                endTime: { lte: dayEnd },
              },
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { sortOrder: 'asc' },
          { createdAt: 'desc' },
        ],
        include: {
          timeBlocks: {
            where: { deletedAt: null },
          },
        },
      })

      return NextResponse.json(tasks)
    }

    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        ...(area ? { area } : {}),
      },
      orderBy: [
        { isPinned: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      include: {
        timeBlocks: {
          where: { deletedAt: null },
        },
      },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('GET /api/tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, area, deadline } = body

    if (!title || !area) {
      return NextResponse.json(
        { error: 'title and area are required' },
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

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        area,
        deadline: deadline ? new Date(deadline) : null,
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('POST /api/tasks error:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
