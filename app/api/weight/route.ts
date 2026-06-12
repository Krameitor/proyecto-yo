import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/weight?limit=30
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 30

    const logs = await prisma.weightLog.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error('GET /api/weight error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weight logs' },
      { status: 500 }
    )
  }
}

// POST /api/weight
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { weight } = body

    if (weight === undefined || typeof weight !== 'number' || weight <= 0) {
      return NextResponse.json(
        { error: 'weight (positive number in kg) is required' },
        { status: 400 }
      )
    }

    const log = await prisma.weightLog.create({
      data: { weight },
    })

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error('POST /api/weight error:', error)
    return NextResponse.json(
      { error: 'Failed to create weight log' },
      { status: 500 }
    )
  }
}
