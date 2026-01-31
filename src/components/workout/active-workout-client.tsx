'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pause,
  Play,
  Square,
  Plus,
  Flag,
  X,
  Check,
  Users,
  Radio,
  ChevronDown,
  ChevronUp,
  SkipForward,
  Send,
  Timer,
  TrendingUp,
  Crown,
} from 'lucide-react';
import { 
  WorkoutData, 
  WORKOUT_CATEGORIES, 
  COMMON_EXERCISES, 
  COMMON_SPORTS, 
  Activity, 
  Split,
  STRUCTURED_WORKOUTS,
  StructuredExercise,
  WORKOUT_INACTIVITY_TIMEOUT_MINUTES,
} from '@/types/workout';
import { formatDuration, formatPace, cn } from '@/lib/utils';

// Reaction emojis available
const REACTION_EMOJIS = ['💪', '🔥', '⚡', '👏', '🏃', '❤️', '🎉', '💯'];

interface WorkoutReaction {
  id: string;
  emoji: string;
  fromUser: { id: string; name: string | null; image: string | null };
  createdAt: string;
}

interface LiveMemberWorkout {
  id: string;
  userId: string;
  category: string;
  startTime: Date;
  status: string;
  goalDuration?: number | null;
  goalDistance?: number | null;
  notes?: string | null;
  user?: { id: string; name: string | null; image: string | null } | null;
  splits?: Array<{ splitNumber: number; duration: number; pace: number; distance: number }>;
  activities?: Array<{ name: string; sets?: number | null; reps?: number | null; weight?: number | null; duration?: number | null }>;
  reactions?: WorkoutReaction[];
}

interface CoachRoutineExercise {
  id: string;
  name: string;
  duration: number;
  countDirection: string;
  restAfter: number | null;
  sets: number | null;
  reps: number | null;
  orderIndex: number;
  message: string | null;
}

interface CoachRoutine {
  id: string;
  name: string;
  description: string | null;
  category: string;
  preWorkoutMessage: string | null;
  playlistLink: string | null;
  coach: { id: string; name: string | null; image: string | null };
  exercises: CoachRoutineExercise[];
}

interface ActiveWorkoutClientProps {
  workout: WorkoutData;
  clubSession?: {
    id: string;
    code: string;
    members: Array<{
      user: { id: string; name: string | null; image: string | null };
    }>;
    workouts: LiveMemberWorkout[];
  } | null;
  coachRoutine?: CoachRoutine | null;
}

