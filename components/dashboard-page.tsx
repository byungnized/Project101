'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/lib/auth-guard';
import { GroupCard } from '@/components/group-card';
import { GroupForm } from '@/components/group-form';
import { useAuth } from '@/lib/auth-context';
import { useUserData } from '@/lib/use-user-data';
import { computeGroupCounts, createGroup } from '@/lib/firestore';

export function DashboardPageClient() {
  const { user } = useAuth();
  const { groups, videos, channels, loading, error, refresh } = useUserData(user?.uid);

  const counts = useMemo(() => computeGroupCounts(groups, videos), [groups, videos]);
  const countsByGroupId = useMemo(
    () => new Map(counts.map((item) => [item.groupId, item])),
    [counts]
  );

  return (
    <AuthGuard>
      <AppShell>
        <section className="panel">
          <div className="row-between">
            <div>
              <h1>Dashboard</h1>
              <div className="muted small">Group cards show unread and review-due counts across your organized learning channels.</div>
            </div>
            <button className="btn" type="button" onClick={() => void refresh()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {error ? <div className="small" style={{ color: 'var(--danger)' }}>{error}</div> : null}
          <div className="grid-3" style={{ marginTop: 12 }}>
            <div className="kpi"><span className="small muted">Groups</span><span className="kpi-value">{groups.length}</span></div>
            <div className="kpi"><span className="small muted">Channels</span><span className="kpi-value">{channels.length}</span></div>
            <div className="kpi"><span className="small muted">Videos</span><span className="kpi-value">{videos.length}</span></div>
          </div>
        </section>

        <section className="grid-2">
          <div className="panel">
            <h2>Create Group</h2>
            <GroupForm
              submitLabel="Create Group"
              onSubmit={async (values) => {
                if (!user) return;
                await createGroup({ ownerUid: user.uid, ...values });
                await refresh();
              }}
            />
          </div>

          <div className="panel">
            <h2>MVP Notes</h2>
            <ul className="small muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
              <li>Marking a video as WATCHED schedules D+7 and D+30 review tasks.</li>
              <li>Dashboard counts are computed from Firestore video status + pending review schedule.</li>
              <li>Playback should use official YouTube embed or open-on-YouTube links only.</li>
            </ul>
            <div className="row" style={{ marginTop: 12 }}>
              <Link href="/review" className="btn btn-secondary">Open Review Queue</Link>
              <Link href="/settings" className="btn">Privacy & Export</Link>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="row-between">
            <h2>Groups</h2>
            <span className="small muted">Click a card to manage channels and videos</span>
          </div>
          {groups.length === 0 ? (
            <div className="empty-state">No groups yet. Create your first learning group (e.g., Stock Study).</div>
          ) : (
            <div className="card-grid" style={{ marginTop: 12 }}>
              {groups.map((group) => {
                const c = countsByGroupId.get(group.id);
                return (
                  <GroupCard
                    key={group.id}
                    group={group}
                    unreadCount={c?.unreadCount || 0}
                    reviewDueCount={c?.reviewDueCount || 0}
                    nextReviewDueAt={c?.nextReviewDueAt}
                  />
                );
              })}
            </div>
          )}
        </section>
      </AppShell>
    </AuthGuard>
  );
}
