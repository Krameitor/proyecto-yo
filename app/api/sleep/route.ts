import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/sleep?limit=30
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 30

    const logs = await prisma.sleepLog.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('GET /api/sleep error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sleep logs' },
      { status: 500 }
    )
  }
}

// POST /api/sleep
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { totalHours, qualityPercentage, imageUrl } = body

    if (totalHours === undefined || qualityPercentage === undefined) {
      return NextResponse.json(
        { error: 'totalHours and qualityPercentage are required' },
        { status: 400 }
      )
    }

    if (typeof totalHours !== 'number' || totalHours < 0 || totalHours > 24) {
      return NextResponse.json(
        { error: 'totalHours must be a number between 0 and 24' },
        { status: 400 }
      )
    }

    if (
      typeof qualityPercentage !== 'number' ||
      qualityPercentage < 0 ||
      qualityPercentage > 100
    ) {
      return NextResponse.json(
        { error: 'qualityPercentage must be a number between 0 and 100' },
        { status: 400 }
      )
    }

    const log = await prisma.sleepLog.create({
      data: {
        totalHours,
        qualityPercentage,
        imageUrl: imageUrl ?? null,
      },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('POST /api/sleep error:', error)
    return NextResponse.json(
      { error: 'Failed to create sleep log' },
      { status: 500 }
    )
  }
}
