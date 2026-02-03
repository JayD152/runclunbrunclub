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

  // Calculate actual calories from this week's workouts (more accurate than cached stats)
  const thisWeekWorkouts = await prisma.workout.aggregate({
    where: {
      userId: session.user.id,
      status: 'COMPLETED',
      startTime: {
        gte: start,
        lte: end,
      },
    },
    _sum: {
      caloriesBurned: true,
    },
  });

  // Use actual calculated calories instead of cached value
  const actualWeeklyCalories = thisWeekWorkouts._sum.caloriesBurned || 0;
  
  // Create updated weeklyStats with actual calories
  const weeklyStatsWithCalories = {
    ...weeklyStats,
    totalCalories: actualWeeklyCalories,
  };

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
      weeklyStats={weeklyStatsWithCalories}
      recentWorkouts={recentWorkouts}
      activeWorkout={activeWorkout}
      activeClubSession={activeClubMembership?.clubSession || null}
    />
  );
}
