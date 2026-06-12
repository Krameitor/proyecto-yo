import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/mood?start=ISO&end=ISO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const checkins = await prisma.moodCheckin.findMany({
      where: {
        deletedAt: null,
        ...(start && end
          ? {
              createdAt: {
                gte: new Date(start),
                lte: new Date(end),
              },
            }
          : {}),
      },
      include: {
        timeBlock: {
          select: { id: true, title: true, startTime: true, endTime: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(checkins)
  } catch (error) {
    console.error('GET /api/mood error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch mood check-ins' },
      { status: 500 }
    )
  }
}

// POST /api/mood
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mood, energyLevel, satisfactionLevel, timeBlockId } = body

    if (mood === undefined || energyLevel === undefined || satisfactionLevel === undefined) {
      return NextResponse.json(
        { error: 'mood, energyLevel, and satisfactionLevel are required' },
        { status: 400 }
      )
    }

    if (mood < 1 || mood > 5) {
      return NextResponse.json(
        { error: 'mood must be between 1 and 5' },
        { status: 400 }
      )
    }

    if (energyLevel < 1 || energyLevel > 10) {
      return NextResponse.json(
        { error: 'energyLevel must be between 1 and 10' },
        { status: 400 }
      )
    }

    if (satisfactionLevel < 1 || satisfactionLevel > 5) {
      return NextResponse.json(
        { error: 'satisfactionLevel must be between 1 and 5' },
        { status: 400 }
      )
    }

    const checkin = await prisma.moodCheckin.create({
      data: {
        mood,
        energyLevel,
        satisfactionLevel,
        timeBlockId: timeBlockId ?? null,
      },
      include: {
        timeBlock: {
          select: { id: true, title: true },
        },
      },
    })

    return NextResponse.json(checkin, { status: 201 })
  } catch (error) {
    console.error('POST /api/mood error:', error)
    return NextResponse.json(
      { error: 'Failed to create mood check-in' },
      { status: 500 }
    )
  }
}
