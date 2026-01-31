import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Record routine completion/start
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { workoutId, completed, exercisesCompleted } = body;

    // Check routine exists
    const routine = await prisma.coachRoutine.findUnique({
      where: { id: params.id },
      include: { exercises: true },
    });

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      );
    }

    // Create completion record
    const completion = await prisma.routineCompletion.create({
      data: {
        routineId: params.id,
        userId: session.user.id,
        workoutId,
        completed: completed || false,
        exercisesCompleted: exercisesCompleted || 0,
        completedAt: completed ? new Date() : null,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
        routine: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    console.error('Error recording completion:', error);
    return NextResponse.json(
      { error: 'Failed to record completion' },
      { status: 500 }
    );
  }
}

// PATCH - Update completion (mark as complete, update exercises completed)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { completionId, workoutId, completed, exercisesCompleted } = body;

    if (!completionId && !workoutId) {
      return NextResponse.json(
        { error: 'Completion ID or Workout ID required' },
        { status: 400 }
      );
    }

    // Find completion by completionId or by workoutId
    let existingCompletion;
    if (completionId) {
      existingCompletion = await prisma.routineCompletion.findUnique({
        where: { id: completionId },
      });
    } else if (workoutId) {
      existingCompletion = await prisma.routineCompletion.findFirst({
        where: { 
          workoutId,
          routineId: params.id,
          userId: session.user.id,
        },
      });
    }

    if (!existingCompletion) {
      return NextResponse.json(
        { error: 'Completion record not found' },
        { status: 404 }
      );
    }

    if (existingCompletion.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    const updateData: any = {};
    if (completed !== undefined) {
      updateData.completed = completed;
      if (completed) {
        updateData.completedAt = new Date();
      }
    }
    if (exercisesCompleted !== undefined) {
      updateData.exercisesCompleted = exercisesCompleted;
    }

    const updatedCompletion = await prisma.routineCompletion.update({
      where: { id: existingCompletion.id },
      data: updateData,
    });

    return NextResponse.json(updatedCompletion);
  } catch (error) {
    console.error('Error updating completion:', error);
    return NextResponse.json(
      { error: 'Failed to update completion' },
      { status: 500 }
    );
  }
}
