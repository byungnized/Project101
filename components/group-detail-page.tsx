'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/app-shell';
import { AuthGuard } from '@/lib/auth-guard';
import { useAuth } from '@/lib/auth-context';
import { useUserData } from '@/lib/use-user-data';
import { ChannelManager } from '@/components/channel-manager';
import { VideoList } from '@/components/video-list';
import { updateGroup, createVideoItem } from '@/lib/firestore';
import { GroupForm } from '@/components/group-form';

export function GroupDetailPageClient({ groupId }: { groupId: string }) {
  const { user } = useAuth();
  const { groups, channels, videos, loading, error, refresh } = useUserData(user?.uid);
  const [videoSeed, setVideoSeed] = useState({
    youtubeVideoId: '',
    title: '',
    channelId: '',
    thumbnailUrl: '',
    publishedAt: '',
  });
  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
  const groupVideos = useMemo(() => videos.filter((v) => v.groupId === groupId), [videos, groupId]);
  const groupChannels = useMemo(() => channels.filter((c) => c.groupId === groupId), [channels, groupId]);

  return (
    <AuthGuard>
      <AppShell>
        {!group ? (
          <section className="panel">
            <h1>Group not found</h1>
            <div className="muted small">{loading ? 'Loading group...' : 'The selected group does not exist or is not accessible.'}</div>
            <Link href="/dashboard" className="btn" style={{ display: 'inline-block', marginTop: 12 }}>Back to dashboard</Link>
          </section>
        ) : (
          <>
            <section className="panel">
              <div className="row-between">
                <div>
                  <h1>{group.name}</h1>
                  <div className="muted small">Manage channels and videos for this learning track.</div>
                </div>
                <Link href="/dashboard" className="btn">Back</Link>
              </div>
              {error ? <div className="small" style={{ color: 'var(--danger)' }}>{error}</div> : null}
              <div className="grid-2" style={{ marginTop: 12 }}>
                <div className="kpi"><span className="small muted">Channels</span><span className="kpi-value">{groupChannels.length}</span></div>
                <div className="kpi"><span className="small muted">Videos</span><span className="kpi-value">{groupVideos.length}</span></div>
              </div>
            </section>

            <section className="grid-2">
              <div className="panel">
                <h2>Edit Group</h2>
                <GroupForm
                  initial={{ name: group.name, description: group.description || '', color: group.color || '#0f6d5d' }}
                  submitLabel="Save Group"
                  onSubmit={async (values) => {
                    await updateGroup(group.id, values);
                    await refresh();
                  }}
                />
              </div>

              <div className="panel">
                <h2>Add Video Metadata (MVP helper)</h2>
                <form
                  className="stack"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    if (!user) return;
                    await createVideoItem({
                      ownerUid: user.uid,
                      groupId,
                      channelId: videoSeed.channelId,
                      youtubeVideoId: videoSeed.youtubeVideoId,
                      title: videoSeed.title,
                      thumbnailUrl: videoSeed.thumbnailUrl || undefined,
                      publishedAt: videoSeed.publishedAt || undefined,
                      status: 'UNWATCHED',
                      reviewSchedule: [],
                    });
                    setVideoSeed({ youtubeVideoId: '', title: '', channelId: '', thumbnailUrl: '', publishedAt: '' });
                    await refresh();
                  }}
                >
                  <input className="input" placeholder="YouTube videoId" value={videoSeed.youtubeVideoId} onChange={(e) => setVideoSeed((v) => ({ ...v, youtubeVideoId: e.target.value }))} required />
                  <input className="input" placeholder="Video title" value={videoSeed.title} onChange={(e) => setVideoSeed((v) => ({ ...v, title: e.target.value }))} required />
                  <input className="input" placeholder="ChannelId" value={videoSeed.channelId} onChange={(e) => setVideoSeed((v) => ({ ...v, channelId: e.target.value }))} required />
                  <input className="input" placeholder="Thumbnail URL (optional)" value={videoSeed.thumbnailUrl} onChange={(e) => setVideoSeed((v) => ({ ...v, thumbnailUrl: e.target.value }))} />
                  <input className="input" type="datetime-local" value={videoSeed.publishedAt} onChange={(e) => setVideoSeed((v) => ({ ...v, publishedAt: e.target.value }))} />
                  <button className="btn btn-primary" type="submit">Add Video</button>
                </form>
                <div className="small muted">Use this helper until scheduled YouTube sync/import is added.</div>
              </div>
            </section>

            <section>
              <ChannelManager ownerUid={user!.uid} groupId={groupId} channels={channels} onUpdated={refresh} />
            </section>

            <section className="panel">
              <h2>Videos</h2>
              <VideoList videos={groupVideos} onUpdated={refresh} />
            </section>
          </>
        )}
      </AppShell>
    </AuthGuard>
  );
}
