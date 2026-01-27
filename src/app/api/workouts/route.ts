import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - List user's workouts
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = parseInt(searchParams.get('offset') || '0');
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;

  try {
    const workouts = await prisma.workout.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status: status as any }),
        ...(category && { category: category as any }),
      },
      orderBy: { startTime: 'desc' },
      take: limit,
      skip: offset,
      include: {
        splits: true,
        activities: true,
      },
    });

    return NextResponse.json(workouts);
  } catch (error) {
    console.error('Error fetching workouts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workouts' },
      { status: 500 }
    );
  }
}

// POST - Create new workout
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { category, goalDuration, goalDistance, clubSessionId } = body;

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      );
    }

    // Check if user has an active workout
    const activeWorkout = await prisma.workout.findFirst({
      where: {
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
    });

    if (activeWorkout) {
      return NextResponse.json(
        { error: 'You already have an active workout' },
        { status: 400 }
      );
    }

    const workout = await prisma.workout.create({
      data: {
        userId: session.user.id,
        category,
        goalDuration: goalDuration || null,
        goalDistance: goalDistance || null,
        clubSessionId: clubSessionId || null,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error('Error creating workout:', error);
    return NextResponse.json(
      { error: 'Failed to create workout' },
      { status: 500 }
    );
  }
}
