import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ClubPageClient from '@/components/club/club-page-client';

export default async function ClubPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Get user's active club session (if any)
  const activeSession = await prisma.clubSession.findFirst({
    where: {
      OR: [
        { hostId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
              leftAt: null,
            },
          },
        },
      ],
      isActive: true,
    },
    include: {
      host: { select: { id: true, name: true, image: true } },
      members: {
        where: { leftAt: null },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
    },
  });

  // Get past sessions
  const pastSessions = await prisma.clubSession.findMany({
    where: {
      OR: [
        { hostId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
      isActive: false,
    },
    orderBy: { endTime: 'desc' },
    take: 10,
    include: {
      host: { select: { id: true, name: true, image: true } },
      _count: {
        select: { members: true, workouts: true },
      },
    },
  });

  return (
    <ClubPageClient
      user={session.user}
      activeSession={activeSession}
      pastSessions={pastSessions}
    />
  );
}
