'use client';

import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/lib/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { useUserData } from '@/lib/use-user-data';
import { markReviewTaskCompleted } from '@/lib/firestore';
import { formatDate, formatRelativeDue } from '@/lib/date';

export function ReviewPageClient() {
  const { user } = useAuth();
  const { groups, videos, refresh, loading, error } = useUserData(user?.uid);

  const dueItems = videos.flatMap((video) =>
    (video.reviewSchedule || [])
      .filter((task) => !task.completedAt)
      .map((task) => ({ video, task }))
  )
    .sort((a, b) => new Date(a.task.dueAt).getTime() - new Date(b.task.dueAt).getTime());

  const dueNow = dueItems.filter((item) => new Date(item.task.dueAt).getTime() <= Date.now());

  return (
    <AuthGuard>
      <AppShell>
        <section className="panel">
          <div className="row-between">
            <div>
              <h1>Review Queue</h1>
              <div className="small muted">D+7 and D+30 reminders generated after a video is marked WATCHED.</div>
            </div>
            <button className="btn" type="button" onClick={() => void refresh()} disabled={loading}>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          {error ? <div className="small" style={{ color: 'var(--danger)' }}>{error}</div> : null}
          <div className="grid-2" style={{ marginTop: 12 }}>
            <div className="kpi"><span className="small muted">Due now</span><span className="kpi-value">{dueNow.length}</span></div>
            <div className="kpi"><span className="small muted">Upcoming</span><span className="kpi-value">{Math.max(dueItems.length - dueNow.length, 0)}</span></div>
          </div>
        </section>

        <section className="panel">
          {dueItems.length === 0 ? (
            <div className="empty-state">No review tasks scheduled yet. Mark a video as WATCHED in a group to create D+7 and D+30 reviews.</div>
          ) : (
            <div className="list">
              {dueItems.map(({ video, task }) => {
                const groupName = groups.find((g) => g.id === video.groupId)?.name || 'Unknown group';
                const isDue = new Date(task.dueAt).getTime() <= Date.now();
                return (
                  <div key={`${video.id}-${task.kind}`} className="list-item">
                    <div className="row-between">
                      <div className="stack">
                        <div>{video.title}</div>
                        <div className="small muted">{groupName} • {video.youtubeVideoId}</div>
                        <div className="small muted">Kind: {task.kind} • Due: {formatDate(task.dueAt)} ({formatRelativeDue(task.dueAt)})</div>
                      </div>
                      <div className="row">
                        {isDue ? <span className="badge">Due</span> : <span className="badge">Upcoming</span>}
                        <a className="btn" href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`} target="_blank" rel="noreferrer">Open</a>
                        <button className="btn btn-primary" type="button" onClick={() => void markReviewTaskCompleted(video, task.kind).then(refresh)}>
                          Mark reviewed
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="small muted">
            Need a specific channel/group? Use <Link href="/dashboard">Dashboard</Link> or group pages to filter by status and manage metadata.
          </div>
        </section>
      </AppShell>
    </AuthGuard>
  );
}
