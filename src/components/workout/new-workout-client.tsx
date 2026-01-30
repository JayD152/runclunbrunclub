'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Target, Clock, Route, Sparkles, Zap } from 'lucide-react';
import Link from 'next/link';
import {
  WorkoutCategory,
  WORKOUT_CATEGORIES,
  PREDEFINED_TIMES,
  PREDEFINED_DISTANCES,
  STRUCTURED_WORKOUTS,
} from '@/types/workout';
import { cn, formatDuration } from '@/lib/utils';

type GoalType = 'open' | 'time' | 'distance';
type StrengthMode = 'open' | 'structured';

interface NewWorkoutClientProps {
  clubSessionId?: string;
}

export default function NewWorkoutClient({ clubSessionId }: NewWorkoutClientProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<WorkoutCategory | null>(null);
  const [goalType, setGoalType] = useState<GoalType>('open');
  const [timeGoal, setTimeGoal] = useState<number | null>(null);
  const [distanceGoal, setDistanceGoal] = useState<number | null>(null);
  const [customTime, setCustomTime] = useState('');
  const [customDistance, setCustomDistance] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Strength workout mode
  const [strengthMode, setStrengthMode] = useState<StrengthMode>('open');
  const [selectedStructuredWorkout, setSelectedStructuredWorkout] = useState<string | null>(null);

  const canSetDistanceGoal = selectedCategory === 'RUNNING' || selectedCategory === 'WALKING';
  const isStrength = selectedCategory === 'STRENGTH';

  const handleStartWorkout = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/workouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          goalDuration: goalType === 'time' ? timeGoal : null,
          goalDistance: goalType === 'distance' ? distanceGoal : null,
          clubSessionId: clubSessionId || null,
          structuredWorkout: isStrength && strengthMode === 'structured' ? selectedStructuredWorkout : null,
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
            <p className="text-sm text-dark-400">Step {step} of 2</p>
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

          {/* Step 2: Set Goals / Mode */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Strength Workout Mode Selection */}
              {isStrength && (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">Workout Mode</h2>
                  <p className="text-dark-400 mb-6">Choose how you want to train</p>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setStrengthMode('open');
                        setSelectedStructuredWorkout(null);
                      }}
                      className={cn(
                        'card p-5 text-left transition-all',
                        strengthMode === 'open'
                          ? 'ring-2 ring-primary-500 bg-primary-500/10'
                          : 'hover:bg-dark-700'
                      )}
                    >
                      <Sparkles className="w-8 h-8 text-purple-400 mb-2" />
                      <h3 className="font-semibold text-white">Open</h3>
                      <p className="text-xs text-dark-400 mt-1">Be free - log activities as you go</p>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStrengthMode('structured')}
                      className={cn(
                        'card p-5 text-left transition-all',
                        strengthMode === 'structured'
                          ? 'ring-2 ring-primary-500 bg-primary-500/10'
                          : 'hover:bg-dark-700'
                      )}
                    >
                      <Zap className="w-8 h-8 text-yellow-400 mb-2" />
                      <h3 className="font-semibold text-white">Guided</h3>
                      <p className="text-xs text-dark-400 mt-1">Follow a structured routine</p>
                    </motion.button>
                  </div>
                  
                  {/* Structured Workout Selection */}
                  {strengthMode === 'structured' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <label className="label">Select Routine</label>
                      <div className="space-y-3">
                        {STRUCTURED_WORKOUTS.map((workout) => (
                          <button
                            key={workout.id}
                            onClick={() => setSelectedStructuredWorkout(workout.id)}
                            className={cn(
                              'w-full card p-4 text-left transition-all',
                              selectedStructuredWorkout === workout.id
                                ? 'ring-2 ring-primary-500 bg-primary-500/10'
                                : 'hover:bg-dark-700'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-semibold text-white">{workout.name}</h3>
                                <p className="text-xs text-dark-400">{workout.description}</p>
                              </div>
                              <span className="text-sm text-dark-500">
                                {workout.exercises.length} exercises
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              )}

              {/* Non-Strength Goal Selection */}
              {!isStrength && (
                <>
                  <h2 className="text-xl font-bold text-white mb-2">Set a Goal</h2>
                  <p className="text-dark-400 mb-6">Or go free with no target</p>

                  {/* Goal Type Selection */}
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => {
                        setGoalType('open');
                        setTimeGoal(null);
                        setDistanceGoal(null);
                      }}
                      className={cn(
                        'flex-1 btn flex flex-col items-center py-4',
                        goalType === 'open' ? 'btn-primary' : 'btn-secondary'
                      )}
                    >
                      <Sparkles className="w-5 h-5 mb-1" />
                      <span>Open</span>
                      <span className="text-xs opacity-70">Be free</span>
                    </button>
                    <button
                      onClick={() => setGoalType('time')}
                      className={cn(
                        'flex-1 btn flex flex-col items-center py-4',
                        goalType === 'time' ? 'btn-primary' : 'btn-secondary'
                      )}
                    >
                      <Clock className="w-5 h-5 mb-1" />
                      <span>Time</span>
                      <span className="text-xs opacity-70">Countdown</span>
                    </button>
                    {canSetDistanceGoal && (
                      <button
                        onClick={() => setGoalType('distance')}
                        className={cn(
                          'flex-1 btn flex flex-col items-center py-4',
                          goalType === 'distance' ? 'btn-primary' : 'btn-secondary'
                        )}
                      >
                        <Route className="w-5 h-5 mb-1" />
                        <span>Distance</span>
                        <span className="text-xs opacity-70">Track km</span>
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
                </>
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
                  disabled={isLoading || (isStrength && strengthMode === 'structured' && !selectedStructuredWorkout)}
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
