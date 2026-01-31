'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Dumbbell,
  Users,
  Trophy,
  Percent,
  X,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Clock,
  ArrowUp,
  ArrowDown,
  Shield,
  Timer,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { WORKOUT_CATEGORIES } from '@/types/workout';
import { formatDuration, cn } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  countDirection: string;
  restAfter: number | null;
  orderIndex: number;
  sets: number | null;
  reps: number | null;
}

interface Completion {
  id: string;
  completed: boolean;
  exercisesCompleted: number;
  startedAt: Date;
  completedAt: Date | null;
  user: { id: string; name: string | null; image: string | null };
}

interface Routine {
  id: string;
  name: string;
  description: string | null;
  category: string;
  isActive: boolean;
  createdAt: Date;
  exercises: Exercise[];
  completions: Completion[];
  _count: { completions: number };
}

interface CoachDashboardClientProps {
  user: {
    id: string;
    name?: string | null;
  };
  userRole: string;
  initialRoutines: Routine[];
  stats: {
    totalRoutines: number;
    totalCompletions: number;
    fullyCompleted: number;
    completionRate: number;
  };
}

export default function CoachDashboardClient({
  user,
  userRole,
  initialRoutines,
  stats,
}: CoachDashboardClientProps) {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>(initialRoutines);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<string>('STRENGTH');
  const [formExercises, setFormExercises] = useState<Array<{
    name: string;
    description: string;
    duration: number;
    countDirection: 'up' | 'down';
    restAfter: number;
    sets: number | null;
    reps: number | null;
  }>>([]);

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormCategory('STRENGTH');
    setFormExercises([]);
    setEditingRoutine(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (routine: Routine) => {
    setFormName(routine.name);
    setFormDescription(routine.description || '');
    setFormCategory(routine.category);
    setFormExercises(routine.exercises.map(e => ({
      name: e.name,
      description: e.description || '',
      duration: e.duration,
      countDirection: e.countDirection as 'up' | 'down',
      restAfter: e.restAfter || 0,
      sets: e.sets,
      reps: e.reps,
    })));
    setEditingRoutine(routine);
    setShowCreateModal(true);
  };

  const addExercise = () => {
    setFormExercises([
      ...formExercises,
      {
        name: '',
        description: '',
        duration: 60,
        countDirection: 'down',
        restAfter: 30,
        sets: null,
        reps: null,
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setFormExercises(formExercises.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: string, value: any) => {
    setFormExercises(formExercises.map((ex, i) => 
      i === index ? { ...ex, [field]: value } : ex
    ));
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const newExercises = [...formExercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newExercises.length) return;
    [newExercises[index], newExercises[newIndex]] = [newExercises[newIndex], newExercises[index]];
    setFormExercises(newExercises);
  };

  const handleSubmit = async () => {
    if (!formName || formExercises.length === 0) return;

    const exercisesData = formExercises.filter(e => e.name).map(e => ({
      name: e.name,
      description: e.description || null,
      duration: e.duration,
      countDirection: e.countDirection,
      restAfter: e.restAfter || null,
      sets: e.sets,
      reps: e.reps,
    }));

    try {
      if (editingRoutine) {
        // Update existing routine
        const res = await fetch(`/api/coach/routines/${editingRoutine.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDescription || null,
            category: formCategory,
            exercises: exercisesData,
          }),
        });

        if (res.ok) {
          router.refresh();
          setShowCreateModal(false);
          resetForm();
        }
      } else {
        // Create new routine
        const res = await fetch('/api/coach/routines', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            description: formDescription || null,
            category: formCategory,
            exercises: exercisesData,
          }),
        });

        if (res.ok) {
          router.refresh();
          setShowCreateModal(false);
          resetForm();
        }
      }
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  const toggleRoutineActive = async (routineId: string, isActive: boolean) => {
    try {
      const res = await fetch(`/api/coach/routines/${routineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (res.ok) {
        setRoutines(prev =>
          prev.map(r => (r.id === routineId ? { ...r, isActive: !isActive } : r))
        );
      }
    } catch (error) {
      console.error('Error toggling routine:', error);
    }
  };

  const deleteRoutine = async (routineId: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) return;

    try {
      const res = await fetch(`/api/coach/routines/${routineId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setRoutines(prev => prev.filter(r => r.id !== routineId));
      }
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

  const getTotalDuration = (exercises: Exercise[]) => {
    return exercises.reduce((sum, e) => sum + e.duration + (e.restAfter || 0), 0);
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-dark-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-blue-400" />
                Coach Dashboard
              </h1>
              <p className="text-sm text-dark-400">Create and manage routines</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRole === 'ADMIN' && (
              <Link href="/admin" className="btn-ghost text-sm">
                <Shield className="w-4 h-4 mr-1" />
                Admin
              </Link>
            )}
            <button onClick={openCreateModal} className="btn-primary text-sm">
              <Plus className="w-4 h-4 mr-1" />
              New Routine
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-dark-400">Routines</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalRoutines}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-400" />
              <span className="text-xs text-dark-400">Total Starts</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalCompletions}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-dark-400">Completed</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.fullyCompleted}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-purple-400" />
              <span className="text-xs text-dark-400">Completion Rate</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.completionRate}%</p>
          </div>
        </div>

        {/* Routines List */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">YOUR ROUTINES</h2>
          {routines.length === 0 ? (
            <div className="card p-8 text-center">
              <Dumbbell className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No routines yet</p>
              <p className="text-sm text-dark-500 mt-1">Create your first routine to get started</p>
              <button onClick={openCreateModal} className="btn-primary mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create Routine
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {routines.map((routine) => {
                const category = WORKOUT_CATEGORIES[routine.category as keyof typeof WORKOUT_CATEGORIES];
                const isExpanded = expandedRoutine === routine.id;

                return (
                  <motion.div
                    key={routine.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('card overflow-hidden', !routine.isActive && 'opacity-60')}
                  >
                    {/* Routine Header */}
                    <div
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category?.icon}</span>
                          <div>
                            <h3 className="font-semibold text-white flex items-center gap-2">
                              {routine.name}
                              {!routine.isActive && (
                                <span className="text-xs bg-dark-700 px-2 py-0.5 rounded">Hidden</span>
                              )}
                            </h3>
                            <p className="text-sm text-dark-400">
                              {routine.exercises.length} exercises • {formatDuration(getTotalDuration(routine.exercises))}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-dark-400">{routine._count.completions} uses</span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-dark-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-dark-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 border-t border-dark-700">
                            {/* Description */}
                            {routine.description && (
                              <p className="text-sm text-dark-400 py-3">{routine.description}</p>
                            )}

                            {/* Exercises */}
                            <div className="space-y-2 py-3">
                              <h4 className="text-xs text-dark-500 uppercase">Exercises</h4>
                              {routine.exercises.map((exercise, idx) => (
                                <div
                                  key={exercise.id}
                                  className="flex items-center justify-between bg-dark-800/50 rounded p-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-dark-500 w-5">{idx + 1}.</span>
                                    <span className="text-sm text-white">{exercise.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-dark-400">
                                    {exercise.sets && exercise.reps && (
                                      <span>{exercise.sets}×{exercise.reps}</span>
                                    )}
                                    <span className="flex items-center gap-1">
                                      <Timer className="w-3 h-3" />
                                      {formatDuration(exercise.duration)}
                                      {exercise.countDirection === 'up' ? '↑' : '↓'}
                                    </span>
                                    {exercise.restAfter && (
                                      <span className="text-green-400">+{exercise.restAfter}s rest</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Recent Completions */}
                            {routine.completions.length > 0 && (
                              <div className="py-3 border-t border-dark-700">
                                <h4 className="text-xs text-dark-500 uppercase mb-2">Recent Activity</h4>
                                <div className="space-y-1">
                                  {routine.completions.slice(0, 5).map((completion) => (
                                    <div
                                      key={completion.id}
                                      className="flex items-center justify-between text-sm"
                                    >
                                      <div className="flex items-center gap-2">
                                        {completion.user.image ? (
                                          <Image
                                            src={completion.user.image}
                                            alt={completion.user.name || ''}
                                            width={20}
                                            height={20}
                                            className="w-5 h-5 rounded-full"
                                          />
                                        ) : (
                                          <div className="w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center text-[10px] text-white">
                                            {completion.user.name?.[0] || '?'}
                                          </div>
                                        )}
                                        <span className="text-white">{completion.user.name || 'User'}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={cn(
                                          'text-xs px-1.5 py-0.5 rounded',
                                          completion.completed 
                                            ? 'bg-green-500/20 text-green-400' 
                                            : 'bg-yellow-500/20 text-yellow-400'
                                        )}>
                                          {completion.completed 
                                            ? '✓ Completed' 
                                            : `${completion.exercisesCompleted}/${routine.exercises.length}`}
                                        </span>
                                        <span className="text-xs text-dark-500">
                                          {formatDistanceToNow(new Date(completion.startedAt), { addSuffix: true })}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-3 border-t border-dark-700">
                              <button
                                onClick={() => openEditModal(routine)}
                                className="btn-secondary text-sm flex-1"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </button>
                              <button
                                onClick={() => toggleRoutineActive(routine.id, routine.isActive)}
                                className="btn-secondary text-sm"
                              >
                                {routine.isActive ? (
                                  <><EyeOff className="w-4 h-4 mr-1" />Hide</>
                                ) : (
                                  <><Eye className="w-4 h-4 mr-1" />Show</>
                                )}
                              </button>
                              <button
                                onClick={() => deleteRoutine(routine.id)}
                                className="btn-ghost text-red-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Create/Edit Routine Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black/60 overflow-y-auto"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="card w-full max-w-lg my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-dark-800 border-b border-dark-700 px-4 py-3 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {editingRoutine ? 'Edit Routine' : 'Create Routine'}
                </h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-dark-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Name */}
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Routine Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g., Morning HIIT Blast"
                    className="input w-full"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Description (optional)</label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="What is this routine about?"
                    className="input w-full resize-none"
                    rows={2}
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm text-dark-400 mb-1">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(WORKOUT_CATEGORIES).map(([key, cat]) => (
                      <button
                        key={key}
                        onClick={() => setFormCategory(key)}
                        className={cn(
                          'p-2 rounded-lg border text-center transition-colors',
                          formCategory === key
                            ? 'border-primary-500 bg-primary-500/20'
                            : 'border-dark-700 hover:border-dark-600'
                        )}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <p className="text-xs mt-1">{cat.name}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Exercises */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm text-dark-400">Exercises</label>
                    <button
                      onClick={addExercise}
                      className="text-primary-400 text-sm hover:text-primary-300"
                    >
                      <Plus className="w-4 h-4 inline mr-1" />
                      Add Exercise
                    </button>
                  </div>

                  <div className="space-y-3">
                    {formExercises.map((exercise, index) => (
                      <div key={index} className="bg-dark-700/50 rounded-lg p-3 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-dark-400">Exercise {index + 1}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => moveExercise(index, 'up')}
                              disabled={index === 0}
                              className="p-1 text-dark-400 hover:text-white disabled:opacity-30"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => moveExercise(index, 'down')}
                              disabled={index === formExercises.length - 1}
                              className="p-1 text-dark-400 hover:text-white disabled:opacity-30"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeExercise(index)}
                              className="p-1 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <input
                          type="text"
                          value={exercise.name}
                          onChange={(e) => updateExercise(index, 'name', e.target.value)}
                          placeholder="Exercise name"
                          className="input w-full text-sm"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-dark-500">Duration (sec)</label>
                            <input
                              type="number"
                              value={exercise.duration}
                              onChange={(e) => updateExercise(index, 'duration', parseInt(e.target.value) || 0)}
                              className="input w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dark-500">Timer</label>
                            <select
                              value={exercise.countDirection}
                              onChange={(e) => updateExercise(index, 'countDirection', e.target.value)}
                              className="input w-full text-sm"
                            >
                              <option value="down">Count Down</option>
                              <option value="up">Count Up</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-dark-500">Sets</label>
                            <input
                              type="number"
                              value={exercise.sets || ''}
                              onChange={(e) => updateExercise(index, 'sets', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="-"
                              className="input w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dark-500">Reps</label>
                            <input
                              type="number"
                              value={exercise.reps || ''}
                              onChange={(e) => updateExercise(index, 'reps', e.target.value ? parseInt(e.target.value) : null)}
                              placeholder="-"
                              className="input w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-dark-500">Rest After (sec)</label>
                            <input
                              type="number"
                              value={exercise.restAfter}
                              onChange={(e) => updateExercise(index, 'restAfter', parseInt(e.target.value) || 0)}
                              className="input w-full text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {formExercises.length === 0 && (
                      <div className="text-center py-6 text-dark-500 border border-dashed border-dark-700 rounded-lg">
                        Click "Add Exercise" to start building your routine
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview Duration */}
                {formExercises.length > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-dark-400 bg-dark-700/30 rounded-lg py-2">
                    <Clock className="w-4 h-4" />
                    Total duration: {formatDuration(formExercises.reduce((sum, e) => sum + e.duration + e.restAfter, 0))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-dark-800 border-t border-dark-700 px-4 py-3 flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formName || formExercises.length === 0}
                  className="btn-primary flex-1"
                >
                  {editingRoutine ? 'Save Changes' : 'Create Routine'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
