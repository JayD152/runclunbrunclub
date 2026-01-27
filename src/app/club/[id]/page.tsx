import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ClubSessionClient from '@/components/club/club-session-client';

export default async function ClubSessionPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const clubSession = await prisma.clubSession.findFirst({
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
        include: {
          user: { select: { id: true, name: true, image: true } },
          splits: { orderBy: { splitNumber: 'desc' }, take: 1 },
          activities: { orderBy: { timestamp: 'desc' }, take: 3 },
        },
        orderBy: { startTime: 'desc' },
      },
    },
  });

  if (!clubSession) {
    notFound();
  }

  // Check if user is a member
  const isMember = clubSession.members.some(
    (m) => m.userId === session.user.id
  );

  if (!isMember && clubSession.isActive) {
    redirect('/club');
  }

  // Get user's active workout in this session
  const userWorkout = await prisma.workout.findFirst({
    where: {
      userId: session.user.id,
      clubSessionId: params.id,
      status: 'IN_PROGRESS',
    },
  });

  return (
    <ClubSessionClient
      user={session.user}
      clubSession={clubSession}
      userWorkout={userWorkout}
    />
  );
}
