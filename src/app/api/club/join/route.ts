import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// POST - Join club session by code
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Session code is required' },
        { status: 400 }
      );
    }

    const clubSession = await prisma.clubSession.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
      },
    });

    if (!clubSession) {
      return NextResponse.json(
        { error: 'Invalid or expired session code' },
        { status: 404 }
      );
    }

    // Check if already a member
    const existingMember = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubSessionId: clubSession.id,
        leftAt: null,
      },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: 'You are already in this session', sessionId: clubSession.id },
        { status: 400 }
      );
    }

    // Add as member
    await prisma.clubMember.create({
      data: {
        userId: session.user.id,
        clubSessionId: clubSession.id,
      },
    });

    return NextResponse.json({ sessionId: clubSession.id });
  } catch (error) {
    console.error('Error joining club session:', error);
    return NextResponse.json(
      { error: 'Failed to join club session' },
      { status: 500 }
    );
  }
}
