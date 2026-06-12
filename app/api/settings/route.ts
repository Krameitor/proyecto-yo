import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings
export async function GET() {
  try {
    // Upsert to ensure settings record always exists
    const settings = await prisma.userSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        sleepGoalHours: 8,
        weeklyBudgetHours: 168,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('GET /api/settings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      currentWeight,
      targetWeight,
      dailyCalorieGoal,
      sleepGoalHours,
      weeklyBudgetHours,
    } = body

    const settings = await prisma.userSettings.upsert({
      where: { id: 'default' },
      create: {
        id: 'default',
        currentWeight: currentWeight ?? null,
        targetWeight: targetWeight ?? null,
        dailyCalorieGoal: dailyCalorieGoal ?? null,
        sleepGoalHours: sleepGoalHours ?? 8,
        weeklyBudgetHours: weeklyBudgetHours ?? 168,
      },
      update: {
        ...(currentWeight !== undefined && { currentWeight }),
        ...(targetWeight !== undefined && { targetWeight }),
        ...(dailyCalorieGoal !== undefined && { dailyCalorieGoal }),
        ...(sleepGoalHours !== undefined && { sleepGoalHours }),
        ...(weeklyBudgetHours !== undefined && { weeklyBudgetHours }),
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('PATCH /api/settings error:', error)
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    )
  }
}
