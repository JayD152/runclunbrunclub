'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Users,
  LogIn,
  Crown,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import BottomNav from '@/components/ui/bottom-nav';

interface ClubPageClientProps {
  user: {
    id: string;
    name?: string | null;
  };
  activeSession: any;
  pastSessions: any[];
}

export default function ClubPageClient({
  user,
  activeSession,
  pastSessions,
}: ClubPageClientProps) {
  const router = useRouter();
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateSession = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/club', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName || null }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create session');
      }

      router.push(`/club/${data.id}`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleJoinSession = async () => {
    if (!joinCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/club/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.toUpperCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join session');
      }

      router.push(`/club/${data.sessionId}`);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-dark-700">
        <div className="px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-dark-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white">Club Sessions</h1>
            <p className="text-sm text-dark-400">Work out with friends</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        {/* Active Session Banner */}
        {activeSession && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link href={`/club/${activeSession.id}`}>
              <div className="card bg-gradient-to-r from-blue-600 to-purple-600 border-0 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-white" />
                    <div>
                      <p className="font-semibold text-white">
                        {activeSession.name || 'Active Session'}
                      </p>
                      <p className="text-sm text-white/80">
                        {activeSession.members.length} member
                        {activeSession.members.length !== 1 ? 's' : ''} •{' '}
                        Code: {activeSession.code}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/70" />
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Quick Actions */}
        {!activeSession && (
          <section>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowCreateForm(true);
                  setShowJoinForm(false);
                }}
                className="card p-6 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-500/20 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="font-semibold text-white">Start Session</h3>
                <p className="text-sm text-dark-400 mt-1">
                  Create a new club session
                </p>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowJoinForm(true);
                  setShowCreateForm(false);
                }}
                className="card p-6 text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                  <LogIn className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Join Session</h3>
                <p className="text-sm text-dark-400 mt-1">
                  Enter a session code
                </p>
              </motion.button>
            </div>
          </section>
        )}

        {/* Create Session Form */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <h2 className="font-semibold text-white mb-4">
              Create Club Session
            </h2>
            <div className="space-y-4">
              <div>
                <label className="label">Session Name (optional)</label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="input"
                  placeholder="e.g., Morning Run Club"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSession}
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? 'Creating...' : 'Create Session'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Join Session Form */}
        {showJoinForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card p-4"
          >
            <h2 className="font-semibold text-white mb-4">Join Club Session</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Session Code</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  className="input text-center text-2xl tracking-widest font-mono"
                  placeholder="ABC123"
                  maxLength={6}
                />
              </div>
              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowJoinForm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinSession}
                  disabled={isLoading || joinCode.length !== 6}
                  className="btn-primary flex-1"
                >
                  {isLoading ? 'Joining...' : 'Join Session'}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Past Sessions */}
        <section>
          <h2 className="text-sm font-semibold text-dark-400 mb-3">
            PAST SESSIONS
          </h2>
          {pastSessions.length > 0 ? (
            <div className="space-y-3">
              {pastSessions.map((session) => (
                <Link key={session.id} href={`/club/${session.id}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {session.hostId === user.id && (
                          <Crown className="w-4 h-4 text-yellow-400" />
                        )}
                        <div>
                          <h3 className="font-semibold text-white">
                            {session.name || `Session ${session.code}`}
                          </h3>
                          <p className="text-sm text-dark-400 flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            {session.endTime
                              ? formatDistanceToNow(new Date(session.endTime), {
                                  addSuffix: true,
                                })
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm text-dark-400">
                        <p>{session._count.members} members</p>
                        <p>{session._count.workouts} workouts</p>
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
              <p className="text-dark-400">No past sessions yet</p>
              <p className="text-sm text-dark-500 mt-1">
                Start or join a session to work out with friends
              </p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
