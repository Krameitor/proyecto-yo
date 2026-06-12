import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/meals?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    let dateFilter = {}
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`)
      const dayEnd = new Date(`${date}T23:59:59.999Z`)
      dateFilter = {
        createdAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      }
    }

    const meals = await prisma.mealLog.findMany({
      where: {
        deletedAt: null,
        ...dateFilter,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(meals)
  } catch (error) {
    console.error('GET /api/meals error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meals' },
      { status: 500 }
    )
  }
}

// POST /api/meals
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      description,
      estimatedCalories,
      protein,
      carbs,
      fat,
      mealType,
      photoUrl,
    } = body

    if (!description || !mealType) {
      return NextResponse.json(
        { error: 'description and mealType are required' },
        { status: 400 }
      )
    }

    const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']
    if (!validMealTypes.includes(mealType)) {
      return NextResponse.json(
        { error: `mealType must be one of: ${validMealTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const meal = await prisma.mealLog.create({
      data: {
        description,
        estimatedCalories: estimatedCalories ?? null,
        protein: protein ?? null,
        carbs: carbs ?? null,
        fat: fat ?? null,
        mealType,
        photoUrl: photoUrl ?? null,
      },
    })

    return NextResponse.json(meal, { status: 201 })
  } catch (error) {
    console.error('POST /api/meals error:', error)
    return NextResponse.json(
      { error: 'Failed to create meal' },
      { status: 500 }
    )
  }
}
