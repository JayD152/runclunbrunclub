import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Get a single routine with details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const routine = await prisma.coachRoutine.findUnique({
      where: { id: params.id },
      include: {
        coach: {
          select: { id: true, name: true, image: true },
        },
        exercises: {
          orderBy: { orderIndex: 'asc' },
        },
        completions: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
          orderBy: { startedAt: 'desc' },
          take: 50,
        },
        _count: {
          select: { completions: true },
        },
      },
    });

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(routine);
  } catch (error) {
    console.error('Error fetching routine:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routine' },
      { status: 500 }
    );
  }
}

// PATCH - Update a routine (owner or admin only)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check ownership or admin
    const [routine, user] = await Promise.all([
      prisma.coachRoutine.findUnique({
        where: { id: params.id },
        select: { coachId: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }),
    ]);

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      );
    }

    if (routine.coachId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to edit this routine' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, description, category, isActive, exercises } = body;

    // Update routine
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (isActive !== undefined) updateData.isActive = isActive;

    // If exercises provided, delete old ones and create new
    if (exercises && Array.isArray(exercises)) {
      await prisma.routineExercise.deleteMany({
        where: { routineId: params.id },
      });

      await prisma.routineExercise.createMany({
        data: exercises.map((ex: any, index: number) => ({
          routineId: params.id,
          name: ex.name,
          description: ex.description,
          duration: ex.duration,
          countDirection: ex.countDirection || 'down',
          restAfter: ex.restAfter,
          orderIndex: index,
          sets: ex.sets,
          reps: ex.reps,
        })),
      });
    }

    const updatedRoutine = await prisma.coachRoutine.update({
      where: { id: params.id },
      data: updateData,
      include: {
        coach: {
          select: { id: true, name: true, image: true },
        },
        exercises: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json(updatedRoutine);
  } catch (error) {
    console.error('Error updating routine:', error);
    return NextResponse.json(
      { error: 'Failed to update routine' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a routine (owner or admin only)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check ownership or admin
    const [routine, user] = await Promise.all([
      prisma.coachRoutine.findUnique({
        where: { id: params.id },
        select: { coachId: true },
      }),
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true },
      }),
    ]);

    if (!routine) {
      return NextResponse.json(
        { error: 'Routine not found' },
        { status: 404 }
      );
    }

    if (routine.coachId !== session.user.id && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Not authorized to delete this routine' },
        { status: 403 }
      );
    }

    await prisma.coachRoutine.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting routine:', error);
    return NextResponse.json(
      { error: 'Failed to delete routine' },
      { status: 500 }
    );
  }
}
