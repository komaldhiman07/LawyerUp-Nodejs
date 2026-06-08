# Lawyer Laws Platform - System Architecture (v1)

This document defines the target architecture for law ingestion, law delivery, user categories, travel/state-diff detection, and notifications.

## 1) Scope

### Admin Portal
- Upload laws in bulk using CSV/Excel
- Add/edit/delete laws one by one
- Manage state-wise legal content and versions

### App User
- Browse laws by selected state
- Create personal law categories
- Add selected laws to those categories
- Receive notifications when traveling from source state to destination state and selected laws differ

## 2) Architecture Overview

- **Admin Portal UI** -> Admin APIs
- **Mobile App** -> User APIs
- **Backend (Node.js/Express)** as modular monolith
  - Auth & User module
  - Law Catalog module
  - CSV Ingestion module
  - User Category module
  - Location Transition module
  - Diff Engine module
  - Notification module
- **MongoDB** as primary datastore
- **Queue Worker (recommended)** for async CSV processing and notification fan-out
- **Push Provider** (FCM/APNS) for device notifications

## 3) Domain Model and Collections

## 3.1 `states`
Purpose: canonical state registry.

Fields:
- `code` (string, unique, ex: `CA`)
- `name` (string, ex: `California`)
- `country_code` (string, ex: `US`)
- `is_active` (boolean)
- timestamps

Indexes:
- unique(`code`)

## 3.2 `laws_master`
Purpose: canonical legal topic identity across states.

Fields:
- `law_key` (string, unique stable key, ex: `seatbelt_front`)
- `title` (string)
- `category_tags` (array<string>)
- `description_global` (string, optional)
- `is_active` (boolean)
- timestamps

Indexes:
- unique(`law_key`)

## 3.3 `state_laws`
Purpose: state-specific law representation and versioning.

Fields:
- `state_code` (string, ref `states.code`)
- `law_key` (string, ref `laws_master.law_key`)
- `summary` (string)
- `details` (string)
- `penalty` (string, optional)
- `status` (enum: `active`, `repealed`, `draft`)
- `effective_from` (date, optional)
- `effective_to` (date, optional)
- `version` (number)
- `change_source` (enum: `manual`, `csv`)
- `last_changed_by` (ObjectId/string)
- timestamps

Indexes:
- (`state_code`, `law_key`, `version`)
- unique active record constraint by (`state_code`, `law_key`, `status=active`) via service validation

## 3.4 `users`
Purpose: profile + location snapshot + notification metadata.

Important fields:
- `selected_home_state` (string)
- `current_location`:
  - `lat`, `lng`
  - `state`, `city`
  - `updated_at`
- `previous_location`:
  - `state`, `city`
  - `changed_at`
- `location_meta`:
  - `last_processed_at`
  - `last_state_change_at`
  - `last_notified_state`
  - `last_notified_at`

## 3.5 `user_law_categories`
Purpose: user-defined folders/tags for selected laws.

Fields:
- `user_id`
- `name`
- `state_scope` (string, optional)
- `is_default` (boolean)
- timestamps

Indexes:
- (`user_id`, `name`) unique

## 3.6 `user_category_laws`
Purpose: map selected laws to user category.

Fields:
- `category_id`
- `law_key`
- `priority` (number, optional)
- `note` (string, optional)
- `color` (string, optional)
- timestamps

Indexes:
- unique(`category_id`, `law_key`)

## 3.7 `travel_events`
Purpose: immutable record of detected transitions.

Fields:
- `user_id`
- `source_state`
- `destination_state`
- `source_city` (optional)
- `destination_city` (optional)
- `detected_at`
- `source` (enum: `foreground_location_update`)
- `diff_snapshot_id` (optional)

Indexes:
- (`user_id`, `detected_at`)

## 3.8 `law_diff_snapshots`
Purpose: preserve the exact diff sent/shown at time of travel.

Fields:
- `user_id`
- `category_id`
- `source_state`
- `destination_state`
- `law_catalog_version_hash`
- `differences` (array of diff objects)
- `total_differences` (number)
- timestamps

Indexes:
- (`user_id`, `source_state`, `destination_state`, `createdAt`)

## 3.9 `notifications`
Purpose: in-app notification record + push dedupe.

Fields:
- `user_id`
- `type` (ex: `state_transition_law_diff`)
- `title`
- `message`
- `payload` (JSON)
- `dedupe_key`
- `is_read`
- `created_at`

Indexes:
- (`user_id`, `created_at`)
- unique(`dedupe_key`) for idempotency

## 3.10 CSV Operations

### `ingestion_jobs`
- `job_id`
- `uploaded_by`
- `file_name`
- `status` (`queued`, `processing`, `completed`, `failed`, `partial`)
- `total_rows`, `success_rows`, `error_rows`
- `error_report_url` (optional)
- timestamps

