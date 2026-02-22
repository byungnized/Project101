'use client';

import { useState } from 'react';
import type { ChannelRef, YouTubeChannelSearchResult } from '@/lib/types';
import { addGroupChannel, removeGroupChannel, searchYouTubeChannelsByName } from '@/lib/firestore';

export function ChannelManager({
  ownerUid,
  groupId,
  channels,
  onUpdated,
}: {
  ownerUid: string;
  groupId: string;
  channels: ChannelRef[];
  onUpdated: () => Promise<void>;
}) {
  const [manualChannelId, setManualChannelId] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<YouTubeChannelSearchResult[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const groupChannels = channels.filter((c) => c.groupId === groupId);

  async function handleManualAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await addGroupChannel({
        ownerUid,
        groupId,
        channelId: manualChannelId.trim(),
        title: manualTitle.trim() || manualChannelId.trim(),
        source: 'MANUAL',
      });
      setManualChannelId('');
      setManualTitle('');
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add channel');
    }
  }

  async function handleSearch() {
    if (!searchText.trim()) return;
    setLoadingSearch(true);
    setError(null);
    try {
      const items = await searchYouTubeChannelsByName(searchText.trim());
      setSearchResults(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoadingSearch(false);
    }
  }

  async function addSearchResult(item: YouTubeChannelSearchResult) {
    setError(null);
    try {
      await addGroupChannel({
        ownerUid,
        groupId,
        channelId: item.channelId,
        title: item.title,
        thumbnailUrl: item.thumbnailUrl,
        source: 'YOUTUBE_SEARCH',
      });
      await onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add channel');
    }
  }

  return (
    <div className="stack">
      <div className="grid-2">
        <div className="panel">
          <h3>Add Channel (Manual)</h3>
          <form className="stack" onSubmit={handleManualAdd}>
            <input
              className="input"
              placeholder="UC... channelId"
              value={manualChannelId}
              onChange={(e) => setManualChannelId(e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Display title (optional)"
              value={manualTitle}
              onChange={(e) => setManualTitle(e.target.value)}
            />
            <button className="btn btn-primary" type="submit">Add Channel</button>
          </form>
        </div>

        <div className="panel">
          <h3>Search Channel (YouTube API)</h3>
          <div className="row">
            <input
              className="input"
              placeholder="Search by channel name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <button className="btn btn-secondary" type="button" onClick={() => void handleSearch()} disabled={loadingSearch}>
              {loadingSearch ? 'Searching...' : 'Search'}
            </button>
          </div>
          <div className="list" style={{ marginTop: 10 }}>
            {searchResults.map((item) => (
              <div key={item.channelId} className="list-item row-between">
                <div>
                  <div>{item.title}</div>
                  <div className="small muted">{item.channelId}</div>
                </div>
                <button className="btn" type="button" onClick={() => void addSearchResult(item)}>
                  Add
                </button>
              </div>
            ))}
            {searchResults.length === 0 ? <div className="small muted">No results yet.</div> : null}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Channels in Group</h3>
        {groupChannels.length === 0 ? (
          <div className="empty-state">No channels added yet.</div>
        ) : (
          <div className="list">
            {groupChannels.map((channel) => (
              <div key={channel.id} className="list-item row-between">
                <div>
                  <div>{channel.title}</div>
                  <div className="small muted">{channel.channelId} • {channel.source}</div>
                </div>
                <button className="btn btn-danger" type="button" onClick={() => void removeGroupChannel(channel.id).then(onUpdated)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        {error ? <div className="small" style={{ color: 'var(--danger)' }}>{error}</div> : null}
      </div>
    </div>
  );
}
