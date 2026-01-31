import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getWeekBounds } from '@/lib/utils';
import DashboardClient from '@/components/dashboard/dashboard-client';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch user with role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, image: true, role: true },
  });

  if (!user) {
    redirect('/auth/signin');
  }

  // Fetch user's streak
  let streak = await prisma.streak.findUnique({
    where: { userId: session.user.id },
  });

  if (!streak) {
    streak = await prisma.streak.create({
      data: { userId: session.user.id },
    });
  }

  // Get current week's stats
  const { start, end } = getWeekBounds();
  let weeklyStats = await prisma.weeklyStat.findFirst({
    where: {
      userId: session.user.id,
      weekStart: start,
    },
  });

  if (!weeklyStats) {
    weeklyStats = await prisma.weeklyStat.create({
      data: {
        userId: session.user.id,
        weekStart: start,
        weekEnd: end,
      },
    });
  }

  // Get recent workouts
  const recentWorkouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
    },
    orderBy: { startTime: 'desc' },
    take: 5,
    include: {
      splits: true,
      activities: true,
    },
  });

  // Check for active workout
  const activeWorkout = await prisma.workout.findFirst({
    where: {
      userId: session.user.id,
      status: 'IN_PROGRESS',
    },
  });

  // Check for active club session membership
  const activeClubMembership = await prisma.clubMember.findFirst({
    where: {
      userId: session.user.id,
      leftAt: null,
      clubSession: {
        isActive: true,
      },
    },
    include: {
      clubSession: {
        include: {
          host: {
            select: { id: true, name: true, image: true },
          },
        },
      },
    },
  });

  return (
    <DashboardClient
      user={user}
      streak={streak}
      weeklyStats={weeklyStats}
      recentWorkouts={recentWorkouts}
      activeWorkout={activeWorkout}
      activeClubSession={activeClubMembership?.clubSession || null}
    />
  );
}
