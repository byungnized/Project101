'use client';

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ChannelRef, Group, VideoItem, VideoStatus, YouTubeChannelSearchResult } from '@/lib/types';
import { buildReviewSchedule } from '@/lib/scheduler';

function requireDb() {
  if (!db) throw new Error('Firestore is not configured');
  return db;
}

const groupsCol = () => collection(requireDb(), 'groups');
const channelsCol = () => collection(requireDb(), 'groupChannels');
const videosCol = () => collection(requireDb(), 'videoItems');

export async function listGroups(ownerUid: string): Promise<Group[]> {
  const snap = await getDocs(query(groupsCol(), where('ownerUid', '==', ownerUid), orderBy('name')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Group, 'id'>) }));
}

export async function createGroup(input: Pick<Group, 'ownerUid' | 'name' | 'description' | 'color'>) {
  const ref = await addDoc(groupsCol(), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateGroup(groupId: string, input: Partial<Pick<Group, 'name' | 'description' | 'color'>>) {
  await updateDoc(doc(requireDb(), 'groups', groupId), {
    ...input,
    updatedAt: serverTimestamp(),
  });
}

export async function listGroupChannels(ownerUid: string, groupId?: string): Promise<ChannelRef[]> {
  const constraints = [where('ownerUid', '==', ownerUid)];
  if (groupId) constraints.push(where('groupId', '==', groupId));
  const snap = await getDocs(query(channelsCol(), ...constraints, orderBy('title')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChannelRef, 'id'>) }));
}

export async function addGroupChannel(input: Omit<ChannelRef, 'id' | 'createdAt'>) {
  await addDoc(channelsCol(), {
    ...input,
    createdAt: serverTimestamp(),
  });
}

export async function removeGroupChannel(id: string) {
  await deleteDoc(doc(requireDb(), 'groupChannels', id));
}

export async function listVideos(ownerUid: string, groupId?: string): Promise<VideoItem[]> {
  const constraints = [where('ownerUid', '==', ownerUid)];
  if (groupId) constraints.push(where('groupId', '==', groupId));
  const snap = await getDocs(query(videosCol(), ...constraints, orderBy('publishedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoItem, 'id'>) }));
}

export async function createVideoItem(input: Omit<VideoItem, 'id' | 'createdAt' | 'updatedAt'>) {
  await addDoc(videosCol(), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function setVideoStatus(video: VideoItem, status: VideoStatus) {
  const ref = doc(requireDb(), 'videoItems', video.id);
  const patch: Record<string, unknown> = { status, updatedAt: serverTimestamp() };

  if (status === 'WATCHED') {
    const watchedAt = new Date().toISOString();
    patch.watchedAt = watchedAt;
    patch.reviewSchedule = buildReviewSchedule(new Date(watchedAt));
  }

  await updateDoc(ref, patch);
}

export async function markReviewTaskCompleted(video: VideoItem, kind: 'D7' | 'D30') {
  const reviewSchedule = (video.reviewSchedule || []).map((task) =>
    task.kind === kind && !task.completedAt
      ? { ...task, completedAt: new Date().toISOString() }
      : task
  );
  await updateDoc(doc(requireDb(), 'videoItems', video.id), {
    reviewSchedule,
    status: 'REWATCHED',
    updatedAt: serverTimestamp(),
  });
}

export function computeGroupCounts(groups: Group[], videos: VideoItem[]) {
  return groups.map((group) => {
    const groupVideos = videos.filter((video) => video.groupId === group.id);
    const unreadCount = groupVideos.filter((video) => video.status === 'UNWATCHED').length;
    const reviewDueCount = groupVideos.reduce((total, video) => {
      const due = (video.reviewSchedule || []).filter((task) => {
        if (task.completedAt) return false;
        return new Date(task.dueAt).getTime() <= Date.now();
      }).length;
      return total + due;
    }, 0);
    const nextReviewDueAt = groupVideos
      .flatMap((video) => (video.reviewSchedule || []).filter((task) => !task.completedAt))
      .map((task) => task.dueAt)
      .sort()[0];

    return { groupId: group.id, unreadCount, reviewDueCount, nextReviewDueAt };
  });
}

export async function searchYouTubeChannelsByName(queryText: string): Promise<YouTubeChannelSearchResult[]> {
  const response = await fetch(`/api/youtube/search-channels?q=${encodeURIComponent(queryText)}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || 'Channel search failed');
  }
  const body = await response.json();
  return body.items as YouTubeChannelSearchResult[];
}

export async function exportUserData(ownerUid: string) {
  const [groups, channels, videos] = await Promise.all([
    listGroups(ownerUid),
    listGroupChannels(ownerUid),
    listVideos(ownerUid),
  ]);
  return { exportedAt: new Date().toISOString(), ownerUid, groups, channels, videos };
}

export async function deleteUserData(ownerUid: string) {
  const database = requireDb();
  const [groups, channels, videos] = await Promise.all([
    getDocs(query(collection(database, 'groups'), where('ownerUid', '==', ownerUid))),
    getDocs(query(collection(database, 'groupChannels'), where('ownerUid', '==', ownerUid))),
    getDocs(query(collection(database, 'videoItems'), where('ownerUid', '==', ownerUid))),
  ]);

  await Promise.all([
    ...groups.docs.map((d) => deleteDoc(d.ref)),
    ...channels.docs.map((d) => deleteDoc(d.ref)),
    ...videos.docs.map((d) => deleteDoc(d.ref)),
    setDoc(doc(database, 'deletionRequests', `${ownerUid}_${Date.now()}`), {
      ownerUid,
      requestedAt: serverTimestamp(),
      source: 'settings_screen',
    }),
  ]);
}
