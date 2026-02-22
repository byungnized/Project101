'use client';

import Link from 'next/link';
import type { Group } from '@/lib/types';
import { formatRelativeDue } from '@/lib/date';

export function GroupCard({
  group,
  unreadCount,
  reviewDueCount,
  nextReviewDueAt,
}: {
  group: Group;
  unreadCount: number;
  reviewDueCount: number;
  nextReviewDueAt?: string;
}) {
  return (
    <Link href={`/groups/${group.id}`} className="group-card">
      <div className="row-between">
        <div>
          <h3>{group.name}</h3>
          <div className="small muted">{group.description || 'No description'}</div>
        </div>
        {group.color ? <span className="badge" style={{ borderColor: group.color }}>{group.color}</span> : null}
      </div>
      <div className="grid-2">
        <div className="kpi">
          <span className="small muted">Unread videos</span>
          <span className="kpi-value">{unreadCount}</span>
        </div>
        <div className="kpi">
          <span className="small muted">Review due</span>
          <span className="kpi-value">{reviewDueCount}</span>
        </div>
      </div>
      <div className="small muted">Next review: {formatRelativeDue(nextReviewDueAt)}</div>
    </Link>
  );
}
