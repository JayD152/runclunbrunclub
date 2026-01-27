'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Copy,
  Crown,
  Users,
  LogOut,
  X,
  Play,
  Timer,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ClubSessionData, WorkoutData, WORKOUT_CATEGORIES } from '@/types/workout';
import { formatDuration, cn } from '@/lib/utils';

interface ClubSessionClientProps {
  user: {
    id: string;
    name?: string | null;
  };
  clubSession: ClubSessionData;
  userWorkout: WorkoutData | null;
}

export default function ClubSessionClient({
  user,
  clubSession,
  userWorkout,
}: ClubSessionClientProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const isHost = clubSession.hostId === user.id;

  // Auto-refresh for real-time updates
  useEffect(() => {
    if (!clubSession.isActive) return;

    const interval = setInterval(() => {
      router.refresh();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [clubSession.isActive, router]);

  const copyCode = () => {
    navigator.clipboard.writeText(clubSession.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEndSession = async () => {
    try {
      await fetch(`/api/club/${clubSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: false }),
      });
      router.push('/club');
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const handleLeaveSession = async () => {
    try {
      await fetch(`/api/club/${clubSession.id}`, {
        method: 'DELETE',
      });
      router.push('/club');
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const handleStartWorkout = () => {
    router.push(`/workout/new?clubSession=${clubSession.id}`);
  };

  // Separate active and completed workouts
  const activeWorkouts = clubSession.workouts?.filter(
    (w) => w.status === 'IN_PROGRESS'
  ) || [];
  const completedWorkouts = clubSession.workouts?.filter(
    (w) => w.status === 'COMPLETED'
  ) || [];

  return (
    <div className="min-h-screen bg-dark-900 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/club" className="text-dark-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                {clubSession.name || 'Club Session'}
                {clubSession.isActive && (
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )}
              </h1>
              <p className="text-sm text-dark-400">
                {clubSession.members?.length || 0} member
                {(clubSession.members?.length || 0) !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          {clubSession.isActive && (
            <button
              onClick={() =>
                isHost ? setShowEndConfirm(true) : handleLeaveSession()
              }
              className="btn-ghost text-red-400"
            >
              {isHost ? <X className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
            </button>
          )}
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Session Code */}
        {clubSession.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30 p-4"
          >
            <p className="text-sm text-dark-400 mb-2">Share this code:</p>
            <div className="flex items-center gap-3">
              <span className="text-3xl font-mono font-bold text-white tracking-widest flex-1">
                {clubSession.code}
              </span>
              <button
                onClick={copyCode}
                className="btn-secondary p-3"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </motion.div>
        )}

        {/* Start Workout Button */}
        {clubSession.isActive && !userWorkout && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartWorkout}
            className="w-full card bg-gradient-to-r from-primary-600 to-accent-600 border-0 p-6 flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6 text-white" />
            <span className="text-lg font-semibold text-white">
              Start Your Workout
            </span>
          </motion.button>
        )}

        {/* Continue Workout Button */}
        {userWorkout && (
          <Link href={`/workout/${userWorkout.id}`}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card bg-gradient-to-r from-green-600 to-emerald-600 border-0 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Timer className="w-6 h-6 text-white" />
                  <div>
                    <p className="font-semibold text-white">Workout in Progress</p>
                    <p className="text-sm text-white/80">Tap to continue</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        )}

        {/* Members */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">MEMBERS</h2>
          <div className="flex flex-wrap gap-3">
            {clubSession.members?.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-2 bg-dark-800 rounded-full px-3 py-2"
              >
                {member.user?.image ? (
                  <Image
                    src={member.user.image}
                    alt={member.user.name || ''}
                    width={24}
                    height={24}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary-500 flex items-center justify-center text-xs text-white">
                    {member.user?.name?.[0] || '?'}
                  </div>
                )}
                <span className="text-sm text-white">
                  {member.user?.name?.split(' ')[0] || 'Unknown'}
                </span>
                {member.userId === clubSession.hostId && (
                  <Crown className="w-3 h-3 text-yellow-400" />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Active Workouts */}
        {activeWorkouts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-dark-400 mb-3">
              WORKING OUT NOW
            </h2>
            <div className="space-y-3">
              {activeWorkouts.map((workout) => (
                <WorkoutStatusCard
                  key={workout.id}
                  workout={workout}
                  isCurrentUser={workout.userId === user.id}
                />
              ))}
            </div>
          </section>
        )}

        {/* Completed Workouts */}
        {completedWorkouts.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-dark-400 mb-3">
              COMPLETED
            </h2>
            <div className="space-y-3">
              {completedWorkouts.map((workout) => (
                <CompletedWorkoutCard
                  key={workout.id}
                  workout={workout}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!clubSession.workouts || clubSession.workouts.length === 0) && (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400">No workouts yet</p>
            <p className="text-sm text-dark-500 mt-1">
              Be the first to start working out!
            </p>
          </div>
        )}
      </main>

      {/* End Session Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowEndConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-2">End Session?</h2>
              <p className="text-dark-400 mb-6">
                This will end the session for all members. This action cannot be
                undone.
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleEndSession}
                  className="btn-danger w-full py-3"
                >
                  End Session
                </button>
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="btn-secondary w-full py-3"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function WorkoutStatusCard({
  workout,
  isCurrentUser,
}: {
  workout: WorkoutData;
  isCurrentUser: boolean;
}) {
  const category = WORKOUT_CATEGORIES[workout.category];
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(workout.startTime).getTime();
    const updateElapsed = () => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [workout.startTime]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'card p-4',
        isCurrentUser && 'ring-2 ring-primary-500/50'
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {workout.user?.image ? (
            <Image
              src={workout.user.image}
              alt={workout.user.name || ''}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
              {workout.user?.name?.[0] || '?'}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">
              {isCurrentUser ? 'You' : workout.user?.name?.split(' ')[0]}
            </p>
            <p className="text-sm text-dark-400 flex items-center gap-1">
              <span>{category.icon}</span>
              {category.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono text-white">{formatDuration(elapsed)}</p>
          <div className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Active
          </div>
        </div>
      </div>

      {/* Recent activity */}
      {workout.activities && workout.activities.length > 0 && (
        <div className="mt-3 pt-3 border-t border-dark-700">
          <p className="text-xs text-dark-500">
            Last: {workout.activities[0].name}
            {workout.activities[0].sets && workout.activities[0].reps && (
              <span className="ml-1">
                ({workout.activities[0].sets}×{workout.activities[0].reps})
              </span>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}

function CompletedWorkoutCard({ workout }: { workout: WorkoutData }) {
  const category = WORKOUT_CATEGORIES[workout.category];

  return (
    <div className="card p-4 opacity-80">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {workout.user?.image ? (
            <Image
              src={workout.user.image}
              alt={workout.user.name || ''}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center text-white">
              {workout.user?.name?.[0] || '?'}
            </div>
          )}
          <div>
            <p className="font-semibold text-white">
              {workout.user?.name?.split(' ')[0]}
            </p>
            <p className="text-sm text-dark-400 flex items-center gap-1">
              <span>{category.icon}</span>
              {category.name}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-mono text-dark-300">
            {workout.totalDuration ? formatDuration(workout.totalDuration) : '--:--'}
          </p>
          <p className="text-xs text-dark-500">
            {formatDistanceToNow(new Date(workout.endTime || workout.startTime), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
