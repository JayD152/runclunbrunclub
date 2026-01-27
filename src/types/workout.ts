export type WorkoutCategory = 'RUNNING' | 'STRENGTH' | 'WALKING' | 'SPORTS';
export type WorkoutStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface WorkoutData {
  id: string;
  userId: string;
  category: WorkoutCategory;
  status: WorkoutStatus;
  startTime: Date;
  endTime?: Date | null;
  totalDuration?: number | null;
  goalDuration?: number | null;
  distance?: number | null;
  goalDistance?: number | null;
  pace?: number | null;
  caloriesBurned?: number | null;
  caloriesSource?: string | null;
  notes?: string | null;
  clubSessionId?: string | null;
  splits?: Split[];
  activities?: Activity[];
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface Split {
  id: string;
  workoutId: string;
  splitNumber: number;
  distance: number;
  duration: number;
  pace: number;
  timestamp: Date;
}

export interface Activity {
  id: string;
  workoutId: string;
  name: string;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  duration?: number | null;
  notes?: string | null;
  timestamp: Date;
}

export interface ClubSessionData {
  id: string;
  hostId: string;
  code: string;
  name?: string | null;
  isActive: boolean;
  startTime: Date;
  endTime?: Date | null;
  host?: {
    id: string;
    name: string | null;
    image: string | null;
  };
  members?: ClubMemberData[];
  workouts?: WorkoutData[];
}

export interface ClubMemberData {
  id: string;
  userId: string;
  clubSessionId: string;
  joinedAt: Date;
  leftAt?: Date | null;
  user?: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export interface StreakData {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutAt?: Date | null;
}

export interface WeeklyStatData {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  totalWorkouts: number;
  totalDuration: number;
  totalDistance: number;
  totalCalories: number;
  runningCount: number;
  strengthCount: number;
  walkingCount: number;
  sportsCount: number;
}

// Timer states for workout tracking
export interface TimerState {
  isRunning: boolean;
  elapsed: number; // in seconds
  startedAt: Date | null;
}

// Predefined time options
export const PREDEFINED_TIMES = [
  { label: '5 min', value: 5 * 60 },
  { label: '10 min', value: 10 * 60 },
  { label: '15 min', value: 15 * 60 },
  { label: '20 min', value: 20 * 60 },
  { label: '30 min', value: 30 * 60 },
  { label: '45 min', value: 45 * 60 },
  { label: '60 min', value: 60 * 60 },
  { label: '90 min', value: 90 * 60 },
];

// Predefined distance options (in km)
export const PREDEFINED_DISTANCES = [
  { label: '1 km', value: 1 },
  { label: '2 km', value: 2 },
  { label: '3 km', value: 3 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
  { label: 'Half Marathon', value: 21.1 },
  { label: 'Marathon', value: 42.2 },
];

// Workout category config
export const WORKOUT_CATEGORIES = {
  RUNNING: {
    name: 'Running',
    icon: '🏃',
    color: 'bg-red-500',
    description: 'Track your runs with splits and pace',
  },
  STRENGTH: {
    name: 'Strength Training',
    icon: '💪',
    color: 'bg-orange-500',
    description: 'Log sets, reps, and weights',
  },
  WALKING: {
    name: 'Walking',
    icon: '🚶',
    color: 'bg-green-500',
    description: 'Track walks with time and distance',
  },
  SPORTS: {
    name: 'Sports',
    icon: '⚽',
    color: 'bg-blue-500',
    description: 'Log any sports activity',
  },
} as const;

// Common strength exercises
export const COMMON_EXERCISES = [
  'Push-ups',
  'Pull-ups',
  'Squats',
  'Lunges',
  'Deadlifts',
  'Bench Press',
  'Shoulder Press',
  'Rows',
  'Planks',
  'Burpees',
  'Dumbbell Curls',
  'Tricep Dips',
  'Leg Press',
  'Lat Pulldown',
  'Crunches',
];

// Common sports
export const COMMON_SPORTS = [
  'Basketball',
  'Soccer',
  'Tennis',
  'Swimming',
  'Cycling',
  'Volleyball',
  'Badminton',
  'Table Tennis',
  'Boxing',
  'Martial Arts',
  'Yoga',
  'HIIT',
  'CrossFit',
  'Dance',
  'Other',
];
