import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Add split to workout
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { distance, duration } = body;

    const workout = await prisma.workout.findFirst({
      where: {
        id: params.id,
        userId: session.user.id,
        status: 'IN_PROGRESS',
      },
      include: { splits: true },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Active workout not found' },
        { status: 404 }
      );
    }

    const splitNumber = workout.splits.length + 1;
    const pace = duration / 60 / distance; // min/km

    const split = await prisma.split.create({
      data: {
        workoutId: params.id,
        splitNumber,
        distance,
        duration,
        pace,
      },
    });

    // Update workout total distance
    const totalDistance = workout.splits.reduce((sum, s) => sum + s.distance, 0) + distance;
    await prisma.workout.update({
      where: { id: params.id },
      data: { distance: totalDistance },
    });

    return NextResponse.json(split);
  } catch (error) {
    console.error('Error adding split:', error);
    return NextResponse.json(
      { error: 'Failed to add split' },
      { status: 500 }
    );
  }
}
