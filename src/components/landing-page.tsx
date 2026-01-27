'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Activity, Users, Flame, Trophy } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg mx-auto"
        >
          {/* Logo */}
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-2xl shadow-primary-500/30 mb-4"
            >
              <Activity className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-extrabold">
              <span className="gradient-text">RUNCLUB</span>
            </h1>
            <p className="text-dark-400 text-lg mt-2">by HCWS</p>
          </div>

          {/* Tagline */}
          <p className="text-xl text-dark-200 mb-8">
            Track workouts. Crush goals.
            <br />
            <span className="text-primary-400">Together.</span>
          </p>

          {/* Features */}
          <div className="grid grid-cols-2 gap-4 mb-10">
            <FeatureCard
              icon={<Flame className="w-6 h-6 text-orange-400" />}
              title="Track Workouts"
              description="Running, strength, walking & sports"
            />
            <FeatureCard
              icon={<Users className="w-6 h-6 text-blue-400" />}
              title="Club Sessions"
              description="Work out with friends in real-time"
            />
            <FeatureCard
              icon={<Trophy className="w-6 h-6 text-yellow-400" />}
              title="Streaks"
              description="Build consistency, earn streaks"
            />
            <FeatureCard
              icon={<Activity className="w-6 h-6 text-green-400" />}
              title="Stats & Insights"
              description="Weekly summaries & progress"
            />
          </div>

          {/* Sign In Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="w-full max-w-sm mx-auto flex items-center justify-center gap-3 bg-white text-dark-900 font-semibold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          <p className="text-dark-500 text-sm mt-6">
            Free to use. No credit card required.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-dark-500 text-sm">
        <p>© 2024 RUNCLUB by HCWS. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="card p-4 text-left"
    >
      <div className="mb-2">{icon}</div>
      <h3 className="font-semibold text-dark-100 text-sm">{title}</h3>
      <p className="text-dark-400 text-xs mt-1">{description}</p>
    </motion.div>
  );
}
