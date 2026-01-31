import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ProfilePageClient from '@/components/profile/profile-page-client';

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Get user with stats and role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      streaks: true,
    },
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

  return (
    <ProfilePageClient
      user={user!}
      streak={user?.streaks[0] || null}
      allTimeStats={{
        totalWorkouts: allTimeStats._count,
        totalDuration: allTimeStats._sum.totalDuration || 0,
        totalDistance: allTimeStats._sum.distance || 0,
        totalCalories: allTimeStats._sum.caloriesBurned || 0,
      }}
    />
  );
}
