'use client';

import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  ArrowLeft,
  LogOut,
  Award,
  Clock,
  Route,
  Flame,
  Calendar,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { StreakData } from '@/types/workout';
import { formatDuration, formatDistance } from '@/lib/utils';
import BottomNav from '@/components/ui/bottom-nav';

interface ProfilePageClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    createdAt: Date;
  };
  streak: StreakData | null;
  allTimeStats: {
    totalWorkouts: number;
    totalDuration: number;
    totalDistance: number;
    totalCalories: number;
  };
}

export default function ProfilePageClient({
  user,
  streak,
  allTimeStats,
}: ProfilePageClientProps) {
  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-dark-400 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-lg font-bold text-white">Profile</h1>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-ghost text-red-400"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6 text-center"
        >
          <div className="mb-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || 'User'}
                width={96}
                height={96}
                className="w-24 h-24 rounded-full mx-auto ring-4 ring-primary-500/30"
              />
            ) : (
              <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-3xl text-white font-bold">
                {user.name?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <h2 className="text-xl font-bold text-white">{user.name}</h2>
          <p className="text-dark-400">{user.email}</p>
          <p className="text-sm text-dark-500 mt-2 flex items-center justify-center gap-1">
            <Calendar className="w-4 h-4" />
            Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
          </p>
        </motion.div>

        {/* Streak */}
        {streak && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card bg-gradient-to-r from-orange-600/20 to-red-600/20 border-orange-500/30 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Flame className="w-8 h-8 text-orange-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {streak.currentStreak} Day Streak
                  </p>
                  <p className="text-sm text-dark-300">
                    Personal Best: {streak.longestStreak} days
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">
            YOUR ACHIEVEMENTS
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="card p-4"
            >
              <Award className="w-6 h-6 text-yellow-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {allTimeStats.totalWorkouts}
              </p>
              <p className="text-sm text-dark-400">Total Workouts</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="card p-4"
            >
              <Clock className="w-6 h-6 text-purple-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {Math.round(allTimeStats.totalDuration / 3600)}
              </p>
              <p className="text-sm text-dark-400">Hours Trained</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="card p-4"
            >
              <Route className="w-6 h-6 text-green-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {allTimeStats.totalDistance.toFixed(1)}
              </p>
              <p className="text-sm text-dark-400">Kilometers</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="card p-4"
            >
              <Flame className="w-6 h-6 text-orange-400 mb-2" />
              <p className="text-2xl font-bold text-white">
                {allTimeStats.totalCalories.toLocaleString()}
              </p>
              <p className="text-sm text-dark-400">Calories Burned</p>
            </motion.div>
          </div>
        </section>

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="btn-secondary w-full py-4 flex items-center justify-center gap-2"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
