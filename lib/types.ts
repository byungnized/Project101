export type VideoStatus = 'UNWATCHED' | 'WATCHED' | 'REVIEW' | 'REWATCHED';

export interface Group {
  id: string;
  ownerUid: string;
  name: string;
  description?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChannelRef {
  id: string;
  ownerUid: string;
  groupId: string;
  channelId: string;
  title: string;
  thumbnailUrl?: string;
  source: 'MANUAL' | 'YOUTUBE_SEARCH';
  createdAt?: string;
}

export interface VideoItem {
  id: string;
  ownerUid: string;
  groupId: string;
  channelId: string;
  youtubeVideoId: string;
  title: string;
  thumbnailUrl?: string;
  publishedAt?: string;
  status: VideoStatus;
  watchedAt?: string;
  reviewSchedule?: ReviewTask[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ReviewTask {
  kind: 'D7' | 'D30';
  dueAt: string;
  completedAt?: string;
}

export interface YouTubeChannelSearchResult {
  channelId: string;
  title: string;
  thumbnailUrl?: string;
}
