export const DAY_MS = 24 * 60 * 60 * 1000;

export type ReviewKind = 'D7' | 'D30';
export type ReviewTask = { kind: ReviewKind; dueAt: string; completedAt?: string };

function toIso(date: Date | string | number) {
  return new Date(date).toISOString();
}

export function addDays(baseDate: Date | string | number, days: number) {
  return new Date(new Date(baseDate).getTime() + days * DAY_MS);
}

export function buildReviewSchedule(watchedAt: Date | string | number = new Date()): ReviewTask[] {
  const base = new Date(watchedAt);
  return [
    { kind: 'D7', dueAt: toIso(addDays(base, 7)) },
    { kind: 'D30', dueAt: toIso(addDays(base, 30)) },
  ];
}

export function upsertWatchedStatus<T extends Record<string, unknown>>(video: T, watchedAt: Date | string | number = new Date()) {
  return {
    ...video,
    status: 'WATCHED',
    watchedAt: toIso(watchedAt),
    reviewSchedule: buildReviewSchedule(watchedAt),
    updatedAt: toIso(new Date()),
  };
}

export function getDueReviewTasks(
  videos: Array<{
    id: string;
    groupId: string;
    channelId: string;
    youtubeVideoId: string;
    title: string;
    reviewSchedule?: ReviewTask[];
  }>,
  now: Date | string | number = new Date()
) {
  const nowTs = new Date(now).getTime();
  return videos.flatMap((video) =>
    (video.reviewSchedule || [])
      .filter((task) => !task.completedAt && new Date(task.dueAt).getTime() <= nowTs)
      .map((task) => ({
        videoId: video.id,
        groupId: video.groupId,
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        channelId: video.channelId,
        kind: task.kind,
        dueAt: task.dueAt,
      }))
  );
}
