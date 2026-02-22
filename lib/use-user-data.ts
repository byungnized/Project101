'use client';

import { useEffect, useState } from 'react';
import type { Group, ChannelRef, VideoItem } from '@/lib/types';
import { listGroups, listGroupChannels, listVideos } from '@/lib/firestore';

export function useUserData(ownerUid?: string) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [channels, setChannels] = useState<ChannelRef[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    if (!ownerUid) return;
    setLoading(true);
    setError(null);
    try {
      const [nextGroups, nextChannels, nextVideos] = await Promise.all([
        listGroups(ownerUid),
        listGroupChannels(ownerUid),
        listVideos(ownerUid),
      ]);
      setGroups(nextGroups);
      setChannels(nextChannels);
      setVideos(nextVideos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [ownerUid]);

  return { groups, channels, videos, loading, error, refresh, setGroups, setChannels, setVideos };
}