export default function ActiveWorkoutClient({ workout, clubSession, coachRoutine }: ActiveWorkoutClientProps) {
  const router = useRouter();
  const category = WORKOUT_CATEGORIES[workout.category];
  const isRunningOrWalking = workout.category === 'RUNNING' || workout.category === 'WALKING';
  const isStrengthOrSports = workout.category === 'STRENGTH' || workout.category === 'SPORTS';
  const hasTimeGoal = !!workout.goalDuration;

  // Timer state
  const [isRunning, setIsRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [splits, setSplits] = useState<Split[]>(workout.splits || []);
  const [activities, setActivities] = useState<Activity[]>(workout.activities || []);
  const lastActivityTime = useRef(Date.now());
  
  // UI state
  const [showAddSplit, setShowAddSplit] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEndWorkout, setShowEndWorkout] = useState(false);
  const [showLivePanel, setShowLivePanel] = useState(false);
  const [liveMembers, setLiveMembers] = useState<LiveMemberWorkout[]>(clubSession?.workouts || []);
  
  // Reactions state
  const [incomingReactions, setIncomingReactions] = useState<WorkoutReaction[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [reactionCooldown, setReactionCooldown] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<Array<{ id: string; emoji: string; x: number }>>([]);
  
  // Split form
  const [splitDistance, setSplitDistance] = useState('1');
  
  // Activity form
  const [activityName, setActivityName] = useState('');
  const [activitySets, setActivitySets] = useState('');
  const [activityReps, setActivityReps] = useState('');
  const [activityWeight, setActivityWeight] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  
  // Structured workout state (built-in or coach routine)
  const structuredWorkout = workout.notes?.startsWith('structured:') 
    ? STRUCTURED_WORKOUTS.find(w => w.id === workout.notes?.replace('structured:', ''))
    : null;
  
  // Convert coach routine exercises to same format as structured
  const coachRoutineExercises: StructuredExercise[] | undefined = coachRoutine?.exercises.map(ex => ({
    name: ex.name,
    duration: ex.duration,
    countDirection: ex.countDirection as 'up' | 'down',
    restAfter: ex.restAfter || undefined,
    sets: ex.sets || undefined,
    reps: ex.reps || undefined,
    message: ex.message || undefined,
  }));
  
  // Use either built-in structured workout or coach routine
  const activeRoutine = structuredWorkout || (coachRoutine ? { 
    id: coachRoutine.id, 
    name: coachRoutine.name, 
    description: coachRoutine.description || '',
    exercises: coachRoutineExercises || []
  } : null);
  
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(
    activeRoutine?.exercises[0]?.duration || 0
  );
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);

  // Calculate initial elapsed time from workout start
  useEffect(() => {
    const startTime = new Date(workout.startTime).getTime();
    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsed(initialElapsed);
  }, [workout.startTime]);

  // Auto-log exercise for structured workouts
  const autoLogExercise = useCallback(async (exercise: StructuredExercise) => {
    try {
      const response = await fetch(`/api/workouts/${workout.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: exercise.name,
          sets: exercise.sets || 1,
          reps: exercise.reps || null,
          duration: exercise.duration,
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities((prev) => [...prev, newActivity]);
      }
    } catch (error) {
      console.error('Error auto-logging exercise:', error);
    }
  }, [workout.id]);

  // End workout
  const handleEndWorkout = useCallback(async () => {
    try {
      const totalDistance = splits.reduce((sum, s) => sum + s.distance, 0);
      
      await fetch(`/api/workouts/${workout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          totalDuration: elapsed,
          distance: totalDistance || null,
        }),
      });

      // If this is a coach routine, update completion record
      if (coachRoutine) {
        const completedExercises = currentExerciseIndex + (exerciseTimeRemaining === 0 ? 1 : 0);
        await fetch(`/api/coach/routines/${coachRoutine.id}/completions`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workoutId: workout.id,
            completed: completedExercises >= coachRoutine.exercises.length,
            exercisesCompleted: completedExercises,
          }),
        });
      }

      router.push(`/workout/${workout.id}/summary`);
    } catch (error) {
      console.error('Error ending workout:', error);
    }
  }, [workout.id, elapsed, splits, router, coachRoutine, currentExerciseIndex, exerciseTimeRemaining]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
        
        // Structured/Coach routine workout timer
        if (activeRoutine) {
          if (isResting) {
            setRestTimeRemaining((prev) => {
              if (prev <= 1) {
                setIsResting(false);
                // Move to next exercise
                if (currentExerciseIndex < activeRoutine.exercises.length - 1) {
                  const nextIdx = currentExerciseIndex + 1;
                  setCurrentExerciseIndex(nextIdx);
                  setExerciseTimeRemaining(activeRoutine.exercises[nextIdx].duration);
                }
                return 0;
              }
              return prev - 1;
            });
          } else {
            setExerciseTimeRemaining((prev) => {
              if (prev <= 1) {
                const currentExercise = activeRoutine.exercises[currentExerciseIndex];
                // Log the completed exercise
                autoLogExercise(currentExercise);
                
                if (currentExercise.restAfter && currentExercise.restAfter > 0) {
                  setIsResting(true);
                  setRestTimeRemaining(currentExercise.restAfter);
                } else if (currentExerciseIndex < activeRoutine.exercises.length - 1) {
                  const nextIdx = currentExerciseIndex + 1;
                  setCurrentExerciseIndex(nextIdx);
                  setExerciseTimeRemaining(activeRoutine.exercises[nextIdx].duration);
                } else {
                  // Workout complete
                  handleEndWorkout();
                }
                return 0;
              }
              return prev - 1;
            });
          }
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, activeRoutine, currentExerciseIndex, isResting, autoLogExercise, handleEndWorkout]);

  // Inactivity timeout check
  useEffect(() => {
    const checkInactivity = setInterval(() => {
      const minutesSinceActivity = (Date.now() - lastActivityTime.current) / 1000 / 60;
      if (minutesSinceActivity >= WORKOUT_INACTIVITY_TIMEOUT_MINUTES && isRunning) {
        // Auto-pause and show warning
        setIsRunning(false);
        setShowEndWorkout(true);
      }
    }, 60000); // Check every minute

    return () => clearInterval(checkInactivity);
  }, [isRunning]);

  // Fetch live club data and reactions
  useEffect(() => {
    if (!clubSession) return;
    
    const fetchLiveData = async () => {
      try {
        const res = await fetch(`/api/club/${clubSession.id}`);
        if (res.ok) {
          const data = await res.json();
          setLiveMembers(data.workouts || []);
          
          // Check for new reactions on my workout
          const myWorkout = data.workouts?.find((w: LiveMemberWorkout) => w.id === workout.id);
          if (myWorkout?.reactions) {
            const newReactions = myWorkout.reactions.filter(
              (r: WorkoutReaction) => !incomingReactions.some(ir => ir.id === r.id)
            );
            if (newReactions.length > 0) {
              setIncomingReactions(prev => [...newReactions, ...prev].slice(0, 20));
              // Show floating reactions
              newReactions.forEach((r: WorkoutReaction) => {
                const floatId = `${r.id}-${Date.now()}`;
                setFloatingReactions(prev => [...prev, { 
                  id: floatId, 
                  emoji: r.emoji, 
                  x: Math.random() * 80 + 10 
                }]);
                // Remove floating reaction after animation
                setTimeout(() => {
                  setFloatingReactions(prev => prev.filter(f => f.id !== floatId));
                }, 3000);
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching live data:', error);
      }
    };

    fetchLiveData(); // Initial fetch
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, [clubSession, workout.id, incomingReactions]);

  // Reset activity timer on user actions
  const resetInactivityTimer = () => {
    lastActivityTime.current = Date.now();
  };

  // Calculate last split time
  const getLastSplitTime = useCallback(() => {
    if (splits.length === 0) return 0;
    return splits.reduce((sum, split) => sum + split.duration, 0);
  }, [splits]);

  // Add split
  const handleAddSplit = async () => {
    resetInactivityTimer();
    const distance = parseFloat(splitDistance) || 1;
    const splitDuration = elapsed - getLastSplitTime();

    try {
      const response = await fetch(`/api/workouts/${workout.id}/splits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance,
          duration: splitDuration,
        }),
      });

      if (response.ok) {
        const newSplit = await response.json();
        setSplits([...splits, newSplit]);
        setShowAddSplit(false);
        setSplitDistance('1');
      }
    } catch (error) {
      console.error('Error adding split:', error);
    }
  };

  // Add activity
  const handleAddActivity = async () => {
    if (!activityName) return;
    resetInactivityTimer();

    try {
      const response = await fetch(`/api/workouts/${workout.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: activityName,
          sets: activitySets ? parseInt(activitySets) : null,
          reps: activityReps ? parseInt(activityReps) : null,
          weight: activityWeight ? parseFloat(activityWeight) : null,
          duration: activityDuration ? parseInt(activityDuration) * 60 : null,
        }),
      });

      if (response.ok) {
        const newActivity = await response.json();
        setActivities([...activities, newActivity]);
        setShowAddActivity(false);
        resetActivityForm();
      }
    } catch (error) {
      console.error('Error adding activity:', error);
    }
  };

  const resetActivityForm = () => {
    setActivityName('');
    setActivitySets('');
    setActivityReps('');
    setActivityWeight('');
    setActivityDuration('');
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

  // Get workout status details for LIVE panel
  const getWorkoutDetails = (memberWorkout: LiveMemberWorkout) => {
    const memberCategory = WORKOUT_CATEGORIES[memberWorkout.category as keyof typeof WORKOUT_CATEGORIES];
    const memberElapsed = Math.floor((Date.now() - new Date(memberWorkout.startTime).getTime()) / 1000);
    
    // Check for structured workout
    const isStructured = memberWorkout.notes?.startsWith('structured:');
    const structuredId = isStructured ? memberWorkout.notes?.replace('structured:', '') : null;
    const memberStructuredWorkout = structuredId ? STRUCTURED_WORKOUTS.find(w => w.id === structuredId) : null;
    
    // Time remaining for goal
    const hasGoal = !!memberWorkout.goalDuration;
    const timeRemaining = hasGoal ? Math.max(0, memberWorkout.goalDuration! - memberElapsed) : 0;
    const isOvertime = hasGoal && memberElapsed > memberWorkout.goalDuration!;
    
    // Latest activity/split info
    const latestSplit = memberWorkout.splits?.[0];
    const latestActivity = memberWorkout.activities?.[0];
    
    return {
      category: memberCategory,
      elapsed: memberElapsed,
      isStructured,
      structuredWorkout: memberStructuredWorkout,
      hasGoal,
      timeRemaining,
      isOvertime,
      latestSplit,
      latestActivity,
      totalSplits: memberWorkout.splits?.length || 0,
      totalActivities: memberWorkout.activities?.length || 0,
    };
  };

  // Skip to next exercise (structured/coach workout)
  const skipExercise = () => {
    if (!activeRoutine) return;
    resetInactivityTimer();
    
    if (currentExerciseIndex < activeRoutine.exercises.length - 1) {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      setExerciseTimeRemaining(activeRoutine.exercises[nextIdx].duration);
      setIsResting(false);
    }
  };

  // Cancel workout
  const handleCancelWorkout = async () => {
    try {
      await fetch(`/api/workouts/${workout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });

      router.push('/dashboard');
    } catch (error) {
      console.error('Error cancelling workout:', error);
    }
  };

  const currentSplitTime = elapsed - getLastSplitTime();
  
  // Calculate countdown for time goal
  const timeRemaining = hasTimeGoal ? Math.max(0, workout.goalDuration! - elapsed) : 0;
  const isOvertime = hasTimeGoal && elapsed > workout.goalDuration!;

  // Current exercise for structured/coach workout
  const currentExercise = activeRoutine?.exercises[currentExerciseIndex];
  const nextExercise = activeRoutine?.exercises[currentExerciseIndex + 1];

  return (
    <div className="min-h-screen bg-dark-900 flex flex-col">
      {/* Header with category */}
      <header className="px-4 py-4 border-b border-dark-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{category.icon}</span>
          <div>
            <h1 className="font-bold text-white">{category.name}</h1>
            <p className="text-sm text-dark-400">
              {isRunning ? 'In Progress' : 'Paused'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Live Club Button */}
          {clubSession && (
            <button
              onClick={() => setShowLivePanel(!showLivePanel)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                showLivePanel ? 'bg-green-500/20 text-green-400' : 'bg-dark-700 text-dark-300'
              )}
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span className="text-sm font-medium">LIVE</span>
              {showLivePanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => setShowEndWorkout(true)}
            className="btn-ghost text-red-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Live Club Panel */}
      <AnimatePresence>
        {showLivePanel && clubSession && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-dark-700"
          >
            <div className="px-4 py-3 bg-dark-800/50">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-green-400" />
                <span className="text-sm font-medium text-white">
                  Club Session: {clubSession.code}
                </span>
                <span className="text-xs text-dark-500">
                  ({liveMembers.filter((w: LiveMemberWorkout) => w.status === 'IN_PROGRESS').length} active)
                </span>
              </div>
              <div className="space-y-3">
                {liveMembers.filter((w: LiveMemberWorkout) => w.status === 'IN_PROGRESS').map((memberWorkout: LiveMemberWorkout) => {
                  const isCurrentUser = memberWorkout.userId === workout.userId;
                  const details = getWorkoutDetails(memberWorkout);
                  
                  return (
                    <div
                      key={memberWorkout.id}
                      className={cn(
                        'p-3 rounded-lg relative',
                        isCurrentUser ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-700/50'
                      )}
                    >
                      {/* Main info row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{details.category?.icon}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                'text-sm font-medium',
                                isCurrentUser ? 'text-primary-400' : 'text-white'
                              )}>
                                {isCurrentUser ? 'You' : memberWorkout.user?.name?.split(' ')[0] || 'Member'}
                              </span>
                              {/* Activity indicator dot */}
                              <span className={cn(
                                'w-2 h-2 rounded-full',
                                memberWorkout.category === 'RUNNING' ? 'bg-blue-500' :
                                memberWorkout.category === 'WALKING' ? 'bg-green-500' :
                                memberWorkout.category === 'STRENGTH' ? 'bg-orange-500' :
                                'bg-purple-500'
                              )} title={details.category?.name} />
                            </div>
                            {/* Current activity details */}
                            <div className="text-xs text-dark-400 mt-0.5">
                              {details.isStructured && details.structuredWorkout ? (
                                <span>🏋️ {details.structuredWorkout.name}</span>
                              ) : memberWorkout.category === 'RUNNING' || memberWorkout.category === 'WALKING' ? (
                                details.totalSplits > 0 ? (
                                  <span className="flex items-center gap-1">
                                    <Flag className="w-3 h-3" />
                                    Lap {details.totalSplits}
                                    {details.latestSplit && (
                                      <span className="text-dark-500">
                                        • {formatPace(details.latestSplit.pace)}/km
                                      </span>
                                    )}
                                  </span>
                                ) : (
                                  <span>Getting started...</span>
                                )
                              ) : details.latestActivity ? (
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {details.latestActivity.name}
                                  {details.latestActivity.sets && details.latestActivity.reps && (
                                    <span className="text-dark-500">
                                      ({details.latestActivity.sets}×{details.latestActivity.reps})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span>Just started</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Time display */}
                        <div className="text-right">
                          {details.hasGoal ? (
                            <div>
                              <span className={cn(
                                'text-sm font-mono',
                                details.isOvertime ? 'text-orange-400' : 'text-green-400'
                              )}>
                                {details.isOvertime ? '+' : ''}{formatDuration(details.isOvertime ? details.elapsed - memberWorkout.goalDuration! : details.timeRemaining)}
                              </span>
                              <p className="text-[10px] text-dark-500">
                                {details.isOvertime ? 'overtime' : 'remaining'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm font-mono text-dark-300">
                              {formatDuration(details.elapsed)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Reaction button (for other users) */}
                      {!isCurrentUser && (
                        <div className="mt-2 pt-2 border-t border-dark-600/50">
                          {showReactionPicker === memberWorkout.id ? (
                            <div className="flex items-center gap-1 flex-wrap">
                              {REACTION_EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => sendReaction(memberWorkout.id, emoji)}
                                  disabled={reactionCooldown}
                                  className={cn(
                                    'text-lg p-1 rounded hover:bg-dark-600 transition-colors',
                                    reactionCooldown && 'opacity-50 cursor-not-allowed'
                                  )}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button
                                onClick={() => setShowReactionPicker(null)}
                                className="text-xs text-dark-500 ml-2"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowReactionPicker(memberWorkout.id)}
                              disabled={reactionCooldown}
                              className={cn(
                                'flex items-center gap-1 text-xs text-dark-400 hover:text-white transition-colors',
                                reactionCooldown && 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <Send className="w-3 h-3" />
                              {reactionCooldown ? 'Wait...' : 'Send cheer'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Reactions Animation */}
      <AnimatePresence>
        {floatingReactions.map(reaction => (
          <motion.div
            key={reaction.id}
            initial={{ opacity: 1, y: 100, x: `${reaction.x}%`, scale: 0.5 }}
            animate={{ opacity: 0, y: -200, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.5, ease: 'easeOut' }}
            className="fixed text-4xl pointer-events-none z-50"
            style={{ bottom: '20%' }}
          >
            {reaction.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Timer Display */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Structured/Coach Routine Workout Display */}
        {activeRoutine && currentExercise && (
          <div className="w-full max-w-xs mb-6">
            <div className="card p-4 text-center">
              {coachRoutine && (
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Crown className="w-3 h-3 text-orange-400" />
                  <span className="text-xs text-orange-400">
                    {coachRoutine.coach.name?.split(' ')[0]}&apos;s Routine
                  </span>
                </div>
              )}
              <p className="text-xs text-dark-400 mb-1">
                {isResting ? 'REST' : `Exercise ${currentExerciseIndex + 1}/${activeRoutine.exercises.length}`}
              </p>
              <h2 className={cn(
                'text-2xl font-bold mb-2',
                isResting ? 'text-green-400' : 'text-white'
              )}>
                {isResting ? 'Rest' : currentExercise.name}
              </h2>
              {currentExercise.reps && !isResting && (
                <p className="text-dark-400">{currentExercise.reps} reps</p>
              )}
              
              {/* Coach Message for this exercise */}
              {currentExercise.message && !isResting && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 px-3 py-2 bg-orange-500/20 rounded-lg border border-orange-500/30"
                >
                  <p className="text-orange-300 text-sm font-medium">
                    💬 {currentExercise.message}
                  </p>
                </motion.div>
              )}
              
              <div className="mt-4 text-5xl font-mono font-bold text-primary-400">
                {formatDuration(isResting ? restTimeRemaining : exerciseTimeRemaining)}
              </div>
              {nextExercise && (
                <p className="text-xs text-dark-500 mt-3">
                  Next: {nextExercise.name}
                </p>
              )}
              <button
                onClick={skipExercise}
                className="mt-4 text-sm text-dark-400 hover:text-white flex items-center gap-1 mx-auto"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Goal Progress */}
        {!activeRoutine && (workout.goalDuration || workout.goalDistance) && (
          <div className="w-full max-w-xs mb-8">
            {workout.goalDuration && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">
                    {isOvertime ? 'Overtime!' : 'Time Remaining'}
                  </span>
                  <span className={cn(
                    'font-mono',
                    isOvertime ? 'text-orange-400' : 'text-white'
                  )}>
                    {isOvertime ? '+' : ''}{formatDuration(isOvertime ? elapsed - workout.goalDuration : timeRemaining)}
                  </span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    className={cn(
                      'h-full',
                      isOvertime ? 'bg-orange-500' : 'bg-primary-500'
                    )}
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min((elapsed / workout.goalDuration) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            {workout.goalDistance && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">Distance Goal</span>
                  <span className="text-white">
                    {splits.reduce((s, sp) => s + sp.distance, 0).toFixed(2)} /{' '}
                    {workout.goalDistance} km
                  </span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(
                        (splits.reduce((s, sp) => s + sp.distance, 0) /
                          workout.goalDistance) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Main Timer */}
        {!activeRoutine && (
          <div className="text-center mb-8">
            {hasTimeGoal ? (
              // Countdown display
              <>
                <motion.div
                  animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                  transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                  className={cn(
                    'timer-display mb-2',
                    isOvertime ? 'text-orange-400' : 'text-white'
                  )}
                >
                  {isOvertime ? '+' : ''}{formatDuration(isOvertime ? elapsed - workout.goalDuration! : timeRemaining)}
                </motion.div>
                <p className="text-dark-400">
                  {isOvertime ? 'Keep going!' : 'Time Remaining'}
                </p>
                <p className="text-sm text-dark-500 mt-2">
                  Total: {formatDuration(elapsed)}
                </p>
              </>
            ) : (
              // Count up display
              <>
                <motion.div
                  animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
                  transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
                  className="timer-display text-white mb-2"
                >
                  {formatDuration(elapsed)}
                </motion.div>
                <p className="text-dark-400">Total Time</p>
              </>
            )}
            
            {isRunningOrWalking && splits.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-2xl font-mono text-primary-400">
                  {formatDuration(currentSplitTime)}
                </p>
                <p className="text-sm text-dark-500">Current Split</p>
              </div>
            )}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-4">
          {isRunningOrWalking && !activeRoutine && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetInactivityTimer();
                setShowAddSplit(true);
              }}
              className="w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center text-dark-200"
            >
              <Flag className="w-6 h-6" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetInactivityTimer();
              setIsRunning(!isRunning);
            }}
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center',
              isRunning
                ? 'bg-orange-500 text-white'
                : 'bg-green-500 text-white'
            )}
          >
            {isRunning ? (
              <Pause className="w-8 h-8" />
            ) : (
              <Play className="w-8 h-8 ml-1" />
            )}
          </motion.button>

          {isStrengthOrSports && !activeRoutine && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                resetInactivityTimer();
                setShowAddActivity(true);
              }}
              className="w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center text-dark-200"
            >
              <Plus className="w-6 h-6" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowEndWorkout(true)}
            className="w-14 h-14 rounded-full bg-primary-500 flex items-center justify-center text-white"
          >
            <Square className="w-6 h-6" />
          </motion.button>
        </div>
      </main>

      {/* Splits/Activities List */}
      <div className="px-4 pb-8 max-h-[40vh] overflow-y-auto">
        {isRunningOrWalking && splits.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-white mb-3">Splits</h3>
            <div className="space-y-2">
              {splits.map((split) => (
                <div
                  key={split.id}
                  className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                >
                  <span className="text-dark-400">Split {split.splitNumber}</span>
                  <div className="text-right">
                    <span className="text-white">{formatDuration(split.duration)}</span>
                    <span className="text-dark-500 ml-2">
                      {formatPace(split.pace)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isStrengthOrSports && activities.length > 0 && (
          <div className="card p-4">
            <h3 className="font-semibold text-white mb-3">Activities</h3>
            <div className="space-y-2">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                >
                  <span className="text-white">{activity.name}</span>
                  <div className="text-right text-sm text-dark-400">
                    {activity.sets && activity.reps && (
                      <span>{activity.sets}x{activity.reps}</span>
                    )}
                    {activity.weight && (
                      <span className="ml-2">{activity.weight}kg</span>
                    )}
                    {activity.duration && (
                      <span className="ml-2">{formatDuration(activity.duration)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Split Modal */}
      <AnimatePresence>
        {showAddSplit && (
          <Modal onClose={() => setShowAddSplit(false)}>
            <h2 className="text-xl font-bold text-white mb-4">Add Split</h2>
            <div className="mb-4">
              <label className="label">Distance (km)</label>
              <input
                type="number"
                step="0.1"
                value={splitDistance}
                onChange={(e) => setSplitDistance(e.target.value)}
                className="input"
                placeholder="1.0"
              />
            </div>
            <div className="mb-4 p-3 bg-dark-700 rounded-lg">
              <p className="text-sm text-dark-400">Split Time</p>
              <p className="text-xl font-mono text-white">
                {formatDuration(currentSplitTime)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddSplit(false)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button onClick={handleAddSplit} className="btn-primary flex-1">
                <Flag className="w-4 h-4 mr-2" />
                Add Split
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Add Activity Modal */}
      <AnimatePresence>
        {showAddActivity && (
          <Modal onClose={() => setShowAddActivity(false)}>
            <h2 className="text-xl font-bold text-white mb-4">Add Activity</h2>
            
            <div className="mb-4">
              <label className="label">Activity Name</label>
              <input
                type="text"
                value={activityName}
                onChange={(e) => setActivityName(e.target.value)}
                className="input mb-2"
                placeholder="e.g., Push-ups"
              />
              <div className="flex flex-wrap gap-2">
                {(workout.category === 'STRENGTH' ? COMMON_EXERCISES : COMMON_SPORTS)
                  .slice(0, 8)
                  .map((name) => (
                    <button
                      key={name}
                      onClick={() => setActivityName(name)}
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        activityName === name
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-700 text-dark-300'
                      )}
                    >
                      {name}
                    </button>
                  ))}
              </div>
            </div>

            {workout.category === 'STRENGTH' && (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="label">Sets</label>
                    <input
                      type="number"
                      value={activitySets}
                      onChange={(e) => setActivitySets(e.target.value)}
                      className="input"
                      placeholder="3"
                    />
                  </div>
                  <div>
                    <label className="label">Reps</label>
                    <input
                      type="number"
                      value={activityReps}
                      onChange={(e) => setActivityReps(e.target.value)}
                      className="input"
                      placeholder="10"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="label">Weight (kg) - Optional</label>
                  <input
                    type="number"
                    step="0.5"
                    value={activityWeight}
                    onChange={(e) => setActivityWeight(e.target.value)}
                    className="input"
                    placeholder="20"
                  />
                </div>
              </>
            )}

            {workout.category === 'SPORTS' && (
              <div className="mb-4">
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  value={activityDuration}
                  onChange={(e) => setActivityDuration(e.target.value)}
                  className="input"
                  placeholder="30"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddActivity(false);
                  resetActivityForm();
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActivity}
                disabled={!activityName}
                className="btn-primary flex-1"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* End Workout Modal */}
      <AnimatePresence>
        {showEndWorkout && (
          <Modal onClose={() => setShowEndWorkout(false)}>
            <h2 className="text-xl font-bold text-white mb-4">End Workout?</h2>
            <p className="text-dark-400 mb-6">
              You&apos;ve been working out for{' '}
              <span className="text-white font-semibold">
                {formatDuration(elapsed)}
              </span>
              . What would you like to do?
            </p>
            <div className="space-y-3">
              <button
                onClick={handleEndWorkout}
                className="btn-primary w-full py-4"
              >
                <Check className="w-5 h-5 mr-2" />
                Complete Workout
              </button>
              <button
                onClick={handleCancelWorkout}
                className="btn-danger w-full py-4"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel & Discard
              </button>
              <button
                onClick={() => setShowEndWorkout(false)}
                className="btn-secondary w-full py-4"
              >
                Continue Workout
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Modal component
function Modal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/60"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
