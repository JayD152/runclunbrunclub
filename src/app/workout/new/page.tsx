import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import NewWorkoutClient from '@/components/workout/new-workout-client';

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: { clubSession?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Fetch active coach routines
  const coachRoutines = await prisma.coachRoutine.findMany({
    where: { isActive: true },
    include: {
      coach: {
        select: { id: true, name: true, image: true },
      },
      exercises: {
        orderBy: { orderIndex: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <NewWorkoutClient 
      clubSessionId={searchParams.clubSession} 
      coachRoutines={coachRoutines}
    />
  );
}
