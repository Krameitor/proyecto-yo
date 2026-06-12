import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/earnings?start=ISO&end=ISO
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const start = searchParams.get('start')
    const end = searchParams.get('end')

    const earnings = await prisma.earningsLog.findMany({
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
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(earnings)
  } catch (error) {
    console.error('GET /api/earnings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    )
  }
}

// POST /api/earnings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, source, description } = body

    if (amount === undefined || !source) {
      return NextResponse.json(
        { error: 'amount and source are required' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    const earning = await prisma.earningsLog.create({
      data: {
        amount,
        currency: currency ?? 'EUR',
        source,
        description: description ?? null,
      },
    })

    return NextResponse.json(earning, { status: 201 })
  } catch (error) {
    console.error('POST /api/earnings error:', error)
    return NextResponse.json(
      { error: 'Failed to create earning' },
      { status: 500 }
    )
  }
}
