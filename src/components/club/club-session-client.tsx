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
  Flag,
  TrendingUp,
  Send,
  Clock,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { ClubSessionData, WorkoutData, WORKOUT_CATEGORIES, STRUCTURED_WORKOUTS } from '@/types/workout';
import { formatDuration, formatPace, cn } from '@/lib/utils';

// Reaction emojis available
const REACTION_EMOJIS = ['💪', '🔥', '⚡', '👏', '🏃', '❤️', '🎉', '💯'];

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
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [reactionCooldown, setReactionCooldown] = useState(false);
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

  // Send reaction to another user's workout
  const sendReaction = async (toWorkoutId: string, emoji: string) => {
    if (reactionCooldown) return;
    
    try {
      setReactionCooldown(true);
      const res = await fetch('/api/reactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toWorkoutId, emoji }),
      });
      
      if (!res.ok) {
        const error = await res.json();
        console.error('Reaction error:', error);
      }
      
      setShowReactionPicker(null);
      
      // Cooldown for 5 seconds
      setTimeout(() => setReactionCooldown(false), 5000);
    } catch (error) {
      console.error('Error sending reaction:', error);
      setReactionCooldown(false);
    }
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
                  isExpanded={expandedWorkout === workout.id}
                  onToggleExpand={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                  showReactionPicker={showReactionPicker === workout.id}
                  onShowReactionPicker={() => setShowReactionPicker(showReactionPicker === workout.id ? null : workout.id)}
                  onSendReaction={(emoji) => sendReaction(workout.id, emoji)}
                  reactionCooldown={reactionCooldown}
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
  isExpanded,
  onToggleExpand,
  showReactionPicker,
  onShowReactionPicker,
  onSendReaction,
  reactionCooldown,
}: {
  workout: WorkoutData;
  isCurrentUser: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  showReactionPicker: boolean;
  onShowReactionPicker: () => void;
  onSendReaction: (emoji: string) => void;
  reactionCooldown: boolean;
}) {
  const category = WORKOUT_CATEGORIES[workout.category];
  const [elapsed, setElapsed] = useState(0);
  
  // Check for structured workout
  const isStructured = workout.notes?.startsWith('structured:');
  const structuredId = isStructured ? workout.notes?.replace('structured:', '') : null;
  const structuredWorkout = structuredId ? STRUCTURED_WORKOUTS.find(w => w.id === structuredId) : null;
  
  // Time goal info
  const hasGoal = !!workout.goalDuration;
  const timeRemaining = hasGoal ? Math.max(0, workout.goalDuration! - elapsed) : 0;
  const isOvertime = hasGoal && elapsed > workout.goalDuration!;

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
        'card overflow-hidden',
        isCurrentUser && 'ring-2 ring-primary-500/50'
      )}
    >
      {/* Main card content - clickable to expand */}
      <div 
        className="p-4 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workout.user?.image ? (
              <div className="relative">
                <Image
                  src={workout.user.image}
                  alt={workout.user.name || ''}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full"
                />
                {/* Activity type indicator */}
                <span className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-dark-800 flex items-center justify-center text-[10px]',
                  workout.category === 'RUNNING' ? 'bg-blue-500' :
                  workout.category === 'WALKING' ? 'bg-green-500' :
                  workout.category === 'STRENGTH' ? 'bg-orange-500' :
                  'bg-purple-500'
                )}>
                  {category.icon.charAt(0)}
                </span>
              </div>
            ) : (
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                  {workout.user?.name?.[0] || '?'}
                </div>
                <span className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-dark-800',
                  workout.category === 'RUNNING' ? 'bg-blue-500' :
                  workout.category === 'WALKING' ? 'bg-green-500' :
                  workout.category === 'STRENGTH' ? 'bg-orange-500' :
                  'bg-purple-500'
                )} />
              </div>
            )}
            <div>
              <p className="font-semibold text-white">
                {isCurrentUser ? 'You' : workout.user?.name?.split(' ')[0]}
              </p>
              <p className="text-sm text-dark-400 flex items-center gap-1">
                <span>{category.icon}</span>
                {structuredWorkout ? structuredWorkout.name : category.name}
              </p>
            </div>
          </div>
          <div className="text-right">
            {hasGoal ? (
              <div>
                <p className={cn(
                  'text-xl font-mono',
                  isOvertime ? 'text-orange-400' : 'text-green-400'
                )}>
                  {isOvertime ? '+' : ''}{formatDuration(isOvertime ? elapsed - workout.goalDuration! : timeRemaining)}
                </p>
                <p className="text-[10px] text-dark-500 uppercase">
                  {isOvertime ? 'overtime' : 'remaining'}
                </p>
              </div>
            ) : (
              <p className="text-xl font-mono text-white">{formatDuration(elapsed)}</p>
            )}
            <div className="flex items-center justify-end gap-1 text-xs text-green-400 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Active
            </div>
          </div>
        </div>

        {/* Quick info bar */}
        <div className="flex items-center gap-4 mt-3 text-xs text-dark-400">
          {(workout.category === 'RUNNING' || workout.category === 'WALKING') && workout.splits && workout.splits.length > 0 && (
            <>
              <span className="flex items-center gap-1">
                <Flag className="w-3 h-3" />
                Lap {workout.splits.length}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatPace(workout.splits[0].pace)}/km
              </span>
            </>
          )}
          {(workout.category === 'STRENGTH' || workout.category === 'SPORTS') && workout.activities && workout.activities.length > 0 && (
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {workout.activities.length} exercise{workout.activities.length !== 1 ? 's' : ''}
            </span>
          )}
          {hasGoal && (
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {formatDuration(workout.goalDuration!)} goal
            </span>
          )}
        </div>
      </div>

      {/* Expanded details section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-dark-700">
              {/* Detailed stats */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-dark-800 rounded-lg p-2">
                  <p className="text-[10px] text-dark-500 uppercase">Total Time</p>
                  <p className="text-lg font-mono text-white">{formatDuration(elapsed)}</p>
                </div>
                {hasGoal && (
                  <div className="bg-dark-800 rounded-lg p-2">
                    <p className="text-[10px] text-dark-500 uppercase">Goal</p>
                    <p className="text-lg font-mono text-white">{formatDuration(workout.goalDuration!)}</p>
                  </div>
                )}
              </div>

              {/* Recent activities/splits */}
              {workout.activities && workout.activities.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-dark-500 mb-2">Recent Activities</p>
                  <div className="space-y-1">
                    {workout.activities.slice(0, 3).map((activity, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-dark-800/50 rounded px-2 py-1">
                        <span className="text-white">{activity.name}</span>
                        <span className="text-dark-400 text-xs">
                          {activity.sets && activity.reps && `${activity.sets}×${activity.reps}`}
                          {activity.weight && ` @ ${activity.weight}kg`}
                          {activity.duration && formatDuration(activity.duration)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {workout.splits && workout.splits.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-dark-500 mb-2">Recent Laps</p>
                  <div className="space-y-1">
                    {workout.splits.slice(0, 3).map((split, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-dark-800/50 rounded px-2 py-1">
                        <span className="text-white">Lap {split.splitNumber}</span>
                        <span className="text-dark-400 text-xs">
                          {formatDuration(split.duration)} • {formatPace(split.pace)}/km
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reaction button (for other users) */}
              {!isCurrentUser && (
                <div className="pt-2 border-t border-dark-700">
                  {showReactionPicker ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {REACTION_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSendReaction(emoji);
                          }}
                          disabled={reactionCooldown}
                          className={cn(
                            'text-lg p-1.5 rounded hover:bg-dark-600 transition-colors',
                            reactionCooldown && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onShowReactionPicker();
                        }}
                        className="text-xs text-dark-500 ml-2"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowReactionPicker();
                      }}
                      disabled={reactionCooldown}
                      className={cn(
                        'flex items-center gap-2 text-sm text-dark-400 hover:text-primary-400 transition-colors',
                        reactionCooldown && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Send className="w-4 h-4" />
                      {reactionCooldown ? 'Wait 5s...' : 'Send a cheer!'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
