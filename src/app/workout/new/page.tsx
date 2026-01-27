import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
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

  return <NewWorkoutClient clubSessionId={searchParams.clubSession} />;
}
