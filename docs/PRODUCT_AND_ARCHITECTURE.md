# YouTube Learning Organizer (MVP) - Product + Solution Deliverables

## 1) 1-Page PRD

### Problem
Users learn from YouTube across many channels, but YouTube is optimized for discovery/watch-time, not structured learning. Users need a way to organize permitted YouTube content into learning groups (e.g., "Stock Study"), track what is unread/watched, and get spaced-review reminders.

### Target User
- Self-directed learners using YouTube as a recurring study source
- Professionals tracking topic-specific channels (investing, coding, design, language learning)
- Users who want lightweight review reminders without replacing YouTube playback

### Value Proposition
- Organize channels/videos into topic-based learning groups
- See unread and review-due counts at a glance
- Create spaced repetition prompts (D+7, D+30) after watching
- Stay compliant by using YouTube Data API/OAuth and official YouTube playback only

### MVP Scope
- Firebase Auth (Google login)
- Create/edit groups
- Add channels to groups (manual channelId or YouTube API search by channel name)
- Store video metadata and status: `UNWATCHED`, `WATCHED`, `REVIEW`, `REWATCHED`
- On `WATCHED`: schedule reviews at +7 days and +30 days
- Dashboard group cards with unread + review-due counts
- Group detail page with channel list and video list filtered by status
- Settings: export/delete user data and sign-out

### Non-Goals (MVP)
- Full automatic watch-history tracking
- Transcript ingestion at scale
- AI summarization
- Replacing YouTube playback UI

### Risks
- Watch history access is not reliably available via YouTube Data API for all users/scopes
- YouTube quota limits for search/video metadata sync
- Firestore cost growth if storing large metadata history without retention policies
- User confusion if expecting automatic sync from YouTube watch behavior

### Success Metrics (MVP)
- Activation: `% users who create first group within first session`
- Setup completion: `% users who add at least 1 channel`
- Learning usage: `avg groups/user`, `avg videos marked WATCHED/user/week`
- Review adherence: `% due review tasks completed within 7 days`
- Retention proxy: `% users with activity in 2+ weeks`
- Privacy trust: `% delete/export requests completed successfully`

## 2) UX Flows

### Install / Connect
1. User opens web app
2. Login page explains compliance model (companion app, not a downloader)
3. User signs in with Google (Firebase Auth)
4. App redirects to dashboard

### Group Setup
1. User creates group (name, description, color)
2. User opens group detail
3. User adds channels by:
   - manual `channelId`
   - YouTube channel search (API-backed)
4. User optionally seeds/adds video metadata (manual helper in MVP)

### Dashboard
1. User sees group cards
2. Each card shows unread count and review-due count
3. User clicks group card to manage details
4. User can navigate to review queue or settings

### Group Detail
1. User edits group metadata
2. User manages channel list (add/remove)
3. User views videos with status filter (`ALL`, `UNWATCHED`, `WATCHED`, `REVIEW`, `REWATCHED`)
4. User marks video `WATCHED` to generate D+7 and D+30 review tasks
5. User completes review tasks or updates status manually
6. User opens official YouTube watch page or embed URL (no custom player overlay)

### Review Queue
1. App lists pending review tasks sorted by due date
2. User sees due vs upcoming labels
3. User opens video on YouTube and completes review
4. User marks review task completed (updates status to `REWATCHED`)

### Settings / Privacy
1. User generates export JSON (groups, channels, videos, statuses)
2. User deletes stored app data (Firestore docs) and audit request doc is recorded
3. User signs out
4. User can manually revoke Google access in Google Account settings

## 3) Information Architecture + Screen List (Web First)

### IA (Web MVP)
- `/login`
  - Google sign-in
  - compliance copy
- `/dashboard`
  - group summary cards
  - create group panel
  - quick links to review/settings
- `/groups/[id]`
  - edit group metadata
  - channel manager (manual/search)
  - video metadata list + status filters/actions
- `/review`
  - due/upcoming review queue
  - open-on-YouTube + mark reviewed actions
- `/settings`
  - data export
  - data deletion
  - sign-out / privacy instructions

### Mobile Later (Planned)
- Mobile dashboard (same IA, simplified cards)
- Mobile review queue (focus mode)
- Push notifications for due reviews (FCM)
- Offline cached queue read-only mode

## 4) Firestore Data Model (Collections, Fields, Indexes)

### Collections

#### `groups`
- `ownerUid: string`
- `name: string`
- `description: string`
- `color: string`
- `createdAt: timestamp`
- `updatedAt: timestamp`

#### `groupChannels`
- `ownerUid: string`
- `groupId: string`
- `channelId: string` (YouTube channel ID)
- `title: string`
- `thumbnailUrl?: string`
- `source: 'MANUAL' | 'YOUTUBE_SEARCH'`
- `createdAt: timestamp`

#### `videoItems`
- `ownerUid: string`
- `groupId: string`
- `channelId: string`
- `youtubeVideoId: string`
- `title: string`
- `thumbnailUrl?: string`
- `publishedAt?: string` (ISO)
- `status: 'UNWATCHED' | 'WATCHED' | 'REVIEW' | 'REWATCHED'`
- `watchedAt?: string` (ISO)
- `reviewSchedule: Array<{ kind: 'D7' | 'D30', dueAt: string, completedAt?: string }>`
- `createdAt: timestamp`
- `updatedAt: timestamp`

