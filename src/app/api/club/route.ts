import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateSessionCode } from '@/lib/utils';

// GET - List user's club sessions
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get sessions user has hosted or joined
    const hostedSessions = await prisma.clubSession.findMany({
      where: { hostId: session.user.id },
      orderBy: { startTime: 'desc' },
      take: 10,
      include: {
        host: { select: { id: true, name: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        workouts: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
      },
    });

    const joinedSessions = await prisma.clubMember.findMany({
      where: {
        userId: session.user.id,
        clubSession: {
          hostId: { not: session.user.id },
        },
      },
      orderBy: { joinedAt: 'desc' },
      take: 10,
      include: {
        clubSession: {
          include: {
            host: { select: { id: true, name: true, image: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
            workouts: {
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      hosted: hostedSessions,
      joined: joinedSessions.map((m) => m.clubSession),
    });
  } catch (error) {
    console.error('Error fetching club sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club sessions' },
      { status: 500 }
    );
  }
}

// POST - Create new club session
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    // Check if user already has an active session
    const activeSession = await prisma.clubSession.findFirst({
      where: {
        hostId: session.user.id,
        isActive: true,
      },
    });

    if (activeSession) {
      return NextResponse.json(
        { error: 'You already have an active club session' },
        { status: 400 }
      );
    }

    // Generate unique code
    let code = generateSessionCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.clubSession.findFirst({
        where: { code, isActive: true },
      });
      if (!existing) break;
      code = generateSessionCode();
      attempts++;
    }

    const clubSession = await prisma.clubSession.create({
      data: {
        hostId: session.user.id,
        code,
        name: name || null,
      },
      include: {
        host: { select: { id: true, name: true, image: true } },
      },
    });

    // Automatically add host as member
    await prisma.clubMember.create({
      data: {
        userId: session.user.id,
        clubSessionId: clubSession.id,
      },
    });

    return NextResponse.json(clubSession);
  } catch (error) {
    console.error('Error creating club session:', error);
    return NextResponse.json(
      { error: 'Failed to create club session' },
      { status: 500 }
    );
  }
}
