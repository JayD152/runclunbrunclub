'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pause,
  Play,
  Square,
  Plus,
  Flag,
  Dumbbell,
  X,
  Check,
} from 'lucide-react';
import { WorkoutData, WORKOUT_CATEGORIES, COMMON_EXERCISES, COMMON_SPORTS, Activity, Split } from '@/types/workout';
import { formatDuration, formatPace, cn } from '@/lib/utils';

interface ActiveWorkoutClientProps {
  workout: WorkoutData;
}

export default function ActiveWorkoutClient({ workout }: ActiveWorkoutClientProps) {
  const router = useRouter();
  const category = WORKOUT_CATEGORIES[workout.category];
  const isRunningOrWalking = workout.category === 'RUNNING' || workout.category === 'WALKING';
  const isStrengthOrSports = workout.category === 'STRENGTH' || workout.category === 'SPORTS';

  // Timer state
  const [isRunning, setIsRunning] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [splits, setSplits] = useState<Split[]>(workout.splits || []);
  const [activities, setActivities] = useState<Activity[]>(workout.activities || []);
  
  // UI state
  const [showAddSplit, setShowAddSplit] = useState(false);
  const [showAddActivity, setShowAddActivity] = useState(false);
  const [showEndWorkout, setShowEndWorkout] = useState(false);
  
  // Split form
  const [splitDistance, setSplitDistance] = useState('1');
  
  // Activity form
  const [activityName, setActivityName] = useState('');
  const [activitySets, setActivitySets] = useState('');
  const [activityReps, setActivityReps] = useState('');
  const [activityWeight, setActivityWeight] = useState('');
  const [activityDuration, setActivityDuration] = useState('');

  // Calculate initial elapsed time from workout start
  useEffect(() => {
    const startTime = new Date(workout.startTime).getTime();
    const initialElapsed = Math.floor((Date.now() - startTime) / 1000);
    setElapsed(initialElapsed);
  }, [workout.startTime]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsed((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  // Calculate last split time
  const getLastSplitTime = useCallback(() => {
    if (splits.length === 0) return 0;
    return splits.reduce((sum, split) => sum + split.duration, 0);
  }, [splits]);

  // Add split
  const handleAddSplit = async () => {
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

  // End workout
  const handleEndWorkout = async () => {
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
        <button
          onClick={() => setShowEndWorkout(true)}
          className="btn-ghost text-red-400"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      {/* Main Timer Display */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Goal Progress */}
        {(workout.goalDuration || workout.goalDistance) && (
          <div className="w-full max-w-xs mb-8">
            {workout.goalDuration && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-dark-400">Time Goal</span>
                  <span className="text-white">
                    {formatDuration(elapsed)} / {formatDuration(workout.goalDuration)}
                  </span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary-500"
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

        {/* Timer */}
        <div className="text-center mb-8">
          <motion.div
            animate={{ scale: isRunning ? [1, 1.02, 1] : 1 }}
            transition={{ duration: 1, repeat: isRunning ? Infinity : 0 }}
            className="timer-display text-white mb-2"
          >
            {formatDuration(elapsed)}
          </motion.div>
          <p className="text-dark-400">Total Time</p>
          
          {isRunningOrWalking && splits.length > 0 && (
            <div className="mt-4 text-center">
              <p className="text-2xl font-mono text-primary-400">
                {formatDuration(currentSplitTime)}
              </p>
              <p className="text-sm text-dark-500">Current Split</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4">
          {isRunningOrWalking && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddSplit(true)}
              className="w-14 h-14 rounded-full bg-dark-700 flex items-center justify-center text-dark-200"
            >
              <Flag className="w-6 h-6" />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsRunning(!isRunning)}
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

          {isStrengthOrSports && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddActivity(true)}
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
