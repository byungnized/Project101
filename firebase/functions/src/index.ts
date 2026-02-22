import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions';
import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) initializeApp();
const db = getFirestore();

function buildDueTasks(reviewSchedule: Array<{ kind: 'D7' | 'D30'; dueAt: string; completedAt?: string }> = []) {
  const now = Date.now();
  return reviewSchedule.filter((task) => !task.completedAt && new Date(task.dueAt).getTime() <= now);
}

export const computeDailyReviewQueue = onSchedule(
  {
    schedule: 'every day 03:00',
    timeZone: 'Etc/UTC',
    region: 'us-central1',
  },
  async () => {
    logger.info('Running daily review queue computation');
    const videoSnap = await db.collection('videoItems').get();
    const batch = db.batch();

    for (const doc of videoSnap.docs) {
      const data = doc.data();
      const dueTasks = buildDueTasks(data.reviewSchedule || []);
      const reviewDocId = `${data.ownerUid}_${doc.id}`;

      if (dueTasks.length === 0) {
        batch.set(
          db.collection('reviewQueue').doc(reviewDocId),
          {
            ownerUid: data.ownerUid,
            videoId: doc.id,
            groupId: data.groupId,
            dueCount: 0,
            nextDueAt: null,
            updatedAt: FieldValue.serverTimestamp(),
            active: false,
          },
          { merge: true }
        );
        continue;
      }

      const nextDueAt = dueTasks.map((t) => t.dueAt).sort()[0];
      batch.set(
        db.collection('reviewQueue').doc(reviewDocId),
        {
          ownerUid: data.ownerUid,
          videoId: doc.id,
          groupId: data.groupId,
          youtubeVideoId: data.youtubeVideoId,
          title: data.title,
          dueCount: dueTasks.length,
          dueKinds: dueTasks.map((t) => t.kind),
          nextDueAt,
          active: true,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();
    logger.info('Daily review queue computation complete', { processedVideos: videoSnap.size });
  }
);

export const requestUserDataDeletion = onCall({ region: 'us-central1' }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Authentication required');
  }

  const ownerUid = request.auth.uid;
  const [groups, channels, videos] = await Promise.all([
    db.collection('groups').where('ownerUid', '==', ownerUid).get(),
    db.collection('groupChannels').where('ownerUid', '==', ownerUid).get(),
    db.collection('videoItems').where('ownerUid', '==', ownerUid).get(),
  ]);

  const batch = db.batch();
  groups.docs.forEach((doc) => batch.delete(doc.ref));
  channels.docs.forEach((doc) => batch.delete(doc.ref));
  videos.docs.forEach((doc) => batch.delete(doc.ref));
  batch.set(db.collection('deletionRequests').doc(ownerUid), {
    ownerUid,
    requestedAt: FieldValue.serverTimestamp(),
    source: 'callable_function',
    status: 'COMPLETED',
  }, { merge: true });

  await batch.commit();
  return { deleted: { groups: groups.size, channels: channels.size, videos: videos.size } };
});
