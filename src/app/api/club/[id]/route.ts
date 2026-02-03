import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Club session auto-end after 30 minutes of inactivity
const CLUB_INACTIVITY_TIMEOUT_MINUTES = 30;

// GET - Get club session details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    let clubSession = await prisma.clubSession.findFirst({
      where: { id: params.id },
      include: {
        host: { select: { id: true, name: true, image: true } },
        members: {
          where: { leftAt: null },
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        workouts: {
          where: { status: 'IN_PROGRESS' },
          include: {
            user: { select: { id: true, name: true, image: true } },
            splits: { orderBy: { splitNumber: 'desc' }, take: 5 },
            activities: { orderBy: { timestamp: 'desc' }, take: 3 },
            reactions: { 
              where: { createdAt: { gte: new Date(Date.now() - 30 * 1000) } },
              include: { fromUser: { select: { id: true, name: true, image: true } } },
              orderBy: { createdAt: 'desc' },
              take: 10,
            },
          },
        },
      },
    });

    if (!clubSession) {
      return NextResponse.json(
        { error: 'Club session not found' },
        { status: 404 }
      );
    }

    // Check for session inactivity and auto-end if needed
    if (clubSession.isActive) {
      // Get the most recent activity in this session
      const latestActivity = await prisma.workout.findFirst({
        where: { clubSessionId: params.id },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true },
      });

      // Determine last activity time (latest workout update, member join, or session start)
      const lastMemberJoin = clubSession.members.reduce((latest, member) => {
        const joinTime = new Date(member.joinedAt).getTime();
        return joinTime > latest ? joinTime : latest;
      }, 0);

      const lastActivityTime = Math.max(
        latestActivity?.updatedAt?.getTime() || 0,
        lastMemberJoin,
        new Date(clubSession.startTime).getTime()
      );

      const minutesSinceActivity = (Date.now() - lastActivityTime) / (1000 * 60);

      // Auto-end session if inactive for too long
      if (minutesSinceActivity >= CLUB_INACTIVITY_TIMEOUT_MINUTES) {
        await prisma.clubSession.update({
          where: { id: params.id },
          data: { isActive: false, endTime: new Date() },
        });

        // Refetch with updated data
        clubSession = await prisma.clubSession.findFirst({
          where: { id: params.id },
          include: {
            host: { select: { id: true, name: true, image: true } },
            members: {
              where: { leftAt: null },
              include: {
                user: { select: { id: true, name: true, image: true } },
              },
            },
            workouts: {
              where: { status: 'IN_PROGRESS' },
              include: {
                user: { select: { id: true, name: true, image: true } },
                splits: { orderBy: { splitNumber: 'desc' }, take: 5 },
                activities: { orderBy: { timestamp: 'desc' }, take: 3 },
                reactions: { 
                  where: { createdAt: { gte: new Date(Date.now() - 30 * 1000) } },
                  include: { fromUser: { select: { id: true, name: true, image: true } } },
                  orderBy: { createdAt: 'desc' },
                  take: 10,
                },
              },
            },
          },
        });
      }
    }

    // Check if user is a member
    const isMember = clubSession!.members.some(
      (m) => m.userId === session.user.id
    );

    if (!isMember) {
      return NextResponse.json(
        { error: 'You are not a member of this session' },
        { status: 403 }
      );
    }

    return NextResponse.json(clubSession);
  } catch (error) {
    console.error('Error fetching club session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch club session' },
      { status: 500 }
    );
  }
}

// PATCH - Update club session (end session)
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
    const { isActive } = body;

    const clubSession = await prisma.clubSession.findFirst({
      where: {
        id: params.id,
        hostId: session.user.id,
      },
    });

    if (!clubSession) {
      return NextResponse.json(
        { error: 'Club session not found or you are not the host' },
        { status: 404 }
      );
    }

    const updatedSession = await prisma.clubSession.update({
      where: { id: params.id },
      data: {
        isActive: isActive ?? false,
        ...(isActive === false && { endTime: new Date() }),
      },
    });

    // Mark all members as left
    if (isActive === false) {
      await prisma.clubMember.updateMany({
        where: {
          clubSessionId: params.id,
          leftAt: null,
        },
        data: { leftAt: new Date() },
      });
    }

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Error updating club session:', error);
    return NextResponse.json(
      { error: 'Failed to update club session' },
      { status: 500 }
    );
  }
}

// DELETE - Leave club session
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const membership = await prisma.clubMember.findFirst({
      where: {
        userId: session.user.id,
        clubSessionId: params.id,
        leftAt: null,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this session' },
        { status: 404 }
      );
    }

    await prisma.clubMember.update({
      where: { id: membership.id },
      data: { leftAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving club session:', error);
    return NextResponse.json(
      { error: 'Failed to leave club session' },
      { status: 500 }
    );
  }
}
