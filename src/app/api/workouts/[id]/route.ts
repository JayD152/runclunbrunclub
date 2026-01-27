import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getWeekBounds } from '@/lib/utils';

// GET - Get specific workout
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workout = await prisma.workout.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        splits: { orderBy: { splitNumber: 'asc' } },
        activities: { orderBy: { timestamp: 'asc' } },
        user: { select: { id: true, name: true, image: true } },
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error fetching workout:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workout' },
      { status: 500 }
    );
  }
}

// PATCH - Update workout (complete, add calories, etc.)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { status, caloriesBurned, caloriesSource, notes, distance, totalDuration } = body;

    const workout = await prisma.workout.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (status === 'COMPLETED' && workout.status === 'IN_PROGRESS') {
      updateData.status = 'COMPLETED';
      updateData.endTime = new Date();
      
      // Calculate total duration if not provided
      if (!totalDuration) {
        updateData.totalDuration = Math.floor(
          (new Date().getTime() - new Date(workout.startTime).getTime()) / 1000
        );
      } else {
        updateData.totalDuration = totalDuration;
      }

      // Calculate pace if distance is available
      if (distance || workout.distance) {
        const dist = distance || workout.distance;
        const dur = updateData.totalDuration / 60; // minutes
        updateData.pace = dur / dist; // min/km
      }
    }

    if (status === 'CANCELLED') {
      updateData.status = 'CANCELLED';
      updateData.endTime = new Date();
    }

    if (caloriesBurned !== undefined) {
      updateData.caloriesBurned = caloriesBurned;
      updateData.caloriesSource = caloriesSource || 'manual';
    }

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (distance !== undefined) {
      updateData.distance = distance;
    }

    const updatedWorkout = await prisma.workout.update({
      where: { id: params.id },
      data: updateData,
      include: {
        splits: true,
        activities: true,
      },
    });

    // Update stats if workout was completed
    if (status === 'COMPLETED') {
      await updateUserStats(session.user.id, updatedWorkout);
    }

    return NextResponse.json(updatedWorkout);
  } catch (error) {
    console.error('Error updating workout:', error);
    return NextResponse.json(
      { error: 'Failed to update workout' },
      { status: 500 }
    );
  }
}

// DELETE - Delete workout
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const workout = await prisma.workout.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    await prisma.workout.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting workout:', error);
    return NextResponse.json(
      { error: 'Failed to delete workout' },
      { status: 500 }
    );
  }
}

// Helper function to update user stats
async function updateUserStats(userId: string, workout: any) {
  const { start, end } = getWeekBounds();

  // Update or create weekly stats
  await prisma.weeklyStat.upsert({
    where: {
      userId_weekStart: {
        userId,
        weekStart: start,
      },
    },
    update: {
      totalWorkouts: { increment: 1 },
      totalDuration: { increment: workout.totalDuration || 0 },
      totalDistance: { increment: workout.distance || 0 },
      totalCalories: { increment: workout.caloriesBurned || 0 },
      ...(workout.category === 'RUNNING' && { runningCount: { increment: 1 } }),
      ...(workout.category === 'STRENGTH' && { strengthCount: { increment: 1 } }),
      ...(workout.category === 'WALKING' && { walkingCount: { increment: 1 } }),
      ...(workout.category === 'SPORTS' && { sportsCount: { increment: 1 } }),
    },
    create: {
      userId,
      weekStart: start,
      weekEnd: end,
      totalWorkouts: 1,
      totalDuration: workout.totalDuration || 0,
      totalDistance: workout.distance || 0,
      totalCalories: workout.caloriesBurned || 0,
      runningCount: workout.category === 'RUNNING' ? 1 : 0,
      strengthCount: workout.category === 'STRENGTH' ? 1 : 0,
      walkingCount: workout.category === 'WALKING' ? 1 : 0,
      sportsCount: workout.category === 'SPORTS' ? 1 : 0,
    },
  });

  // Update streak
  const streak = await prisma.streak.findUnique({
    where: { userId },
  });

  if (streak) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastWorkoutDate = streak.lastWorkoutAt
      ? new Date(streak.lastWorkoutAt)
      : null;

    if (lastWorkoutDate) {
      lastWorkoutDate.setHours(0, 0, 0, 0);
    }

    let newStreak = streak.currentStreak;

    if (!lastWorkoutDate) {
      // First workout
      newStreak = 1;
    } else {
      const diffDays = Math.floor(
        (today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays === 0) {
        // Same day, no change
      } else if (diffDays === 1) {
        // Consecutive day
        newStreak = streak.currentStreak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }

    await prisma.streak.update({
      where: { userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastWorkoutAt: new Date(),
      },
    });
  }
}
