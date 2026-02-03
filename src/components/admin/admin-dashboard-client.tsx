'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Shield,
  Users,
  Crown,
  Trash2,
  ChevronDown,
  Dumbbell,
  Activity,
  X,
  Check,
  Eye,
  Clock,
  Flame,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: 'USER' | 'COACH' | 'ADMIN';
  createdAt: Date;
  _count: {
    workouts: number;
    coachRoutines: number;
  };
}

interface WorkoutDetails {
  id: string;
  category: string;
  status: string;
  startTime: string;
  endTime: string | null;
  totalDuration: number | null;
  distance: number | null;
  caloriesBurned: number | null;
  notes: string | null;
  splits: Array<{
    id: string;
    splitNumber: number;
    distance: number;
    duration: number;
    pace: number | null;
  }>;
  activities: Array<{
    id: string;
    name: string;
    sets: number | null;
    reps: number | null;
    weight: number | null;
    duration: number | null;
    notes: string | null;
    timestamp: string;
  }>;
}

interface UserWorkoutHistory {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
    createdAt: string;
  };
  workouts: WorkoutDetails[];
  stats: {
    totalWorkouts: number;
    completedWorkouts: number;
    totalDuration: number;
    totalDistance: number;
    totalCalories: number;
    categoryCounts: Record<string, number>;
  };
}

interface AdminDashboardClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  initialUsers: User[];
  stats: {
    totalUsers: number;
    totalCoaches: number;
    totalAdmins: number;
    totalWorkouts: number;
    totalRoutines: number;
  };
}

const roleColors = {
  USER: 'bg-dark-600 text-dark-300',
  COACH: 'bg-blue-500/20 text-blue-400',
  ADMIN: 'bg-red-500/20 text-red-400',
};

const roleIcons = {
  USER: Users,
  COACH: Dumbbell,
  ADMIN: Shield,
};

