import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import ActiveWorkoutClient from '@/components/workout/active-workout-client';

export default async function ActiveWorkoutPage({
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
      clubSession: {
        include: {
          host: { select: { id: true, name: true, image: true } },
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          workouts: {
            where: { status: 'IN_PROGRESS' },
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
        },
      },
    },
  });

  if (!workout) {
    notFound();
  }

  // If workout is completed, redirect to summary
  if (workout.status === 'COMPLETED') {
    redirect(`/workout/${params.id}/summary`);
  }

  return (
    <ActiveWorkoutClient 
      workout={workout} 
      clubSession={workout.clubSession}
    />
  );
}
