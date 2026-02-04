'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Trophy,
  Clock,
  Route,
  Flame,
  TrendingUp,
  ArrowRight,
  Check,
  Calculator,
  Users,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { WorkoutData, StreakData, WORKOUT_CATEGORIES } from '@/types/workout';
import { formatDuration, formatDistance, formatPace, estimateCalories, cn } from '@/lib/utils';
import { useEffect } from 'react';

interface ClubSessionInfo {
  id: string;
  name: string | null;
  host: { id: string; name: string | null; image: string | null };
  memberCount: number;
}

interface WorkoutSummaryClientProps {
  workout: WorkoutData;
  streak: StreakData | null;
  clubSession?: ClubSessionInfo | null;
}

export default function WorkoutSummaryClient({
  workout,
  streak,
  clubSession,
}: WorkoutSummaryClientProps) {
  const router = useRouter();
  const category = WORKOUT_CATEGORIES[workout.category];
  const [caloriesInput, setCaloriesInput] = useState(
    workout.caloriesBurned?.toString() || ''
  );
  const [showCaloriesForm, setShowCaloriesForm] = useState(!workout.caloriesBurned);
  const [caloriesSaved, setCaloriesSaved] = useState(!!workout.caloriesBurned);

  // Trigger confetti on mount
  useEffect(() => {
    if (workout.status === 'COMPLETED') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f97316', '#22c55e'],
      });
    }
  }, [workout.status]);

  const estimatedCalories = workout.totalDuration
    ? estimateCalories(workout.category, workout.totalDuration / 60)
    : 0;

  const handleSaveCalories = async (source: 'manual' | 'estimated') => {
    const calories = source === 'estimated' ? estimatedCalories : parseInt(caloriesInput);
    
    if (!calories) return;

    try {
      await fetch(`/api/workouts/${workout.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caloriesBurned: calories,
          caloriesSource: source,
        }),
      });
      setCaloriesSaved(true);
      setShowCaloriesForm(false);
    } catch (error) {
      console.error('Error saving calories:', error);
    }
  };

  const totalDistance = workout.splits?.reduce((sum, s) => sum + s.distance, 0) || workout.distance || 0;
  const avgPace = totalDistance && workout.totalDuration
    ? (workout.totalDuration / 60) / totalDistance
    : null;

  return (
    <div className="min-h-screen bg-dark-900 pb-8">
      {/* Header */}
      <header className="px-4 py-6 text-center bg-gradient-to-b from-dark-800 to-dark-900">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 mb-4"
        >
          <Trophy className="w-10 h-10 text-white" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {workout.status === 'COMPLETED' ? 'Great Workout!' : 'Workout Cancelled'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-dark-400"
        >
          {category.icon} {category.name}
        </motion.p>
      </header>

      <main className="px-4 space-y-6">
        {/* Club Session Banner */}
        {clubSession && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="card bg-gradient-to-r from-primary-600/20 to-accent-600/20 border-primary-500/30 p-4 flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-primary-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-400" />
            </div>
            <div>
              <p className="font-bold text-white text-lg">
                Club Workout
              </p>
              <p className="text-sm text-dark-300">
                Trained with {clubSession.memberCount} {clubSession.memberCount === 1 ? 'member' : 'members'}
                {clubSession.name && ` in "${clubSession.name}"`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Streak Banner */}
        {streak && streak.currentStreak > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30 p-4 flex items-center gap-4"
          >
            <div className="text-4xl">🔥</div>
            <div>
              <p className="font-bold text-white text-lg">
                {streak.currentStreak} Day Streak!
              </p>
              <p className="text-sm text-dark-300">
                {streak.currentStreak >= streak.longestStreak
                  ? "New personal best!"
                  : `Longest: ${streak.longestStreak} days`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 gap-4"
        >
          {workout.totalDuration && (
            <StatCard
              icon={<Clock className="w-5 h-5 text-blue-400" />}
              label="Duration"
              value={formatDuration(workout.totalDuration)}
            />
          )}
          {totalDistance > 0 && (
            <StatCard
              icon={<Route className="w-5 h-5 text-green-400" />}
              label="Distance"
              value={formatDistance(totalDistance)}
            />
          )}
          {avgPace && (
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
              label="Avg Pace"
              value={formatPace(avgPace)}
            />
          )}
          {(caloriesSaved || workout.caloriesBurned) && (
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-400" />}
              label="Calories"
              value={`${workout.caloriesBurned || caloriesInput} cal`}
            />
          )}
        </motion.div>

        {/* Calories Input */}
        {showCaloriesForm && workout.status === 'COMPLETED' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="card p-4"
          >
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              How many calories did you burn?
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="label">Enter from fitness tracker</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={caloriesInput}
                    onChange={(e) => setCaloriesInput(e.target.value)}
                    className="input flex-1"
                    placeholder="Enter calories"
                  />
                  <button
                    onClick={() => handleSaveCalories('manual')}
                    disabled={!caloriesInput}
                    className="btn-primary"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="text-center text-dark-500">or</div>
              
              <button
                onClick={() => handleSaveCalories('estimated')}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <Calculator className="w-4 h-4" />
                Use Estimate: ~{estimatedCalories} cal
              </button>
            </div>
          </motion.div>
        )}

        {/* Splits */}
        {workout.splits && workout.splits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card p-4"
          >
            <h3 className="font-semibold text-white mb-4">Splits</h3>
            <div className="space-y-2">
              {workout.splits.map((split, index) => (
                <div
                  key={split.id}
                  className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center text-sm text-dark-300">
                      {index + 1}
                    </span>
                    <span className="text-dark-400">{split.distance} km</span>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-mono">
                      {formatDuration(split.duration)}
                    </span>
                    <span className="text-dark-500 text-sm ml-2">
                      {formatPace(split.pace)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Activities */}
        {workout.activities && workout.activities.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="card p-4"
          >
            <h3 className="font-semibold text-white mb-4">Activities</h3>
            <div className="space-y-3">
              {workout.activities.map((activity) => {
                // Calculate elapsed time - use elapsedAt if available, otherwise calculate from timestamp
                const elapsedTime = activity.elapsedAt ?? (
                  workout.startTime && activity.timestamp
                    ? Math.floor((new Date(activity.timestamp).getTime() - new Date(workout.startTime).getTime()) / 1000)
                    : null
                );
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      {elapsedTime !== null && elapsedTime >= 0 && (
                        <span className="text-xs text-dark-500 font-mono w-12">
                          @ {formatDuration(elapsedTime)}
                        </span>
                      )}
                      <span className="text-white">{activity.name}</span>
                    </div>
                    <div className="text-sm text-dark-400">
                      {activity.sets && activity.reps && (
                        <span className="mr-2">
                          {activity.sets} × {activity.reps}
                        </span>
                      )}
                      {activity.weight && <span>{activity.weight} kg</span>}
                      {activity.duration && (
                        <span>{formatDuration(activity.duration)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="space-y-3 pt-4"
        >
          <Link href="/dashboard">
            <button className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2">
              Back to Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <Link href="/workout/new">
            <button className="btn-secondary w-full py-4">
              Start Another Workout
            </button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-sm text-dark-400">{label}</p>
    </div>
  );
}
