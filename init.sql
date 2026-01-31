-- RUNCLUB Database Schema
-- This file is automatically run by PostgreSQL on first container startup

-- Create enums
CREATE TYPE "WorkoutCategory" AS ENUM ('RUNNING', 'STRENGTH', 'WALKING', 'SPORTS');
CREATE TYPE "WorkoutStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE "UserRole" AS ENUM ('USER', 'COACH', 'ADMIN');

-- User table
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- Account table (NextAuth)
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- Session table (NextAuth)
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- VerificationToken table (NextAuth)
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- Workout table
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" "WorkoutCategory" NOT NULL,
    "status" "WorkoutStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "totalDuration" INTEGER,
    "goalDuration" INTEGER,
    "distance" DOUBLE PRECISION,
    "goalDistance" DOUBLE PRECISION,
    "pace" DOUBLE PRECISION,
    "caloriesBurned" INTEGER,
    "caloriesSource" TEXT,
    "notes" TEXT,
    "clubSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- Split table
CREATE TABLE "Split" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "splitNumber" INTEGER NOT NULL,
    "distance" DOUBLE PRECISION NOT NULL,
    "duration" INTEGER NOT NULL,
    "pace" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Split_pkey" PRIMARY KEY ("id")
);

-- Activity table
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,
    "weight" DOUBLE PRECISION,
    "duration" INTEGER,
    "notes" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- ClubSession table
CREATE TABLE "ClubSession" (
    "id" TEXT NOT NULL,
    "hostId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubSession_pkey" PRIMARY KEY ("id")
);

-- ClubMember table
CREATE TABLE "ClubMember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clubSessionId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "ClubMember_pkey" PRIMARY KEY ("id")
);

-- Streak table
CREATE TABLE "Streak" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastWorkoutAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Streak_pkey" PRIMARY KEY ("id")
);

-- WeeklyStat table
CREATE TABLE "WeeklyStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStart" TIMESTAMP(3) NOT NULL,
    "weekEnd" TIMESTAMP(3) NOT NULL,
    "totalWorkouts" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalDistance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalCalories" INTEGER NOT NULL DEFAULT 0,
    "runningCount" INTEGER NOT NULL DEFAULT 0,
    "strengthCount" INTEGER NOT NULL DEFAULT 0,
    "walkingCount" INTEGER NOT NULL DEFAULT 0,
    "sportsCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeeklyStat_pkey" PRIMARY KEY ("id")
);

-- WorkoutReaction table (for LIVE reactions during club sessions)
CREATE TABLE "WorkoutReaction" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toWorkoutId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutReaction_pkey" PRIMARY KEY ("id")
);

-- CoachRoutine table (workout templates created by coaches)
CREATE TABLE "CoachRoutine" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "WorkoutCategory" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachRoutine_pkey" PRIMARY KEY ("id")
);

-- RoutineExercise table (individual exercises within a routine)
CREATE TABLE "RoutineExercise" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "countDirection" TEXT NOT NULL DEFAULT 'down',
    "restAfter" INTEGER,
    "orderIndex" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" INTEGER,

    CONSTRAINT "RoutineExercise_pkey" PRIMARY KEY ("id")
);

-- RoutineCompletion table (tracks who did what routines)
CREATE TABLE "RoutineCompletion" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workoutId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "exercisesCompleted" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "RoutineCompletion_pkey" PRIMARY KEY ("id")
);

-- Unique constraints
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "ClubSession_code_key" ON "ClubSession"("code");
CREATE UNIQUE INDEX "ClubMember_userId_clubSessionId_key" ON "ClubMember"("userId", "clubSessionId");
CREATE UNIQUE INDEX "Streak_userId_key" ON "Streak"("userId");
CREATE UNIQUE INDEX "WeeklyStat_userId_weekStart_key" ON "WeeklyStat"("userId", "weekStart");

-- Indexes
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Workout_userId_idx" ON "Workout"("userId");
CREATE INDEX "Workout_clubSessionId_idx" ON "Workout"("clubSessionId");
CREATE INDEX "Workout_startTime_idx" ON "Workout"("startTime");
CREATE INDEX "Workout_category_idx" ON "Workout"("category");
CREATE INDEX "Split_workoutId_idx" ON "Split"("workoutId");
CREATE INDEX "Activity_workoutId_idx" ON "Activity"("workoutId");
CREATE INDEX "ClubSession_hostId_idx" ON "ClubSession"("hostId");
CREATE INDEX "ClubSession_code_idx" ON "ClubSession"("code");
CREATE INDEX "ClubSession_isActive_idx" ON "ClubSession"("isActive");
CREATE INDEX "ClubMember_userId_idx" ON "ClubMember"("userId");
CREATE INDEX "ClubMember_clubSessionId_idx" ON "ClubMember"("clubSessionId");
CREATE INDEX "Streak_userId_idx" ON "Streak"("userId");
CREATE INDEX "WeeklyStat_userId_idx" ON "WeeklyStat"("userId");
CREATE INDEX "WeeklyStat_weekStart_idx" ON "WeeklyStat"("weekStart");
CREATE INDEX "WorkoutReaction_toWorkoutId_idx" ON "WorkoutReaction"("toWorkoutId");
CREATE INDEX "WorkoutReaction_fromUserId_idx" ON "WorkoutReaction"("fromUserId");
CREATE INDEX "WorkoutReaction_createdAt_idx" ON "WorkoutReaction"("createdAt");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "CoachRoutine_coachId_idx" ON "CoachRoutine"("coachId");
CREATE INDEX "CoachRoutine_category_idx" ON "CoachRoutine"("category");
CREATE INDEX "CoachRoutine_isActive_idx" ON "CoachRoutine"("isActive");
CREATE INDEX "RoutineExercise_routineId_idx" ON "RoutineExercise"("routineId");
CREATE INDEX "RoutineExercise_orderIndex_idx" ON "RoutineExercise"("orderIndex");
CREATE INDEX "RoutineCompletion_routineId_idx" ON "RoutineCompletion"("routineId");
CREATE INDEX "RoutineCompletion_userId_idx" ON "RoutineCompletion"("userId");
CREATE INDEX "RoutineCompletion_startedAt_idx" ON "RoutineCompletion"("startedAt");

-- Foreign keys
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_clubSessionId_fkey" FOREIGN KEY ("clubSessionId") REFERENCES "ClubSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Split" ADD CONSTRAINT "Split_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubSession" ADD CONSTRAINT "ClubSession_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ClubMember" ADD CONSTRAINT "ClubMember_clubSessionId_fkey" FOREIGN KEY ("clubSessionId") REFERENCES "ClubSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Streak" ADD CONSTRAINT "Streak_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyStat" ADD CONSTRAINT "WeeklyStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutReaction" ADD CONSTRAINT "WorkoutReaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkoutReaction" ADD CONSTRAINT "WorkoutReaction_toWorkoutId_fkey" FOREIGN KEY ("toWorkoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CoachRoutine" ADD CONSTRAINT "CoachRoutine_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutineExercise" ADD CONSTRAINT "RoutineExercise_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "CoachRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutineCompletion" ADD CONSTRAINT "RoutineCompletion_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "CoachRoutine"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoutineCompletion" ADD CONSTRAINT "RoutineCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Set default admin (will be applied on first login with this email)
-- This is handled in the application code based on email match
ALTER TABLE "WorkoutReaction" ADD CONSTRAINT "WorkoutReaction_toWorkoutId_fkey" FOREIGN KEY ("toWorkoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
