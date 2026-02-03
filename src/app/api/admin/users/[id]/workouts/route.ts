import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Fetch user's workout history (admin only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const adminUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (adminUser?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's workouts with details
    const workouts = await prisma.workout.findMany({
      where: { userId: params.id },
      orderBy: { startTime: 'desc' },
      include: {
        splits: {
          orderBy: { splitNumber: 'asc' },
        },
        activities: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    // Calculate summary stats
    const stats = {
      totalWorkouts: workouts.length,
      completedWorkouts: workouts.filter(w => w.status === 'COMPLETED').length,
      totalDuration: workouts.reduce((sum, w) => sum + (w.totalDuration || 0), 0),
      totalDistance: workouts.reduce((sum, w) => sum + (w.distance || 0), 0),
      totalCalories: workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
      categoryCounts: workouts.reduce((acc, w) => {
        acc[w.category] = (acc[w.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return NextResponse.json({
      user: targetUser,
      workouts,
      stats,
    });
  } catch (error) {
    console.error('Error fetching user workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user workouts' },
      { status: 500 }
    );
  }
}
