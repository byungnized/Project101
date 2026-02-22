'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export function LoginPageClient() {
  const { user, loading, signIn, configured } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace('/dashboard');
  }, [router, user]);

  return (
    <div className="app-shell">
      <main className="page">
        <section className="panel" style={{ maxWidth: 760, margin: '8vh auto 0' }}>
          <h1>YouTube Learning Organizer</h1>
          <p className="muted">
            Companion dashboard for organizing user-permitted YouTube channels/videos into study groups and spaced reviews.
          </p>
          <div className="stack">
            <div className="badge">Compliant: YouTube Data API + OAuth only, no scraping, no downloads</div>
            {!configured ? (
              <div className="empty-state">
                Firebase is not configured. Add `NEXT_PUBLIC_FIREBASE_*` variables and `YOUTUBE_DATA_API_KEY` to continue.
              </div>
            ) : (
              <button
                className="btn btn-primary"
                type="button"
                disabled={loading}
                onClick={async () => {
                  setError(null);
                  try {
                    await signIn();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Google sign-in failed');
                  }
                }}
              >
                {loading ? 'Loading...' : 'Continue with Google'}
              </button>
            )}
            {error ? <div className="small" style={{ color: 'var(--danger)' }}>{error}</div> : null}
          </div>
        </section>
      </main>
    </div>
  );
}
