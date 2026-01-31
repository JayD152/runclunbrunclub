'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Target, Clock, Route, Sparkles, Zap, Crown, User, Music, ExternalLink, Rocket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import {
  WorkoutCategory,
  WORKOUT_CATEGORIES,
  PREDEFINED_TIMES,
  PREDEFINED_DISTANCES,
  STRUCTURED_WORKOUTS,
} from '@/types/workout';
import { cn, formatDuration } from '@/lib/utils';

type GoalType = 'open' | 'time' | 'distance';
type StrengthMode = 'open' | 'structured' | 'coach';

interface CoachRoutine {
  id: string;
  name: string;
  description: string | null;
  category: string;
  preWorkoutMessage: string | null;
  playlistLink: string | null;
  coach: { id: string; name: string | null; image: string | null };
  exercises: Array<{
    id: string;
    name: string;
    duration: number;
    countDirection: string;
    restAfter: number | null;
    sets: number | null;
    reps: number | null;
    message: string | null;
  }>;
}

interface NewWorkoutClientProps {
  clubSessionId?: string;
  coachRoutines?: CoachRoutine[];
}

export default function NewWorkoutClient({ clubSessionId, coachRoutines = [] }: NewWorkoutClientProps) {
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
  const [selectedCoachRoutine, setSelectedCoachRoutine] = useState<string | null>(null);
  
  // Pre-workout message screen
  const [showPreWorkoutMessage, setShowPreWorkoutMessage] = useState(false);

  const canSetDistanceGoal = selectedCategory === 'RUNNING' || selectedCategory === 'WALKING';
  const isStrength = selectedCategory === 'STRENGTH';
  
  // Filter coach routines by selected category
  const categoryCoachRoutines = coachRoutines.filter(r => r.category === selectedCategory);
  const hasCoachRoutines = categoryCoachRoutines.length > 0;
  
  // Get selected coach routine data
  const selectedRoutineData = selectedCoachRoutine 
    ? coachRoutines.find(r => r.id === selectedCoachRoutine) 
    : null;

  const handleStartWorkout = async () => {
    if (!selectedCategory) return;
    
    // If coach routine with pre-workout message, show message screen first
    if (selectedRoutineData?.preWorkoutMessage && !showPreWorkoutMessage) {
      setShowPreWorkoutMessage(true);
      return;
    }

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
          coachRoutineId: strengthMode === 'coach' ? selectedCoachRoutine : null,
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
                  
                  <div className={cn(
                    'grid gap-3 mb-8',
                    hasCoachRoutines ? 'grid-cols-3' : 'grid-cols-2'
                  )}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setStrengthMode('open');
                        setSelectedStructuredWorkout(null);
                        setSelectedCoachRoutine(null);
                      }}
                      className={cn(
                        'card p-4 text-left transition-all',
                        strengthMode === 'open'
                          ? 'ring-2 ring-primary-500 bg-primary-500/10'
                          : 'hover:bg-dark-700'
                      )}
                    >
                      <Sparkles className="w-7 h-7 text-purple-400 mb-2" />
                      <h3 className="font-semibold text-white text-sm">Open</h3>
                      <p className="text-xs text-dark-400 mt-1">Log as you go</p>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setStrengthMode('structured');
                        setSelectedCoachRoutine(null);
                      }}
                      className={cn(
                        'card p-4 text-left transition-all',
                        strengthMode === 'structured'
                          ? 'ring-2 ring-primary-500 bg-primary-500/10'
                          : 'hover:bg-dark-700'
                      )}
                    >
                      <Zap className="w-7 h-7 text-yellow-400 mb-2" />
                      <h3 className="font-semibold text-white text-sm">Guided</h3>
                      <p className="text-xs text-dark-400 mt-1">Built-in routines</p>
                    </motion.button>

                    {hasCoachRoutines && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setStrengthMode('coach');
                          setSelectedStructuredWorkout(null);
                        }}
                        className={cn(
                          'card p-4 text-left transition-all',
                          strengthMode === 'coach'
                            ? 'ring-2 ring-primary-500 bg-primary-500/10'
                            : 'hover:bg-dark-700'
                        )}
                      >
                        <Crown className="w-7 h-7 text-orange-400 mb-2" />
                        <h3 className="font-semibold text-white text-sm">Coach</h3>
                        <p className="text-xs text-dark-400 mt-1">Coach routines</p>
                      </motion.button>
                    )}
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

                  {/* Coach Routine Selection */}
                  {strengthMode === 'coach' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6"
                    >
                      <label className="label">Coach Routines</label>
                      <div className="space-y-3">
                        {categoryCoachRoutines.map((routine) => {
                          const totalDuration = routine.exercises.reduce((sum, ex) => 
                            sum + ex.duration + (ex.restAfter || 0), 0
                          );
                          return (
                            <button
                              key={routine.id}
                              onClick={() => setSelectedCoachRoutine(routine.id)}
                              className={cn(
                                'w-full card p-4 text-left transition-all',
                                selectedCoachRoutine === routine.id
                                  ? 'ring-2 ring-primary-500 bg-primary-500/10'
                                  : 'hover:bg-dark-700'
                              )}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-white">{routine.name}</h3>
                                  {routine.description && (
                                    <p className="text-xs text-dark-400 mt-1">{routine.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-2">
                                    {routine.coach.image ? (
                                      <Image
                                        src={routine.coach.image}
                                        alt={routine.coach.name || 'Coach'}
                                        width={20}
                                        height={20}
                                        className="rounded-full"
                                      />
                                    ) : (
                                      <div className="w-5 h-5 bg-dark-600 rounded-full flex items-center justify-center">
                                        <User className="w-3 h-3 text-dark-400" />
                                      </div>
                                    )}
                                    <span className="text-xs text-primary-400">
                                      Coach {routine.coach.name?.split(' ')[0] || 'Unknown'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm text-dark-500">
                                    {routine.exercises.length} exercises
                                  </span>
                                  <p className="text-xs text-dark-600 mt-1">
                                    ~{Math.ceil(totalDuration / 60)} min
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
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
                  disabled={
                    isLoading || 
                    (isStrength && strengthMode === 'structured' && !selectedStructuredWorkout) ||
                    (isStrength && strengthMode === 'coach' && !selectedCoachRoutine)
                  }
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

      {/* Pre-Workout Message Modal */}
      <AnimatePresence>
        {showPreWorkoutMessage && selectedRoutineData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="card w-full max-w-md text-center p-6"
            >
              {/* Coach Info */}
              <div className="flex items-center justify-center gap-2 mb-4">
                {selectedRoutineData.coach.image ? (
                  <Image
                    src={selectedRoutineData.coach.image}
                    alt={selectedRoutineData.coach.name || 'Coach'}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <Crown className="w-5 h-5 text-orange-400" />
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm text-dark-400">Message from</p>
                  <p className="font-semibold text-white">
                    Coach {selectedRoutineData.coach.name?.split(' ')[0] || 'Unknown'}
                  </p>
                </div>
              </div>

              {/* Routine Name */}
              <h2 className="text-xl font-bold text-white mb-4">
                {selectedRoutineData.name}
              </h2>

              {/* Pre-Workout Message */}
              <div className="bg-dark-700/50 rounded-xl p-4 mb-6">
                <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">
                  {selectedRoutineData.preWorkoutMessage}
                </p>
              </div>

              {/* Playlist Link */}
              {selectedRoutineData.playlistLink && (
                <a
                  href={selectedRoutineData.playlistLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 mb-6 p-3 bg-green-500/20 hover:bg-green-500/30 rounded-lg transition-colors"
                >
                  <Music className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-medium">Open Workout Playlist</span>
                  <ExternalLink className="w-4 h-4 text-green-400" />
                </a>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPreWorkoutMessage(false)}
                  className="btn-secondary flex-1 py-4"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    // Now actually start the workout
                    setShowPreWorkoutMessage(false);
                    setIsLoading(true);
                    // Call the actual start logic
                    (async () => {
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
                            coachRoutineId: strengthMode === 'coach' ? selectedCoachRoutine : null,
                          }),
                        });
                        if (!response.ok) throw new Error('Failed to create workout');
                        const workout = await response.json();
                        router.push(`/workout/${workout.id}`);
                      } catch (error) {
                        console.error('Error starting workout:', error);
                        setIsLoading(false);
                      }
                    })();
                  }}
                  disabled={isLoading}
                  className="btn-primary flex-1 py-4 text-lg flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    'Starting...'
                  ) : (
                    <>
                      <Rocket className="w-5 h-5" />
                      Let&apos;s GO!
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
