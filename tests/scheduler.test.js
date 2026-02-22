const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildReviewSchedule,
  getDueReviewTasks,
  upsertWatchedStatus,
} = require('../lib/scheduler.js');

test('buildReviewSchedule creates D7 and D30 tasks from watchedAt', () => {
  const watchedAt = new Date('2026-02-01T00:00:00.000Z');
  const schedule = buildReviewSchedule(watchedAt);

  assert.equal(schedule.length, 2);
  assert.deepEqual(schedule.map((t) => t.kind), ['D7', 'D30']);
  assert.equal(schedule[0].dueAt, '2026-02-08T00:00:00.000Z');
  assert.equal(schedule[1].dueAt, '2026-03-03T00:00:00.000Z');
});

test('upsertWatchedStatus sets WATCHED and generates review schedule', () => {
  const watchedAt = new Date('2026-02-20T12:00:00.000Z');
  const updated = upsertWatchedStatus(
    {
      id: 'v1',
      status: 'UNWATCHED',
      title: 'Example',
    },
    watchedAt
  );

  assert.equal(updated.status, 'WATCHED');
  assert.equal(updated.watchedAt, '2026-02-20T12:00:00.000Z');
  assert.equal(updated.reviewSchedule.length, 2);
});

test('getDueReviewTasks returns only incomplete due tasks', () => {
  const videos = [
    {
      id: 'v1',
      groupId: 'g1',
      channelId: 'c1',
      youtubeVideoId: 'abc',
      title: 'Past due',
      reviewSchedule: [
        { kind: 'D7', dueAt: '2026-02-01T00:00:00.000Z' },
        { kind: 'D30', dueAt: '2026-03-01T00:00:00.000Z' },
      ],
    },
    {
      id: 'v2',
      groupId: 'g1',
      channelId: 'c2',
      youtubeVideoId: 'def',
      title: 'Completed',
      reviewSchedule: [
        { kind: 'D7', dueAt: '2026-02-01T00:00:00.000Z', completedAt: '2026-02-02T00:00:00.000Z' },
      ],
    },
  ];

  const due = getDueReviewTasks(videos, new Date('2026-02-22T00:00:00.000Z'));

  assert.equal(due.length, 1);
  assert.equal(due[0].videoId, 'v1');
  assert.equal(due[0].kind, 'D7');
});
