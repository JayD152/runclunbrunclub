'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Target, Clock, Route } from 'lucide-react';
import Link from 'next/link';
import {
  WorkoutCategory,
  WORKOUT_CATEGORIES,
  PREDEFINED_TIMES,
  PREDEFINED_DISTANCES,
} from '@/types/workout';
import { cn, formatDuration } from '@/lib/utils';

type GoalType = 'none' | 'time' | 'distance' | 'both';

interface NewWorkoutClientProps {
  clubSessionId?: string;
}

export default function NewWorkoutClient({ clubSessionId }: NewWorkoutClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
  const [goalType, setGoalType] = useState<GoalType>('none');
  const [timeGoal, setTimeGoal] = useState<number | null>(null);
  const [distanceGoal, setDistanceGoal] = useState<number | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [customDistance, setCustomDistance] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSetDistanceGoal = selectedCategory === 'RUNNING' || selectedCategory === 'WALKING';

  const handleStartWorkout = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          goalDuration: timeGoal,
          goalDistance: distanceGoal,
          clubSessionId: clubSessionId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create workout');

      const workout = await response.json();
      router.push(`/workout/${workout.id}`);
    } catch (error) {
      console.error('Error starting workout:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-dark-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">New Workout</h1>
            <p className="text-sm text-dark-400">Step {step} of {canSetDistanceGoal ? 3 : 2}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Step 1: Select Category */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-white mb-6">
                What are you working on today?
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(WORKOUT_CATEGORIES) as WorkoutCategory[]).map(
                  (category) => {
                    const config = WORKOUT_CATEGORIES[category];
                    const isSelected = selectedCategory === category;

                    return (
                      <motion.button
                        key={category}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          'card p-6 text-left transition-all',
                          isSelected
                            ? 'ring-2 ring-primary-500 bg-primary-500/10'
                            : 'hover:bg-dark-700'
                        )}
                      >
                        <div className="text-4xl mb-3">{config.icon}</div>
                        <h3 className="font-semibold text-white">
                          {config.name}
                        </h3>
                        <p className="text-xs text-dark-400 mt-1">
                          {config.description}
                        </p>
                      </motion.button>
                    );
                  }
                )}
              </div>

              {selectedCategory && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <button
                    onClick={() => setStep(2)}
                    className="btn-primary w-full py-4 text-lg"
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 2: Set Goals (Time/Distance) */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h2 className="text-xl font-bold text-white mb-2">Set a Goal</h2>
              <p className="text-dark-400 mb-6">Optional: Set a time or distance target</p>

              {/* Goal Type Selection */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setGoalType('none')}
                  className={cn(
                    'flex-1 btn',
                    goalType === 'none' ? 'btn-primary' : 'btn-secondary'
                  )}
                >
                  No Goal
                </button>
                <button
                  onClick={() => setGoalType('time')}
                  className={cn(
                    'flex-1 btn',
                    goalType === 'time' ? 'btn-primary' : 'btn-secondary'
                  )}
                >
                  <Clock className="w-4 h-4 mr-1" /> Time
                </button>
                {canSetDistanceGoal && (
                  <button
                    onClick={() => setGoalType('distance')}
                    className={cn(
                      'flex-1 btn',
                      goalType === 'distance' ? 'btn-primary' : 'btn-secondary'
                    )}
                  >
                    <Route className="w-4 h-4 mr-1" /> Distance
                  </button>
                )}
              </div>

              {/* Time Goal */}
              {goalType === 'time' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <label className="label">Select Duration</label>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {PREDEFINED_TIMES.map((time) => (
                      <button
                        key={time.value}
                        onClick={() => {
                          setTimeGoal(time.value);
                          setCustomTime('');
                        }}
                        className={cn(
                          'btn text-sm py-3',
                          timeGoal === time.value
                            ? 'btn-primary'
                            : 'btn-secondary'
                        )}
                      >
                        {time.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Custom minutes"
                      value={customTime}
                      onChange={(e) => {
                        setCustomTime(e.target.value);
                        setTimeGoal(parseInt(e.target.value) * 60 || null);
                      }}
                      className="input"
                    />
                  </div>
                  {timeGoal && (
                    <p className="text-sm text-primary-400 mt-2">
                      Goal: {formatDuration(timeGoal)}
                    </p>
                  )}
                </motion.div>
              )}

              {/* Distance Goal */}
              {goalType === 'distance' && canSetDistanceGoal && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <label className="label">Select Distance</label>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {PREDEFINED_DISTANCES.map((dist) => (
                      <button
                        key={dist.value}
                        onClick={() => {
                          setDistanceGoal(dist.value);
                          setCustomDistance('');
                        }}
                        className={cn(
                          'btn text-sm py-3',
                          distanceGoal === dist.value
                            ? 'btn-primary'
                            : 'btn-secondary'
                        )}
                      >
                        {dist.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Custom km"
                      value={customDistance}
                      onChange={(e) => {
                        setCustomDistance(e.target.value);
                        setDistanceGoal(parseFloat(e.target.value) || null);
                      }}
                      className="input"
                    />
                  </div>
                  {distanceGoal && (
                    <p className="text-sm text-primary-400 mt-2">
                      Goal: {distanceGoal} km
                    </p>
                  )}
                </motion.div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-4"
                >
                  Back
                </button>
                <button
                  onClick={handleStartWorkout}
                  disabled={isLoading}
                  className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    'Starting...'
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Start Workout
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
