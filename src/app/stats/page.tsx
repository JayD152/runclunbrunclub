import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getWeekBounds } from '@/lib/utils';
import StatsPageClient from '@/components/stats/stats-page-client';

export default async function StatsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Get streak
  const streak = await prisma.streak.findUnique({
    where: { userId: session.user.id },
  });

  // Get current week stats
  const { start, end } = getWeekBounds();
  const currentWeekStats = await prisma.weeklyStat.findFirst({
    where: {
      userId: session.user.id,
      weekStart: start,
    },
  });

  // Get last 4 weeks of stats
  const weeklyHistory = await prisma.weeklyStat.findMany({
    where: { userId: session.user.id },
    orderBy: { weekStart: 'desc' },
    take: 4,
  });

  // Get all-time stats
  const allTimeStats = await prisma.workout.aggregate({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
    },
    _count: true,
    _sum: {
      totalDuration: true,
      distance: true,
      caloriesBurned: true,
    },
  });

  // Get workouts by category
  const categoryStats = await prisma.workout.groupBy({
    by: ['category'],
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
    },
    _count: true,
  });

  // Get recent workouts
  const recentWorkouts = await prisma.workout.findMany({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
    },
    orderBy: { startTime: 'desc' },
    take: 20,
    include: {
      splits: true,
      activities: true,
    },
  });

  return (
    <StatsPageClient
      streak={streak}
      currentWeekStats={currentWeekStats}
      weeklyHistory={weeklyHistory}
      allTimeStats={{
        totalWorkouts: allTimeStats._count,
        totalDuration: allTimeStats._sum.totalDuration || 0,
        totalDistance: allTimeStats._sum.distance || 0,
        totalCalories: allTimeStats._sum.caloriesBurned || 0,
      }}
      categoryStats={categoryStats}
      recentWorkouts={recentWorkouts}
    />
  );
}
