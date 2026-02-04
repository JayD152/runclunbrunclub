import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import WorkoutSummaryClient from '@/components/workout/workout-summary-client';

export default async function WorkoutSummaryPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const workout = await prisma.workout.findFirst({
    where: {
      id: params.id,
      userId: session.user.id,
    },
    include: {
      splits: { orderBy: { splitNumber: 'asc' } },
      activities: { orderBy: { timestamp: 'asc' } },
      user: { select: { id: true, name: true, image: true } },
    },
  });

  if (!workout) {
    notFound();
  }

  // Fetch club session info if this workout was part of one
  let clubSession = null;
  if (workout.clubSessionId) {
    const clubSessionData = await prisma.clubSession.findUnique({
      where: { id: workout.clubSessionId },
      include: {
        host: { select: { id: true, name: true, image: true } },
        members: { where: { leftAt: null } },
      },
    });
    if (clubSessionData) {
      clubSession = {
        id: clubSessionData.id,
        name: clubSessionData.name,
        host: clubSessionData.host,
        memberCount: clubSessionData.members.length,
      };
    }
  }

  // Get user's streak for display
  const streak = await prisma.streak.findUnique({
    where: { userId: session.user.id },
  });

  return <WorkoutSummaryClient workout={workout} streak={streak} clubSession={clubSession} />;
}
