# Firestore Rules Analysis

Date: 2026-06-29

## Firestore Instance

- Project: `sci-listen-guide`
- Database: `(default)`
- Edition: `STANDARD`
- Type: `FIRESTORE_NATIVE`
- Location: `asia-east1`

## Existing Firestore Usage

- Admin scripts use `firebase-admin` for `episodes` and `podcastEpisodes`.
- Public app server code reads `episodes` through the Firestore REST API at build time.
- New client-side authenticated usage writes only `users/{uid}` through Firebase Web SDK.

## Client Collections And Paths

- `users/{uid}`
  - Read: authenticated user reads own document once after login.
  - Create/update: authenticated user creates or updates own document after login and game completion.
  - Delete: not needed.
- `episodes/{episodeId}`
  - Read: public build-time REST queries read only documents where `status == "published"`.
  - Write: not needed by the public client. Admin scripts use Firebase Admin SDK.

## Client Queries

- No Firestore collection queries are used by the client for user progress.
- The client uses direct document reads/writes only.
- Static export build uses public REST queries against `episodes` with `status == "published"`.

## User Document Data Model

- `uid`: string, required, immutable, must match document ID and `request.auth.uid`.
- `email`: string, required, must match `request.auth.token.email`.
- `displayName`: string, required, max 80 chars.
- `marketingOptIn`: bool, required, defaults to false.
- `completions`: map, required.
  - Keys must be known episode IDs from `public/stage_1_categories.json`.
  - Values must be integers from 1 to 3.
- `completedCount`: int, required, must equal `completions.size()`.
- `createdAt`: timestamp, required, immutable after create.
- `lastLoginAt`: timestamp, required.
- `updatedAt`: timestamp, required.

## Devil's Advocate Notes

- Public list/read exploit: default deny plus owner-only `users/{uid}` rules block unauthenticated and cross-user reads.
- Unauthorized write: document ID must match `request.auth.uid`, and stored `uid` must match.
- Update bypass/schema pollution: allowed fields are fixed and validator is used on create and update.
- PII leak: `users/{uid}` contains email, so only owner can read it.
- Resource exhaustion: strings and maps have size limits; completions keys are limited to known episodes.
- Privilege escalation: no role or permission fields exist in this schema.
- Required field omission: validator requires all required fields after create/update.
- Immutable field modification: `uid` and `createdAt` cannot change on update.
