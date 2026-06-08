# Admin Laws APIs

Base path: `/admin/laws`  
Auth: `Bearer` token required  
Access: Admin role only

## 1) Law Master

### `GET /admin/laws/master`
List canonical laws.

Query:
- `q` (optional search by title/law_key)
- `domain` (optional)
- `start` (default `0`)
- `limit` (default `20`)

### `POST /admin/laws/master`
Create canonical law.

Body:
```json
{
  "law_key": "seatbelt_front",
  "title": "Front Seat Belt Requirement",
  "short_title": "Seat Belt",
  "description_global": "General law context",
  "domain": "driving",
  "sub_domain": "safety",
  "tags": ["driving", "safety"],
  "severity": "medium",
  "risk_score": 60
}
```

### `PUT /admin/laws/master/:id`
Update canonical law fields.

## 2) State Laws

### `GET /admin/laws/state`
List state laws.

Query:
- `state_code` (optional, ex: `CA`)
- `law_key` (optional)
- `status` (optional: `draft|active|repealed`)
- `start`, `limit`

### `POST /admin/laws/state`
Create state-specific law entry.

Body:
```json
{
  "state_code": "CA",
  "law_key": "seatbelt_front",
  "title": "Front Seat Belt Requirement",
  "summary": "Front-seat passengers must wear seat belts.",
  "details": "Detailed legal text for California.",
  "penalty_text": "Fine up to $162",
  "status": "draft",
  "effective_from": "2022-01-01"
}
```

### `PUT /admin/laws/state/:id`
Update state law.  
Version auto-increments when core content fields change.

### `POST /admin/laws/state/:id/publish`
Marks state law as active and sets `published_at`.

### `POST /admin/laws/state/:id/repeal`
Marks state law as repealed and inactive.

### `DELETE /admin/laws/state/:id`
Soft-delete state law (`is_deleted=true`).

## 3) CSV Ingestion Tracking

### `GET /admin/laws/ingestion/jobs`
List ingestion jobs.

Query:
- `status` (optional)
- `start`, `limit`

### `GET /admin/laws/ingestion/jobs/:job_id/errors`
List row-level ingestion errors for a job.

## Standard Response Format

```json
{
  "status": 200,
  "success": true,
  "message": "Data loaded successfully.",
  "data": []
}
```
