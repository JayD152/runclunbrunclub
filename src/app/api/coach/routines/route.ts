import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET - Get all routines (public, for workout selection) or coach's routines
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const coachOnly = searchParams.get('coachOnly') === 'true';

    // Get user's role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    // Build query
    const where: any = { isActive: true };
    
    if (category) {
      where.category = category;
    }

    // If coachOnly, only get the current user's routines (if they are a coach)
    if (coachOnly && (user?.role === 'COACH' || user?.role === 'ADMIN')) {
      where.coachId = session.user.id;
    }

    const routines = await prisma.coachRoutine.findMany({
      where,
      include: {
        coach: {
          select: { id: true, name: true, image: true },
        },
        exercises: {
          orderBy: { orderIndex: 'asc' },
        },
        _count: {
          select: { completions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(routines);
  } catch (error) {
    console.error('Error fetching routines:', error);
    return NextResponse.json(
      { error: 'Failed to fetch routines' },
      { status: 500 }
    );
  }
}

// POST - Create a new routine (coach/admin only)
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is coach or admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'COACH' && user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Coach access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, category, exercises } = body;

    if (!name || !category || !exercises || exercises.length === 0) {
      return NextResponse.json(
        { error: 'Name, category, and at least one exercise are required' },
        { status: 400 }
      );
    }

    // Validate category
    if (!['RUNNING', 'STRENGTH', 'WALKING', 'SPORTS'].includes(category)) {
      return NextResponse.json(
        { error: 'Invalid workout category' },
        { status: 400 }
      );
    }

    // Create routine with exercises
    const routine = await prisma.coachRoutine.create({
      data: {
        coachId: session.user.id,
        name,
        description,
        category,
        preWorkoutMessage: body.preWorkoutMessage,
        playlistLink: body.playlistLink,
        exercises: {
          create: exercises.map((ex: any, index: number) => ({
            name: ex.name,
            description: ex.description,
            duration: ex.duration,
            countDirection: ex.countDirection || 'down',
            restAfter: ex.restAfter,
            orderIndex: index,
            sets: ex.sets,
            reps: ex.reps,
            message: ex.message,
          })),
        },
      },
      include: {
        coach: {
          select: { id: true, name: true, image: true },
        },
        exercises: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    return NextResponse.json(routine, { status: 201 });
  } catch (error) {
    console.error('Error creating routine:', error);
    return NextResponse.json(
      { error: 'Failed to create routine' },
      { status: 500 }
    );
  }
}
