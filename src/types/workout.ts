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
  elapsedAt?: number | null; // seconds since workout start when added
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

// Structured workout exercise
export interface StructuredExercise {
  name: string;
  duration: number; // in seconds
  sets?: number;
  reps?: number;
  restAfter?: number; // rest time in seconds after exercise
  countDirection?: 'up' | 'down'; // timer direction
  message?: string; // coach message to display during exercise
}

// Structured workout definition
export interface StructuredWorkout {
  id: string;
  name: string;
  description: string;
  totalDuration: number; // in seconds
  exercises: StructuredExercise[];
}

// Predefined structured workouts
export const STRUCTURED_WORKOUTS: StructuredWorkout[] = [
  {
    id: 'upper-body-basics',
    name: 'Upper Body Basics',
    description: '15 min upper body circuit',
    totalDuration: 15 * 60,
    exercises: [
      { name: 'Push-ups', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Shoulder Taps', duration: 30, restAfter: 15 },
      { name: 'Tricep Dips', duration: 45, reps: 12, restAfter: 15 },
      { name: 'Plank', duration: 45, restAfter: 15 },
      { name: 'Diamond Push-ups', duration: 45, reps: 10, restAfter: 15 },
      { name: 'Arm Circles', duration: 30, restAfter: 15 },
      { name: 'Push-ups', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Shoulder Taps', duration: 30, restAfter: 15 },
      { name: 'Tricep Dips', duration: 45, reps: 12, restAfter: 15 },
      { name: 'Plank', duration: 60, restAfter: 0 },
    ],
  },
  {
    id: 'core-crusher',
    name: 'Core Crusher',
    description: '10 min intense ab workout',
    totalDuration: 10 * 60,
    exercises: [
      { name: 'Crunches', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Leg Raises', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Plank', duration: 45, restAfter: 15 },
      { name: 'Russian Twists', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Mountain Climbers', duration: 30, restAfter: 15 },
      { name: 'Bicycle Crunches', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Dead Bug', duration: 45, restAfter: 15 },
      { name: 'Plank', duration: 60, restAfter: 0 },
    ],
  },
  {
    id: 'lower-body-burn',
    name: 'Lower Body Burn',
    description: '15 min leg and glute workout',
    totalDuration: 15 * 60,
    exercises: [
      { name: 'Squats', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Lunges', duration: 45, reps: 12, restAfter: 15 },
      { name: 'Glute Bridges', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Wall Sit', duration: 45, restAfter: 15 },
      { name: 'Jump Squats', duration: 30, reps: 10, restAfter: 20 },
      { name: 'Calf Raises', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Squats', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Reverse Lunges', duration: 45, reps: 12, restAfter: 15 },
      { name: 'Glute Bridges', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Wall Sit', duration: 60, restAfter: 0 },
    ],
  },
  {
    id: 'full-body-hiit',
    name: 'Full Body HIIT',
    description: '20 min high intensity workout',
    totalDuration: 20 * 60,
    exercises: [
      { name: 'Jumping Jacks', duration: 45, restAfter: 15 },
      { name: 'Push-ups', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Squats', duration: 45, reps: 20, restAfter: 15 },
      { name: 'Burpees', duration: 30, reps: 8, restAfter: 20 },
      { name: 'Mountain Climbers', duration: 45, restAfter: 15 },
      { name: 'Plank', duration: 45, restAfter: 15 },
      { name: 'Jump Squats', duration: 30, reps: 10, restAfter: 20 },
      { name: 'Tricep Dips', duration: 45, reps: 12, restAfter: 15 },
      { name: 'Lunges', duration: 45, reps: 12, restAfter: 15 },
      { name: 'High Knees', duration: 45, restAfter: 15 },
      { name: 'Push-ups', duration: 45, reps: 15, restAfter: 15 },
      { name: 'Burpees', duration: 30, reps: 8, restAfter: 20 },
      { name: 'Plank', duration: 60, restAfter: 0 },
    ],
  },
  {
    id: 'quick-warmup',
    name: 'Quick Warm-up',
    description: '5 min pre-workout warmup',
    totalDuration: 5 * 60,
    exercises: [
      { name: 'Arm Circles', duration: 30, restAfter: 10 },
      { name: 'Leg Swings', duration: 30, restAfter: 10 },
      { name: 'Hip Circles', duration: 30, restAfter: 10 },
      { name: 'Jumping Jacks', duration: 45, restAfter: 10 },
      { name: 'High Knees', duration: 30, restAfter: 10 },
      { name: 'Butt Kicks', duration: 30, restAfter: 10 },
      { name: 'Arm Swings', duration: 30, restAfter: 0 },
    ],
  },
];

// Inactivity timeout in minutes (auto-end workouts)
export const WORKOUT_INACTIVITY_TIMEOUT_MINUTES = 30;
