'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/review', label: 'Review Queue' },
  { href: '/settings', label: 'Settings' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, signOutUser } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="row">
          <Link href="/dashboard" className="brand">YouTube Learning Organizer</Link>
          <nav className="nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} data-active={String(pathname.startsWith(item.href))}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="row">
          <span className="small muted">{user?.email || 'Guest'}</span>
          {user ? (
            <button className="btn" type="button" onClick={() => void signOutUser()}>
              Sign out
            </button>
          ) : null}
        </div>
      </header>
      <main className="page">{children}</main>
    </div>
  );
}
