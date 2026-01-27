'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, Users, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'Home' },
  { href: '/stats', icon: BarChart3, label: 'Stats' },
  { href: '/workout/new', icon: Plus, label: 'Workout', primary: true },
  { href: '/club', icon: Users, label: 'Club' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-dark-700 safe-bottom">
      <div className="flex items-center justify-around py-2 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link key={item.href} href={item.href}>
                <div className="relative -mt-6">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </Link>
            );
          }

          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex flex-col items-center py-2 px-3 rounded-xl transition-colors',
                  isActive
                    ? 'text-primary-400'
                    : 'text-dark-400 hover:text-dark-200'
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
