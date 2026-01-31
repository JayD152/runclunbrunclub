import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// Rate limit: 1 reaction per 5 seconds per user
const RATE_LIMIT_SECONDS = 5;
const reactionRateLimit = new Map<string, number>();

// Available reaction emojis (not exported, just for validation)
const REACTION_EMOJIS = ['💪', '🔥', '⚡', '👏', '🏃', '❤️', '🎉', '💯'];

// POST - Send a reaction to a workout
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { toWorkoutId, emoji } = body;

    if (!toWorkoutId || !emoji) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate emoji
    if (!REACTION_EMOJIS.includes(emoji)) {
      return NextResponse.json(
        { error: 'Invalid reaction emoji' },
        { status: 400 }
      );
    }

    // Check rate limit
    const lastReaction = reactionRateLimit.get(session.user.id);
    const now = Date.now();
    
    if (lastReaction && now - lastReaction < RATE_LIMIT_SECONDS * 1000) {
      const waitTime = Math.ceil((RATE_LIMIT_SECONDS * 1000 - (now - lastReaction)) / 1000);
      return NextResponse.json(
        { error: `Please wait ${waitTime} seconds before sending another reaction` },
        { status: 429 }
      );
    }

    // Verify the workout exists, is in progress, and belongs to a club session
    const workout = await prisma.workout.findUnique({
      where: { id: toWorkoutId },
      include: { clubSession: true },
    });

    if (!workout) {
      return NextResponse.json(
        { error: 'Workout not found' },
        { status: 404 }
      );
    }

    if (workout.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Can only react to active workouts' },
        { status: 400 }
      );
    }

    if (!workout.clubSessionId) {
      return NextResponse.json(
        { error: 'Can only react to workouts in club sessions' },
        { status: 400 }
      );
    }

    // Cannot react to your own workout
    if (workout.userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot react to your own workout' },
        { status: 400 }
      );
    }

    // Create the reaction
    const reaction = await prisma.workoutReaction.create({
      data: {
        fromUserId: session.user.id,
        toWorkoutId,
        emoji,
      },
      include: {
        fromUser: { select: { id: true, name: true, image: true } },
      },
    });

    // Update rate limit
    reactionRateLimit.set(session.user.id, now);

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('Error creating reaction:', error);
    return NextResponse.json(
      { error: 'Failed to create reaction' },
      { status: 500 }
    );
  }
}

// GET - Get recent reactions for a workout
export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const workoutId = searchParams.get('workoutId');
    const since = searchParams.get('since'); // ISO timestamp

    if (!workoutId) {
      return NextResponse.json(
        { error: 'Missing workoutId parameter' },
        { status: 400 }
      );
    }

    // Get reactions from the last 30 seconds (or since timestamp)
    const sinceDate = since 
      ? new Date(since) 
      : new Date(Date.now() - 30 * 1000);

    const reactions = await prisma.workoutReaction.findMany({
      where: {
        toWorkoutId: workoutId,
        createdAt: { gte: sinceDate },
      },
      include: {
        fromUser: { select: { id: true, name: true, image: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20, // Limit to prevent overwhelming
    });

    return NextResponse.json(reactions);
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}
