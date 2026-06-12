import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/tasks?portfolio=PHYSICAL|MENTAL|ECONOMIC
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const portfolio = searchParams.get('portfolio')

    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        ...(portfolio ? { portfolio } : {}),
      },
      orderBy: [
        { isPinned: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
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
    const { title, description, portfolio, deadline } = body

    if (!title || !portfolio) {
      return NextResponse.json(
        { error: 'title and portfolio are required' },
        { status: 400 }
      )
    }

    const validPortfolios = ['PHYSICAL', 'MENTAL', 'ECONOMIC']
    if (!validPortfolios.includes(portfolio)) {
      return NextResponse.json(
        { error: `portfolio must be one of: ${validPortfolios.join(', ')}` },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        portfolio,
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
