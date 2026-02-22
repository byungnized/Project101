# YouTube Learning Organizer (Firebase + Next.js MVP)

A compliant companion app (not a YouTube replacement) for organizing user-permitted YouTube learning content into groups and spaced review queues.

## Compliance Constraints (MVP)
- Uses YouTube Data API + OAuth only (no scraping)
- Does not download videos or bypass ads
- Playback should use official YouTube IFrame embed or open on YouTube
- Supports user export + delete of stored app data

## Features Implemented (MVP)
- Google login with Firebase Auth
- Group create/edit
- Add channels to groups (manual channelId or YouTube channel search API)
- Store video metadata + status (`UNWATCHED`, `WATCHED`, `REVIEW`, `REWATCHED`)
- Review scheduler on `WATCHED` (`+7d`, `+30d`)
- Dashboard counts per group (unread + review due)
- Review queue page
- Settings export/delete flows
- Firestore security rules + indexes
- Cloud Functions skeleton for scheduled review queue and deletion callable
- Scheduler tests

## Project Structure
- `app/` Next.js routes (login/dashboard/group/review/settings + API route)
- `components/` UI and page clients
- `lib/` Firebase client, auth context, Firestore helpers, scheduler logic
- `tests/` scheduler tests (`node:test`)
- `seed/sample-data.json` sample data payload
- `firebase/functions/` Cloud Functions skeleton
- `docs/PRODUCT_AND_ARCHITECTURE.md` PRD + architecture deliverables

## Prerequisites
- Node.js 20+
- Firebase project (Auth + Firestore enabled)
- Google Cloud project with YouTube Data API v3 enabled
- Firebase CLI (optional, for emulators/deploy)

## Local Setup
1. Install dependencies:
   - `npm install`
2. Create env file:
   - `cp .env.example .env.local`
3. Fill `.env.local` with Firebase web app config and `YOUTUBE_DATA_API_KEY`
4. In Firebase Console:
   - Enable Authentication -> Google provider
   - Enable Firestore (Native mode)
5. Run the app:
   - `npm run dev`
6. Open:
   - `http://localhost:3000`

## Firestore Rules / Indexes (Local or Deploy)
- Rules: `firestore.rules`
- Indexes: `firestore.indexes.json`
- Firebase config: `firebase.json`

Using Firebase CLI:
- `firebase emulators:start`
- `firebase deploy --only firestore:rules,firestore:indexes`

## Seed Data (Demo)
Sample payload is provided at `seed/sample-data.json`.

Manual import options:
- Copy values into Firestore documents via Firebase Console for a test user UID
- Or write a quick import script using Admin SDK (not included to avoid credential assumptions)

Recommended demo path:
1. Create a group in UI
2. Add channels manually or with search
3. Add video metadata in `/groups/[id]` using the MVP helper form
4. Mark a video `WATCHED`
5. Check `/review` and `/dashboard` counts

## Tests
Run scheduler unit tests:
- `npm test`

These validate:
- D+7 / D+30 schedule generation
- WATCHED transition scheduling
- Due review task filtering

## Cloud Functions (Skeleton)
Location: `firebase/functions/src/index.ts`
- `computeDailyReviewQueue` scheduled job (cron)
- `requestUserDataDeletion` callable deletion workflow

To use functions locally/deploy:
1. `cd firebase/functions`
2. `npm install`
3. `npm run build`
4. Run emulators/deploy via Firebase CLI

## Notes / Limitations
- MVP uses manual video metadata entry helper in group detail page until automated YouTube sync is added
- Watch history is not automatically imported (explicitly out of MVP scope)
- Dashboard review counts are computed client-side from `videoItems.reviewSchedule` (server-derived `reviewQueue` is included as future-ready design)