#### `reviewQueue` (derived by Cloud Function; optional for MVP UI because UI can compute client-side)
- `ownerUid: string`
- `videoId: string`
- `groupId: string`
- `youtubeVideoId: string`
- `title: string`
- `dueCount: number`
- `dueKinds: string[]`
- `nextDueAt: string | null`
- `active: boolean`
- `updatedAt: timestamp`

#### `deletionRequests`
- `ownerUid: string`
- `requestedAt: timestamp`
- `source: 'settings_screen' | 'callable_function'`
- `status?: string`

### Indexes (implemented in `firestore.indexes.json`)
- `groups`: `ownerUid ASC, name ASC`
- `groupChannels`: `ownerUid ASC, title ASC`
- `groupChannels`: `ownerUid ASC, groupId ASC, title ASC`
- `videoItems`: `ownerUid ASC, publishedAt DESC`
- `videoItems`: `ownerUid ASC, groupId ASC, publishedAt DESC`

## 5) Security Rules (Least Privilege)

### Principles
- Every user can only read/write docs where `ownerUid == request.auth.uid`
- `ownerUid` cannot be changed after creation
- `reviewQueue` is read-only to clients (server-managed)
- `deletionRequests` can be created/read by the owner, not modified/deleted by clients

### Implementation
- See `firestore.rules`
- Client writes are allowed only for `groups`, `groupChannels`, `videoItems`, `deletionRequests` under owner constraints

## 6) Cloud Functions Design

### Daily Job to Compute Review Queue
- Function: `computeDailyReviewQueue`
- Trigger: Cloud Scheduler via Firebase scheduled function (`onSchedule`)
- Cadence: daily (e.g., `03:00 UTC`)
- Inputs: all `videoItems` (or partitioned by owner in future)
- Logic:
  1. Read each video's `reviewSchedule`
  2. Filter incomplete tasks with `dueAt <= now`
  3. Upsert `reviewQueue/{ownerUid}_{videoId}`
  4. Mark inactive if no due tasks remain
- Output: server-managed review summary docs for fast dashboard/review queries

### Webhook / Cron Approach
- Preferred MVP: Cloud Scheduler (`onSchedule`) because no external webhook infra needed
- Optional manual recompute: callable function or admin endpoint for backfill/debug
- Future optimization: event-driven update on `videoItems` writes + daily reconciliation cron

### Data Deletion Workflow
- User initiates delete from `/settings`
- Client deletes owned app data in MVP (groups/channels/videos) and logs `deletionRequests/{uid}`
- Server version (recommended): callable function `requestUserDataDeletion`
  - validates auth
  - deletes all owned docs in batch/chunks
  - writes audit record (`COMPLETED`/`FAILED`)
- User can separately revoke Google OAuth access in Google Account security settings

## 7) Working Web Dashboard Skeleton (Next.js + Firebase)

### Implemented
- Next.js App Router skeleton with pages:
  - `/login`
  - `/dashboard`
  - `/groups/[id]`
  - `/review`
  - `/settings`
- Firebase Auth Google login (client-side)
- Firestore CRUD for groups/channels/videos
- Dashboard group cards with unread count + review-due count
- Group detail with channels list and videos list filtered by status
- Review scheduler logic (D+7 / D+30) on `WATCHED`
- Settings export + delete flows
- YouTube channel search API route proxy (`/api/youtube/search-channels`)

### Key Files
- `app/*` routes
- `components/*` UI and page clients
- `lib/firestore.ts` Firestore operations + count computation
- `lib/scheduler.js` scheduler logic used by app and tests
- `firestore.rules`, `firestore.indexes.json`
- `firebase/functions/src/index.ts` scheduled job + deletion callable skeleton

## 8) Minimal Integration Plan for YouTube Data API

### Endpoints / Resources to Use
- Channel search (manual assist): `search.list`
  - `part=snippet`, `type=channel`, `q={channelName}`
- Channel metadata validation (optional): `channels.list`
  - `id={channelId}`, `part=snippet,contentDetails,statistics`
- Playlist metadata (channel uploads playlist): `channels.list`
  - `part=contentDetails` to obtain uploads playlist ID
- Playlist videos: `playlistItems.list`
  - `playlistId={uploadsPlaylistId}`, `part=snippet,contentDetails`
- Video metadata enrichment: `videos.list`
  - `id={videoIds}`, `part=snippet,contentDetails,statistics,status`
- Subscriptions (user-permitted, OAuth scope required): `subscriptions.list`
  - `mine=true`, `part=snippet,contentDetails`

### What We Can Reliably Fetch
- Channel identities and metadata
- User subscriptions (with correct OAuth scopes and user consent)
- Public video metadata for known video IDs/channels
- Channel uploads playlist and latest uploads
- Thumbnails, titles, publish timestamps, channel/video IDs

### What We Cannot Reliably Fetch (MVP)
- Complete personal watch history for all users (not consistently available via YouTube Data API for this use case)
- Exact watch progress / completion percentage from YouTube player
- Ad events, playback internals, or UI interaction telemetry from YouTube site
- Any data that would require scraping/automation of YouTube UI

### Fallback Strategy When Watch-History Is Not Available
- User-driven state updates in app (`UNWATCHED` -> `WATCHED` -> `REVIEW` -> `REWATCHED`)
- Optional "Mark watched" action from group detail or review queue after viewing on YouTube
- Optional import from uploads/subscriptions metadata to build candidate lists without claiming watch status
- Future enhancement: browser extension or mobile share-intent can send explicit user actions (still no scraping)
