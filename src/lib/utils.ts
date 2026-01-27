import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatPace(minutesPerKm: number): string {
  const mins = Math.floor(minutesPerKm);
  const secs = Math.round((minutesPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, '0')} /km`;
}

export function formatDistance(km: number): string {
  if (km < 1) {
    return `${Math.round(km * 1000)}m`;
  }
  return `${km.toFixed(2)} km`;
}

export function getTimeOfDayGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const name = firstName || 'there';

  if (hour < 5) {
    return `Night owl, ${name}! 🦉`;
  } else if (hour < 12) {
    return `Good morning, ${name}! ☀️`;
  } else if (hour < 17) {
    return `Good afternoon, ${name}! 💪`;
  } else if (hour < 21) {
    return `Good evening, ${name}! 🌅`;
  } else {
    return `Hey ${name}! Late night grind? 🔥`;
  }
}

export function getMotivationalMessage(): string {
  const messages = [
    "Let's do this! 💪",
    "Time to crush it! 🔥",
    "Every rep counts! 🎯",
    "Push your limits! 🚀",
    "Make it happen! ⚡",
    "You've got this! 🏆",
    "Let's get moving! 🏃",
    "No excuses today! 💯",
    "Be unstoppable! 🦾",
    "Rise and grind! ⬆️",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}

export function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function estimateCalories(
  category: 'RUNNING' | 'STRENGTH' | 'WALKING' | 'SPORTS',
  durationMinutes: number,
  weightKg: number = 70
): number {
  // MET values (Metabolic Equivalent of Task)
  const metValues = {
    RUNNING: 9.8,    // Running at ~6 mph
    STRENGTH: 6.0,   // General weight training
    WALKING: 3.8,    // Walking at 3.5 mph
    SPORTS: 7.0,     // General sports activity
  };

  const met = metValues[category];
  // Calories = MET × weight (kg) × duration (hours)
  const hours = durationMinutes / 60;
  return Math.round(met * weightKg * hours);
}

export function getWeekBounds(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
