'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && configured && !user) {
      router.replace('/login');
    }
  }, [configured, loading, router, user]);

  if (!configured) {
    return <div className="empty-state">Configure Firebase env vars to enable login and Firestore.</div>;
  }

  if (loading) {
    return <div className="empty-state">Loading session...</div>;
  }

  if (!user) {
    return <div className="empty-state">Redirecting to login...</div>;
  }

  return <>{children}</>;
}