export default function AdminDashboardClient({
  user,
  initialUsers,
  stats,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState<string | null>(null);
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false);
  const [workoutHistory, setWorkoutHistory] = useState<UserWorkoutHistory | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedWorkout, setExpandedWorkout] = useState<string | null>(null);

  const handleSearch = async (searchTerm: string) => {
    setSearch(searchTerm);
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'USER' | 'COACH' | 'ADMIN') => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setUsers(prev =>
          prev.map(u => (u.id === userId ? { ...u, role: updatedUser.role } : u))
        );
        setShowRoleMenu(null);
      }
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
        setShowDeleteConfirm(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const viewWorkoutHistory = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setLoadingHistory(true);
    setShowWorkoutHistory(true);
    setExpandedWorkout(null);

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/workouts`);
      if (res.ok) {
        const data = await res.json();
        setWorkoutHistory(data);
      }
    } catch (error) {
      console.error('Error fetching workout history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      RUNNING: 'bg-green-500/20 text-green-400',
      WALKING: 'bg-blue-500/20 text-blue-400',
      CYCLING: 'bg-yellow-500/20 text-yellow-400',
      GYM: 'bg-purple-500/20 text-purple-400',
      SPORTS: 'bg-orange-500/20 text-orange-400',
      YOGA: 'bg-pink-500/20 text-pink-400',
      OTHER: 'bg-dark-500/20 text-dark-300',
    };
    return colors[category] || colors.OTHER;
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
                <Shield className="w-5 h-5 text-red-400" />
                Admin Dashboard
              </h1>
              <p className="text-sm text-dark-400">Manage users and roles</p>
            </div>
          </div>
          <Link href="/coach" className="btn-secondary text-sm">
            <Dumbbell className="w-4 h-4 mr-2" />
            Coach Panel
          </Link>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-primary-400" />
              <span className="text-xs text-dark-400">Total Users</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-dark-400">Coaches</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalCoaches}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-red-400" />
              <span className="text-xs text-dark-400">Admins</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalAdmins}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-xs text-dark-400">Workouts</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalWorkouts}</p>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-4 h-4 text-yellow-400" />
              <span className="text-xs text-dark-400">Routines</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.totalRoutines}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>

        {/* Users List */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">USERS</h2>
          <div className="space-y-2">
            {loading ? (
              <div className="card p-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : users.length === 0 ? (
              <div className="card p-8 text-center">
                <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
                <p className="text-dark-400">No users found</p>
              </div>
            ) : (
              users.map((u) => {
                const RoleIcon = roleIcons[u.role];
                const isCurrentUser = u.id === user.id;

                return (
                  <motion.div
                    key={u.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'card p-4',
                      isCurrentUser && 'ring-2 ring-primary-500/30'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {u.image ? (
                          <Image
                            src={u.image}
                            alt={u.name || ''}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                            {u.name?.[0] || '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white flex items-center gap-2">
                            {u.name || 'Unknown'}
                            {isCurrentUser && (
                              <span className="text-xs text-primary-400">(You)</span>
                            )}
                          </p>
                          <p className="text-sm text-dark-400">{u.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Role Badge/Dropdown */}
                        <div className="relative">
                          <button
                            onClick={() =>
                              !isCurrentUser && setShowRoleMenu(showRoleMenu === u.id ? null : u.id)
                            }
                            disabled={isCurrentUser}
                            className={cn(
                              'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors',
                              roleColors[u.role],
                              !isCurrentUser && 'cursor-pointer hover:opacity-80'
                            )}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {u.role}
                            {!isCurrentUser && <ChevronDown className="w-3 h-3" />}
                          </button>

                          {/* Role Dropdown */}
                          <AnimatePresence>
                            {showRoleMenu === u.id && (
                              <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-lg z-10 overflow-hidden min-w-[120px]"
                              >
                                {(['USER', 'COACH', 'ADMIN'] as const).map((role) => (
                                  <button
                                    key={role}
                                    onClick={() => handleRoleChange(u.id, role)}
                                    className={cn(
                                      'w-full px-3 py-2 text-left text-sm hover:bg-dark-700 flex items-center gap-2',
                                      u.role === role && 'bg-dark-700'
                                    )}
                                  >
                                    {u.role === role && <Check className="w-3 h-3" />}
                                    <span className={u.role === role ? 'ml-0' : 'ml-5'}>{role}</span>
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        {/* Delete Button */}
                        {!isCurrentUser && (
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowDeleteConfirm(true);
                            }}
                            className="p-2 text-dark-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        {/* View History Button */}
                        <button
                          onClick={() => viewWorkoutHistory(u)}
                          className="p-2 text-dark-400 hover:text-primary-400 transition-colors"
                          title="View workout history"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* User Stats */}
                    <div className="flex items-center gap-4 mt-3 text-xs text-dark-500">
                      <span className="cursor-pointer hover:text-primary-400" onClick={() => viewWorkoutHistory(u)}>
                        {u._count.workouts} workouts
                      </span>
                      {u.role === 'COACH' && <span>{u._count.coachRoutines} routines</span>}
                      <span>Joined {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}</span>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-sm p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold text-white mb-2">Delete User?</h2>
              <p className="text-dark-400 mb-4">
                Are you sure you want to delete{' '}
                <span className="text-white font-medium">{selectedUser.name || selectedUser.email}</span>?
              </p>
              <p className="text-sm text-red-400 mb-6">
                This will permanently delete all their workouts, stats, and data. This action cannot be undone.
              </p>
              <div className="space-y-3">
                <button onClick={handleDeleteUser} className="btn-danger w-full py-3">
                  Delete User
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary w-full py-3"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Workout History Modal */}
        {showWorkoutHistory && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
            onClick={() => setShowWorkoutHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-dark-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedUser.image ? (
                    <Image
                      src={selectedUser.image}
                      alt={selectedUser.name || ''}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white">
                      {selectedUser.name?.[0] || '?'}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {selectedUser.name || 'Unknown User'}
                    </h2>
                    <p className="text-sm text-dark-400">{selectedUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWorkoutHistory(false)}
                  className="p-2 text-dark-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
                  </div>
                ) : workoutHistory ? (
                  <div className="space-y-4">
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-dark-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-white">{workoutHistory.stats.totalWorkouts}</p>
                        <p className="text-xs text-dark-400">Total Workouts</p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-400">{workoutHistory.stats.completedWorkouts}</p>
                        <p className="text-xs text-dark-400">Completed</p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-400">{formatDuration(workoutHistory.stats.totalDuration)}</p>
                        <p className="text-xs text-dark-400">Total Time</p>
                      </div>
                      <div className="bg-dark-800 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-orange-400">{workoutHistory.stats.totalCalories.toLocaleString()}</p>
                        <p className="text-xs text-dark-400">Calories</p>
                      </div>
                    </div>

                    {/* Category Breakdown */}
                    {Object.keys(workoutHistory.stats.categoryCounts).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(workoutHistory.stats.categoryCounts).map(([category, count]) => (
                          <span
                            key={category}
                            className={cn('px-2 py-1 rounded-lg text-xs font-medium', getCategoryColor(category))}
                          >
                            {category}: {count}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Workouts List */}
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-dark-400">WORKOUT HISTORY</h3>
                      {workoutHistory.workouts.length === 0 ? (
                        <div className="text-center py-8 text-dark-500">
                          <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No workouts yet</p>
                        </div>
                      ) : (
                        workoutHistory.workouts.map((workout) => (
                          <div key={workout.id} className="bg-dark-800 rounded-lg overflow-hidden">
                            <button
                              onClick={() => setExpandedWorkout(expandedWorkout === workout.id ? null : workout.id)}
                              className="w-full p-3 flex items-center justify-between hover:bg-dark-700/50 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className={cn('px-2 py-1 rounded text-xs font-medium', getCategoryColor(workout.category))}>
                                  {workout.category}
                                </span>
                                <div className="text-left">
                                  <p className="text-sm text-white">
                                    {format(new Date(workout.startTime), 'MMM d, yyyy')}
                                  </p>
                                  <p className="text-xs text-dark-400">
                                    {format(new Date(workout.startTime), 'h:mm a')}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  {workout.totalDuration && (
                                    <p className="text-sm text-white flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatDuration(workout.totalDuration)}
                                    </p>
                                  )}
                                  <span className={cn(
                                    'text-xs',
                                    workout.status === 'COMPLETED' ? 'text-green-400' : 'text-yellow-400'
                                  )}>
                                    {workout.status}
                                  </span>
                                </div>
                                <ChevronRight
                                  className={cn(
                                    'w-4 h-4 text-dark-400 transition-transform',
                                    expandedWorkout === workout.id && 'rotate-90'
                                  )}
                                />
                              </div>
                            </button>

                            {/* Expanded Details */}
                            <AnimatePresence>
                              {expandedWorkout === workout.id && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-dark-700"
                                >
                                  <div className="p-3 space-y-3">
                                    {/* Workout Metrics */}
                                    <div className="flex flex-wrap gap-4 text-sm">
                                      {workout.distance && (
                                        <span className="text-dark-300">
                                          📍 {workout.distance.toFixed(2)} km
                                        </span>
                                      )}
                                      {workout.caloriesBurned && (
                                        <span className="text-dark-300">
                                          🔥 {workout.caloriesBurned} cal
                                        </span>
                                      )}
                                    </div>

                                    {/* Notes */}
                                    {workout.notes && (
                                      <div className="bg-dark-900 rounded p-2">
                                        <p className="text-xs text-dark-400 mb-1">Notes</p>
                                        <p className="text-sm text-dark-300">{workout.notes}</p>
                                      </div>
                                    )}

                                    {/* Splits */}
                                    {workout.splits.length > 0 && (
                                      <div>
                                        <p className="text-xs text-dark-400 mb-2">Splits</p>
                                        <div className="space-y-1">
                                          {workout.splits.map((split) => (
                                            <div
                                              key={split.id}
                                              className="flex justify-between text-xs bg-dark-900 rounded px-2 py-1"
                                            >
                                              <span className="text-dark-300">
                                                Split {split.splitNumber}
                                              </span>
                                              <span className="text-dark-400">
                                                {split.distance.toFixed(2)} km • {formatDuration(split.duration)}
                                                {split.pace && ` • ${split.pace.toFixed(2)} min/km`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}

                                    {/* Activities */}
                                    {workout.activities.length > 0 && (
                                      <div>
                                        <p className="text-xs text-dark-400 mb-2">Activities</p>
                                        <div className="space-y-1">
                                          {workout.activities.map((activity) => (
                                            <div
                                              key={activity.id}
                                              className="flex justify-between text-xs bg-dark-900 rounded px-2 py-1"
                                            >
                                              <span className="text-dark-300">
                                                {activity.name}
                                              </span>
                                              <span className="text-dark-400">
                                                {activity.sets && activity.reps && (
                                                  <>{activity.sets}x{activity.reps}</>
                                                )}
                                                {activity.weight && ` @ ${activity.weight}kg`}
                                                {activity.duration && ` • ${formatDuration(activity.duration)}`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-dark-500">
                    Failed to load workout history
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
