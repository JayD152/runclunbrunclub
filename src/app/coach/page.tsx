import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import CoachDashboardClient from '@/components/coach/coach-dashboard-client';

export default async function CoachDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user is coach or admin
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true },
  });

  // Auto-promote jasondipnarine@gmail.com to admin if not already
  if (user?.email === 'jasondipnarine@gmail.com' && user.role === 'USER') {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: 'ADMIN' },
    });
  } else if (user?.role === 'USER') {
    redirect('/dashboard');
  }

  // Get coach's routines with completion stats
  const routines = await prisma.coachRoutine.findMany({
    where: { coachId: session.user.id },
    include: {
      exercises: {
        orderBy: { orderIndex: 'asc' },
      },
      completions: {
        include: {
          user: {
            select: { id: true, name: true, image: true },
          },
        },
        orderBy: { startedAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          completions: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Get stats
  const totalCompletions = await prisma.routineCompletion.count({
    where: {
      routine: { coachId: session.user.id },
    },
  });

  const fullyCompleted = await prisma.routineCompletion.count({
    where: {
      routine: { coachId: session.user.id },
      completed: true,
    },
  });

  return (
    <CoachDashboardClient
      user={session.user}
      userRole={user?.role || 'USER'}
      initialRoutines={routines}
      stats={{
        totalRoutines: routines.length,
        totalCompletions,
        fullyCompleted,
        completionRate: totalCompletions > 0 ? Math.round((fullyCompleted / totalCompletions) * 100) : 0,
      }}
    />
  );
}
