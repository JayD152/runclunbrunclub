import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import AdminDashboardClient from '@/components/admin/admin-dashboard-client';

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  // Auto-promote jasondipnarine@gmail.com to admin if not already
  if (user?.email === 'jasondipnarine@gmail.com' && user.role !== 'ADMIN') {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
    });
  } else if (user?.role !== 'ADMIN' && user?.email !== 'jasondipnarine@gmail.com') {
    redirect('/dashboard');
  }

  // Get initial user data
  const [users, stats] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            workouts: true,
            coachRoutines: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.$transaction([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'COACH' } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.workout.count(),
      prisma.coachRoutine.count(),
    ]),
  ]);

  return (
    <AdminDashboardClient
      user={session.user}
      initialUsers={users}
      stats={{
        totalUsers: stats[0],
        totalCoaches: stats[1],
        totalAdmins: stats[2],
        totalWorkouts: stats[3],
        totalRoutines: stats[4],
      }}
    />
  );
}