### `ingestion_errors`
- `job_id`
- `row_number`
- `error_code`
- `error_message`
- `raw_row`
- timestamps

## 4) Service Boundaries

## 4.1 Law Catalog Service
- CRUD for `laws_master` and `state_laws`
- version bump logic
- consistency checks (`state_code`, `law_key`)

## 4.2 CSV Ingestion Service
- parse, validate, normalize CSV rows
- upsert catalog entries
- persist row-level errors
- produce ingestion summary

## 4.3 User Category Service
- create/update/delete user categories
- attach/detach selected `law_key` values

## 4.4 Location Transition Service
- process foreground location updates
- state transition detection
- emit transition event

## 4.5 Diff Engine
- compare selected `law_key` values between source/destination state
- classify differences: changed/missing_source/missing_destination
- generate snapshot-ready output

## 4.6 Notification Service
- create in-app notification record
- send push via FCM/APNS
- dedupe by transition + category + catalog version

## 5) API Groups

## 5.1 Admin APIs
- `POST /admin/laws/upload` - upload CSV file
- `GET /admin/laws/upload/:jobId` - ingestion status
- `GET /admin/laws/upload/:jobId/errors` - row errors
- `POST /admin/laws` - add state law manually
- `PUT /admin/laws/:id` - edit state law
- `DELETE /admin/laws/:id` - soft delete/repeal law
- `GET /admin/laws?state=CA&q=seatbelt` - filter/search

## 5.2 User APIs
- `GET /laws/states/:stateCode` - list laws by state
- `POST /user/categories` - create category
- `GET /user/categories` - list categories
- `PUT /user/categories/:id` - update category
- `DELETE /user/categories/:id` - delete category
- `POST /user/categories/:id/laws` - attach selected laws
- `DELETE /user/categories/:id/laws/:lawKey` - detach selected law
- `POST /user/location/update` - current location update
- `GET /user/location/laws/current` - current state laws
- `GET /user/location/laws/diff` - source/destination diff
- `GET /user/notifications` - list in-app notifications

## 6) Sequence Flows

## 6.1 Admin CSV Upload
1. Admin uploads CSV.
2. API creates `ingestion_job` with `queued`.
3. Worker processes each row:
   - validate state, law key, required fields
   - upsert `laws_master`
   - upsert `state_laws` with version rules
   - record row errors if any
4. Job marked `completed` or `partial`.
5. Admin fetches summary and errors.

## 6.2 User Travel Transition
1. App sends `POST /user/location/update` while foreground.
2. Backend resolves state/city (payload or reverse geocode).
3. If state changed:
   - save `previous_location` and `current_location`
   - write `travel_event`
   - select user default category (or requested category)
   - run Diff Engine on selected `law_key`
   - save `law_diff_snapshot`
   - create notification + push
4. App calls diff API to display detailed changes.

## 6.3 Manual Law Edit Impact
1. Admin edits a state law.
2. New `version` becomes active.
3. Optional asynchronous re-evaluation for users currently in that state.
4. Notify users if enabled and not already notified for same `law_catalog_version_hash`.

## 7) Notification and Dedupe Strategy

Use `dedupe_key`:
- `userId:sourceState:destinationState:categoryId:catalogHash`

Rules:
- Do not send duplicate notifications for same travel+category+catalog hash.
- If law catalog changes (new hash), a new notification is allowed.

## 8) Versioning and Audit

- Every meaningful law edit should bump `state_laws.version`.
- Keep previous versions for audit/history.
- Keep diff snapshots immutable for legal traceability.

## 9) Security and Access Control

- Admin APIs: role-restricted (`admin` only)
- User APIs: authenticated user
- CSV upload file type validation and size limits
- Input validation on all query/body parameters
- Audit trail for admin edits (`last_changed_by`)

## 10) Performance Notes

- Index `state_laws` by `state_code + law_key`
- Cache state law lists for short TTL where safe
- Move CSV processing and large fan-out notifications to worker queues
- Keep travel diff computation small by evaluating only user-selected laws

## 11) V1 Rollout Plan

1. Finalize collections and indexes.
2. Implement admin manual CRUD for `state_laws`.
3. Implement CSV ingestion jobs + error reporting.
4. Implement user categories using `law_key`.
5. Enable travel transition diff + notification with dedupe.
6. Add observability dashboards (ingestion failures, notification success, diff latency).

## 12) Future-Ready Extensions

- Prioritize laws by severity/risk and user profile.
- Geo-fence pre-alerts near borders.
- Personalized diff summarization by AI.
- Multi-country support (country-specific state/province hierarchy).
