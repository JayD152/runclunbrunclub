'use client';

import { motion } from 'framer-motion';
import { Plus, Users, BarChart3, Flame, Timer, TrendingUp, Crown, Shield } from 'lucide-react';
import Link from 'next/link';
import { getTimeOfDayGreeting, getMotivationalMessage, formatDuration } from '@/lib/utils';
import { StreakData, WeeklyStatData, WorkoutData, ClubSessionData } from '@/types/workout';
import BottomNav from '@/components/ui/bottom-nav';
import UserAvatar from '@/components/ui/user-avatar';
import WorkoutCard from '@/components/workout/workout-card';

interface DashboardClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
  streak: StreakData;
  weeklyStats: WeeklyStatData;
  recentWorkouts: WorkoutData[];
  activeWorkout: WorkoutData | null;
  activeClubSession: ClubSessionData | null;
}

export default function DashboardClient({
  user,
  streak,
  weeklyStats,
  recentWorkouts,
  activeWorkout,
  activeClubSession,
}: DashboardClientProps) {
  const firstName = user.name?.split(' ')[0];
  const greeting = getTimeOfDayGreeting(firstName);
  const motivation = getMotivationalMessage();
  const isCoachOrAdmin = user.role === 'COACH' || user.role === 'ADMIN';
  const isAdmin = user.role === 'ADMIN';

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">{greeting}</h1>
            <p className="text-sm text-primary-400">{motivation}</p>
          </div>
          <UserAvatar user={user} />
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Active Workout Banner */}
        {activeWorkout && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href={`/workout/${activeWorkout.id}`}>
              <div className="card bg-gradient-to-r from-primary-600 to-accent-600 border-0 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Timer className="w-6 h-6 text-white" />
                    <span className="pulse-ring" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">Workout in Progress</p>
                    <p className="text-sm text-white/80">Tap to continue</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">
                    {activeWorkout.category}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Active Club Session Banner */}
        {activeClubSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href={`/club/${activeClubSession.id}`}>
              <div className="card bg-gradient-to-r from-blue-600 to-purple-600 border-0 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-6 h-6 text-white" />
                  <div>
                    <p className="font-semibold text-white">Club Session Active</p>
                    <p className="text-sm text-white/80">
                      Code: {activeClubSession.code}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Quick Stats */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">THIS WEEK</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Flame className="w-5 h-5 text-orange-400" />}
              value={streak.currentStreak}
              label="Day Streak"
              highlight={streak.currentStreak >= 7}
            />
            <StatCard
              icon={<TrendingUp className="w-5 h-5 text-green-400" />}
              value={weeklyStats.totalWorkouts}
              label="Workouts"
            />
            <StatCard
              icon={<Timer className="w-5 h-5 text-blue-400" />}
              value={formatDuration(weeklyStats.totalDuration)}
              label="Total Time"
              isTime
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
              value={weeklyStats.totalCalories}
              label="Calories"
            />
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">QUICK ACTIONS</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/workout/new">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="card p-4 flex items-center gap-3 bg-gradient-to-br from-primary-600 to-primary-700 border-0"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white">New Workout</p>
                  <p className="text-xs text-white/70">Start training</p>
                </div>
              </motion.div>
            </Link>
            <Link href="/club">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="card p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-semibold text-white">Club Session</p>
                  <p className="text-xs text-dark-400">Join or start</p>
                </div>
              </motion.div>
            </Link>
          </div>

          {/* Coach/Admin Actions */}
          {(isCoachOrAdmin || isAdmin) && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {isCoachOrAdmin && (
                <Link href="/coach">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="card p-4 flex items-center gap-3 bg-gradient-to-br from-orange-600/20 to-orange-700/20 border-orange-500/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Coach Mode</p>
                      <p className="text-xs text-orange-400">Create routines</p>
                    </div>
                  </motion.div>
                </Link>
              )}
              {isAdmin && (
                <Link href="/admin">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="card p-4 flex items-center gap-3 bg-gradient-to-br from-red-600/20 to-red-700/20 border-red-500/30"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">Admin Panel</p>
                      <p className="text-xs text-red-400">Manage users</p>
                    </div>
                  </motion.div>
                </Link>
              )}
            </div>
          )}
        </section>

        {/* Recent Workouts */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-dark-400">RECENT WORKOUTS</h2>
            <Link href="/stats" className="text-sm text-primary-400 hover:text-primary-300">
              View all
            </Link>
          </div>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-3">
              {recentWorkouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-dark-400">No workouts yet</p>
              <p className="text-sm text-dark-500 mt-1">
                Start your first workout to see it here
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  highlight,
  isTime,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  highlight?: boolean;
  isTime?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`card p-4 ${highlight ? 'ring-2 ring-orange-400/50' : ''}`}
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className={`text-2xl font-bold text-white ${isTime ? 'text-xl' : ''}`}>
        {value}
      </p>
      <p className="text-xs text-dark-400">{label}</p>
    </motion.div>
  );
}
