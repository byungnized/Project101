'use client';

import { useMemo, useState } from 'react';
import type { VideoItem, VideoStatus } from '@/lib/types';
import { formatDate, formatRelativeDue } from '@/lib/date';
import { setVideoStatus, markReviewTaskCompleted } from '@/lib/firestore';

const statusFilters: Array<VideoStatus | 'ALL'> = ['ALL', 'UNWATCHED', 'WATCHED', 'REVIEW', 'REWATCHED'];

export function VideoList({
  videos,
  onUpdated,
}: {
  videos: VideoItem[];
  onUpdated: () => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState<VideoStatus | 'ALL'>('ALL');

  const filtered = useMemo(() => {
    return statusFilter === 'ALL' ? videos : videos.filter((video) => video.status === statusFilter);
  }, [statusFilter, videos]);

  if (videos.length === 0) {
    return <div className="empty-state">No videos stored yet. Import metadata via YouTube API or add seed data.</div>;
  }

  return (
    <div className="stack">
      <div className="row">
        <label htmlFor="status-filter" className="small muted">Filter</label>
        <select
          id="status-filter"
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VideoStatus | 'ALL')}
          style={{ maxWidth: 220 }}
        >
          {statusFilters.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      <div className="list">
        {filtered.map((video) => {
          const outstandingReviews = (video.reviewSchedule || []).filter((t) => !t.completedAt);
          return (
            <div key={video.id} className="list-item">
              <div className="video-row">
                {video.thumbnailUrl ? (
                  <img className="video-thumb" src={video.thumbnailUrl} alt="" />
                ) : (
                  <div className="video-thumb" />
                )}
                <div className="stack">
                  <div className="row-between">
                    <div>
                      <div>{video.title}</div>
                      <div className="small muted">Video ID: {video.youtubeVideoId}</div>
                    </div>
                    <span className={`badge pill-status status-${video.status}`}>{video.status}</span>
                  </div>
                  <div className="small muted">Published: {formatDate(video.publishedAt)} • Watched: {formatDate(video.watchedAt)}</div>
                  <div className="row">
                    {video.status !== 'UNWATCHED' ? null : (
                      <button className="btn btn-primary" type="button" onClick={() => void setVideoStatus(video, 'WATCHED').then(onUpdated)}>
                        Mark WATCHED
                      </button>
                    )}
                    {video.status !== 'REVIEW' ? (
                      <button className="btn" type="button" onClick={() => void setVideoStatus(video, 'REVIEW').then(onUpdated)}>
                        Set REVIEW
                      </button>
                    ) : null}
                    {video.status !== 'REWATCHED' ? (
                      <button className="btn" type="button" onClick={() => void setVideoStatus(video, 'REWATCHED').then(onUpdated)}>
                        Set REWATCHED
                      </button>
                    ) : null}
                    {video.status !== 'UNWATCHED' ? (
                      <button className="btn" type="button" onClick={() => void setVideoStatus(video, 'UNWATCHED').then(onUpdated)}>
                        Reset UNWATCHED
                      </button>
                    ) : null}
                  </div>
                  {outstandingReviews.length > 0 ? (
                    <div className="row">
                      {outstandingReviews.map((task) => (
                        <button
                          key={task.kind}
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => void markReviewTaskCompleted(video, task.kind).then(onUpdated)}
                          title={task.dueAt}
                        >
                          {task.kind} • {formatRelativeDue(task.dueAt)} • Complete
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="small muted">No pending review tasks.</div>
                  )}
                </div>
                <div className="stack">
                  <a
                    className="btn"
                    href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open on YouTube
                  </a>
                  <a
                    className="btn"
                    href={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Embed URL
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
