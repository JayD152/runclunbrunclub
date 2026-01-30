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

interface ActiveWorkoutClientProps {
  workout: WorkoutData;
  clubSession?: {
    id: string;
    code: string;
    members: Array<{
      user: { id: string; name: string | null; image: string | null };
    }>;
    workouts: Array<{
      id: string;
      userId: string;
      category: string;
      startTime: Date;
      status: string;
      user?: { id: string; name: string | null; image: string | null };
    }>;
  } | null;
}

export default function ActiveWorkoutClient({ workout, clubSession }: ActiveWorkoutClientProps) {
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
  const [liveMembers, setLiveMembers] = useState(clubSession?.workouts || []);
  
  // Split form
  const [splitDistance, setSplitDistance] = useState('1');
  
  // Activity form
  const [activityName, setActivityName] = useState('');
  const [activitySets, setActivitySets] = useState('');
  const [activityReps, setActivityReps] = useState('');
  const [activityWeight, setActivityWeight] = useState('');
  const [activityDuration, setActivityDuration] = useState('');
  
  // Structured workout state
  const structuredWorkout = workout.notes?.startsWith('structured:') 
    ? STRUCTURED_WORKOUTS.find(w => w.id === workout.notes?.replace('structured:', ''))
    : null;
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseTimeRemaining, setExerciseTimeRemaining] = useState(
    structuredWorkout?.exercises[0]?.duration || 0
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

      router.push(`/workout/${workout.id}/summary`);
    } catch (error) {
      console.error('Error ending workout:', error);
    }
  }, [workout.id, elapsed, splits, router]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
        
        // Structured workout timer
        if (structuredWorkout) {
          if (isResting) {
            setRestTimeRemaining((prev) => {
              if (prev <= 1) {
                setIsResting(false);
                // Move to next exercise
                if (currentExerciseIndex < structuredWorkout.exercises.length - 1) {
                  const nextIdx = currentExerciseIndex + 1;
                  setCurrentExerciseIndex(nextIdx);
                  setExerciseTimeRemaining(structuredWorkout.exercises[nextIdx].duration);
                }
                return 0;
              }
              return prev - 1;
            });
          } else {
            setExerciseTimeRemaining((prev) => {
              if (prev <= 1) {
                const currentExercise = structuredWorkout.exercises[currentExerciseIndex];
                // Log the completed exercise
                autoLogExercise(currentExercise);
                
                if (currentExercise.restAfter && currentExercise.restAfter > 0) {
                  setIsResting(true);
                  setRestTimeRemaining(currentExercise.restAfter);
                } else if (currentExerciseIndex < structuredWorkout.exercises.length - 1) {
                  const nextIdx = currentExerciseIndex + 1;
                  setCurrentExerciseIndex(nextIdx);
                  setExerciseTimeRemaining(structuredWorkout.exercises[nextIdx].duration);
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
  }, [isRunning, structuredWorkout, currentExerciseIndex, isResting, autoLogExercise, handleEndWorkout]);

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

  // Fetch live club data
  useEffect(() => {
    if (!clubSession) return;
    
    const fetchLiveData = async () => {
      try {
        const res = await fetch(`/api/club/${clubSession.id}`);
        if (res.ok) {
          const data = await res.json();
          setLiveMembers(data.workouts || []);
        }
      } catch (error) {
        console.error('Error fetching live data:', error);
      }
    };

    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, [clubSession]);

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

  // Skip to next exercise (structured workout)
  const skipExercise = () => {
    if (!structuredWorkout) return;
    resetInactivityTimer();
    
    if (currentExerciseIndex < structuredWorkout.exercises.length - 1) {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      setExerciseTimeRemaining(structuredWorkout.exercises[nextIdx].duration);
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

  // Current exercise for structured workout
  const currentExercise = structuredWorkout?.exercises[currentExerciseIndex];
  const nextExercise = structuredWorkout?.exercises[currentExerciseIndex + 1];

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
              </div>
              <div className="space-y-2">
                {liveMembers.filter((w: any) => w.status === 'IN_PROGRESS').map((memberWorkout: any) => {
                  const memberElapsed = Math.floor(
                    (Date.now() - new Date(memberWorkout.startTime).getTime()) / 1000
                  );
                  const memberCategory = WORKOUT_CATEGORIES[memberWorkout.category as keyof typeof WORKOUT_CATEGORIES];
                  const isCurrentUser = memberWorkout.userId === workout.userId;
                  
                  return (
                    <div
                      key={memberWorkout.id}
                      className={cn(
                        'flex items-center justify-between p-2 rounded-lg',
                        isCurrentUser ? 'bg-primary-500/10 border border-primary-500/30' : 'bg-dark-700/50'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{memberCategory?.icon}</span>
                        <span className={cn(
                          'text-sm',
                          isCurrentUser ? 'text-primary-400 font-medium' : 'text-white'
                        )}>
                          {isCurrentUser ? 'You' : memberWorkout.user?.name || 'Member'}
                        </span>
                      </div>
                      <span className="text-sm font-mono text-dark-300">
                        {formatDuration(memberElapsed)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Timer Display */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Structured Workout Display */}
        {structuredWorkout && currentExercise && (
          <div className="w-full max-w-xs mb-6">
            <div className="card p-4 text-center">
              <p className="text-xs text-dark-400 mb-1">
                {isResting ? 'REST' : `Exercise ${currentExerciseIndex + 1}/${structuredWorkout.exercises.length}`}
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
        {!structuredWorkout && (workout.goalDuration || workout.goalDistance) && (
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
        {!structuredWorkout && (
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
          {isRunningOrWalking && !structuredWorkout && (
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

          {isStrengthOrSports && !structuredWorkout && (
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
