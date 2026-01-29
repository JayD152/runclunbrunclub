'use client';

import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Clock, Route, Flame } from 'lucide-react';
import Link from 'next/link';
import { WorkoutData, WORKOUT_CATEGORIES } from '@/types/workout';
import { formatDuration, formatDistance, cn } from '@/lib/utils';

interface WorkoutCardProps {
  workout: WorkoutData;
  showUser?: boolean;
}

export default function WorkoutCard({ workout, showUser }: WorkoutCardProps) {
  const category = WORKOUT_CATEGORIES[workout.category];
  const categoryClass = `category-${workout.category.toLowerCase()}`;

  return (
    <Link href={`/workout/${workout.id}/summary`}>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        className="card p-4"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl border',
                categoryClass
              )}
            >
              {category.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-500">
                {formatDistanceToNow(new Date(workout.startTime), {
                  addSuffix: true,
                })}
              </p>
              {showUser && workout.user && (
                <p className="text-xs text-gray-400 mt-1">
                  by {workout.user.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-4">
          {workout.totalDuration && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" />
              {formatDuration(workout.totalDuration)}
            </div>
          )}
          {workout.distance && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Route className="w-4 h-4 text-gray-400" />
              {formatDistance(workout.distance)}
            </div>
          )}
          {workout.caloriesBurned && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Flame className="w-4 h-4 text-gray-400" />
              {workout.caloriesBurned} cal
            </div>
          )}
        </div>

        {/* Splits preview for running */}
        {workout.splits && workout.splits.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              {workout.splits.length} split{workout.splits.length > 1 ? 's' : ''} recorded
            </p>
          </div>
        )}

        {/* Activities preview for strength/sports */}
        {workout.activities && workout.activities.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              {workout.activities.length} activit{workout.activities.length > 1 ? 'ies' : 'y'} logged
            </p>
          </div>
        )}
      </motion.div>
    </Link>
  );
}
