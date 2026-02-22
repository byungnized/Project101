const DAY_MS = 24 * 60 * 60 * 1000;

function toIso(date) {
  return new Date(date).toISOString();
}

function addDays(baseDate, days) {
  return new Date(new Date(baseDate).getTime() + days * DAY_MS);
}

function buildReviewSchedule(watchedAt = new Date()) {
  const base = new Date(watchedAt);
  return [
    { kind: 'D7', dueAt: toIso(addDays(base, 7)) },
    { kind: 'D30', dueAt: toIso(addDays(base, 30)) },
  ];
}

function upsertWatchedStatus(video, watchedAt = new Date()) {
  return {
    ...video,
    status: 'WATCHED',
    watchedAt: toIso(watchedAt),
    reviewSchedule: buildReviewSchedule(watchedAt),
    updatedAt: toIso(new Date()),
  };
}

function getDueReviewTasks(videos, now = new Date()) {
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

module.exports = {
  DAY_MS,
  addDays,
  buildReviewSchedule,
  getDueReviewTasks,
  upsertWatchedStatus,
};
