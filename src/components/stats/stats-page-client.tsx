'use client';

import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Flame,
  Clock,
  Route,
  Zap,
  TrendingUp,
  Calendar,
  Award,
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { StreakData, WeeklyStatData, WorkoutData, WORKOUT_CATEGORIES } from '@/types/workout';
import { formatDuration, formatDistance } from '@/lib/utils';
import BottomNav from '@/components/ui/bottom-nav';
import WorkoutCard from '@/components/workout/workout-card';

interface StatsPageClientProps {
  streak: StreakData | null;
  currentWeekStats: WeeklyStatData | null;
  weeklyHistory: WeeklyStatData[];
  allTimeStats: {
    totalWorkouts: number;
    totalDuration: number;
    totalDistance: number;
    totalCalories: number;
  };
  categoryStats: Array<{
    category: string;
    _count: number;
  }>;
  recentWorkouts: WorkoutData[];
}

export default function StatsPageClient({
  streak,
  currentWeekStats,
  weeklyHistory,
  allTimeStats,
  categoryStats,
  recentWorkouts,
}: StatsPageClientProps) {
  // Prepare chart data
  const chartData = weeklyHistory
    .reverse()
    .map((week) => ({
      week: format(new Date(week.weekStart), 'MMM d'),
      workouts: week.totalWorkouts,
      duration: Math.round(week.totalDuration / 60), // Convert to minutes
    }));

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-dark-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Your Stats</h1>
            <p className="text-sm text-dark-400">Track your progress</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Streak Banner */}
        {streak && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🔥</div>
                <div>
                  <p className="text-3xl font-bold text-white">
                    {streak.currentStreak}
                  </p>
                  <p className="text-sm text-dark-300">Day Streak</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-dark-400">Personal Best</p>
                <p className="text-xl font-semibold text-orange-400">
                  {streak.longestStreak} days
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* This Week */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">THIS WEEK</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              icon={<Calendar className="w-5 h-5 text-blue-400" />}
              value={currentWeekStats?.totalWorkouts || 0}
              label="Workouts"
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-purple-400" />}
              value={formatDuration(currentWeekStats?.totalDuration || 0)}
              label="Total Time"
              isText
            />
            <StatCard
              icon={<Route className="w-5 h-5 text-green-400" />}
              value={formatDistance(currentWeekStats?.totalDistance || 0)}
              label="Distance"
              isText
            />
            <StatCard
              icon={<Zap className="w-5 h-5 text-yellow-400" />}
              value={currentWeekStats?.totalCalories || 0}
              label="Calories"
              suffix=" cal"
            />
          </div>
        </section>

        {/* Weekly Progress Chart */}
        {chartData.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-dark-400 mb-3">
              WEEKLY PROGRESS
            </h2>
            <div className="card p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis
                    dataKey="week"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="workouts"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#ef4444' }}
                    name="Workouts"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Category Breakdown */}
        {categoryStats.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-dark-400 mb-3">
              BY CATEGORY
            </h2>
            <div className="card p-4 space-y-3">
              {categoryStats.map((stat) => {
                const category =
                  WORKOUT_CATEGORIES[stat.category as keyof typeof WORKOUT_CATEGORIES];
                const percentage = Math.round(
                  (stat._count / allTimeStats.totalWorkouts) * 100
                );

                return (
                  <div key={stat.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span className="text-white">{category.name}</span>
                      </div>
                      <span className="text-dark-400">
                        {stat._count} ({percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className={`h-full ${category.color}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* All-Time Stats */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">ALL TIME</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 col-span-2">
              <div className="flex items-center gap-4">
                <Award className="w-10 h-10 text-yellow-400" />
                <div>
                  <p className="text-3xl font-bold text-white">
                    {allTimeStats.totalWorkouts}
                  </p>
                  <p className="text-sm text-dark-400">Total Workouts</p>
                </div>
              </div>
            </div>
            <StatCard
              icon={<Clock className="w-5 h-5 text-purple-400" />}
              value={Math.round(allTimeStats.totalDuration / 3600)}
              label="Hours"
              suffix=" hrs"
            />
            <StatCard
              icon={<Route className="w-5 h-5 text-green-400" />}
              value={allTimeStats.totalDistance.toFixed(1)}
              label="Distance"
              suffix=" km"
            />
          </div>
        </section>

        {/* Recent Workouts */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">
            WORKOUT HISTORY
          </h2>
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
                Complete your first workout to see it here
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
  suffix,
  isText,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  suffix?: string;
  isText?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card p-4"
    >
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <p className="text-2xl font-bold text-white">
        {isText ? value : `${value}${suffix || ''}`}
      </p>
      <p className="text-sm text-dark-400">{label}</p>
    </motion.div>
  );
}
