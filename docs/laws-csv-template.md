# Laws CSV Template Specification

This document defines the CSV format used by Admin Portal for bulk law ingestion.

## 1) File Requirements

- Allowed file types: `.csv` (UTF-8)
- First row must be header
- Comma-separated values
- Quote values containing commas with double quotes
- Date format: `YYYY-MM-DD`
- Boolean format: `true` or `false`

## 2) Template Columns

Use this exact header order for v1:

```csv
state_code,law_key,title,summary,details,penalty,status,effective_from,effective_to,category_tags,is_active
```

## 3) Column Definitions

## 3.1 `state_code` (required)
- Type: string
- Example: `CA`, `NY`, `TX`
- Rules:
  - Must exist in `states.code`
  - Uppercase 2-letter preferred for US

## 3.2 `law_key` (required)
- Type: string
- Example: `seatbelt_front`, `open_container_vehicle`
- Rules:
  - Stable canonical key across states
  - Lowercase + underscore recommended
  - Regex recommendation: `^[a-z0-9_]{3,80}$`

## 3.3 `title` (required)
- Type: string
- Max length: 200
- Human-readable law title

## 3.4 `summary` (required)
- Type: string
- Max length: 500
- Short law summary shown in lists/cards

## 3.5 `details` (required)
- Type: string
- Max length: 5000
- Detailed state-specific legal text

## 3.6 `penalty` (optional)
- Type: string
- Max length: 500
- Example: `Fine up to $250`

## 3.7 `status` (required)
- Type: enum
- Allowed values: `active`, `repealed`, `draft`

## 3.8 `effective_from` (optional)
- Type: date (`YYYY-MM-DD`)

## 3.9 `effective_to` (optional)
- Type: date (`YYYY-MM-DD`)
- Rule:
  - if present, must be >= `effective_from`

## 3.10 `category_tags` (optional)
- Type: string list
- Delimiter: pipe (`|`)
- Example: `driving|safety|vehicles`
- Processing:
  - split by `|`
  - trim spaces
  - dedupe values

## 3.11 `is_active` (required)
- Type: boolean
- Allowed values: `true`, `false`
- Note:
  - if `false`, backend can keep record but exclude from active listing

## 4) Example CSV Rows

```csv
state_code,law_key,title,summary,details,penalty,status,effective_from,effective_to,category_tags,is_active
CA,seatbelt_front,Front Seat Belt Requirement,All front-seat passengers must wear seat belts,California requires seat belts for all front-seat occupants while vehicle is moving,Fine up to $162,active,2022-01-01,,driving|safety|vehicles,true
TX,seatbelt_front,Front Seat Belt Requirement,Seat belt required for front-seat occupants,Texas requires all front-seat passengers to wear seat belts,Fine up to $200,active,2021-06-01,,driving|safety|vehicles,true
NY,open_container_vehicle,Open Container in Vehicle,No open alcohol container in passenger area,New York prohibits open alcohol containers in passenger compartments,Fine up to $150,active,2020-03-15,,alcohol|driving,true
CA,open_container_vehicle,Open Container in Vehicle,No open alcohol container in vehicle passenger area,California prohibits possession of open alcoholic beverage containers in passenger area,Fine up to $250,active,2020-01-01,,alcohol|driving,true
TX,texting_while_driving,Texting While Driving Ban,Texting is prohibited while driving,Texas law prohibits reading or sending text messages while operating a motor vehicle,Fine up to $200,active,2017-09-01,,driving|mobile-use,true
```

## 5) Ingestion Behavior (Backend)

For each row:
1. Validate schema and required values.
2. Normalize:
   - `state_code` -> uppercase
   - `law_key` -> lowercase
   - `status` -> lowercase enum
3. Upsert into `laws_master` by `law_key`.
4. Upsert into `state_laws` by `state_code + law_key`.
5. Versioning:
   - If law content changed (`summary/details/penalty/status/effective dates`), increment `version`.
   - If unchanged, skip version bump.
6. Record row errors in `ingestion_errors`.

## 6) Error Codes (Recommended)

- `INVALID_STATE_CODE`
- `INVALID_LAW_KEY`
- `MISSING_REQUIRED_FIELD`
- `INVALID_STATUS`
- `INVALID_DATE_FORMAT`
- `INVALID_DATE_RANGE`
- `TEXT_TOO_LONG`
- `DUPLICATE_ROW_IN_FILE`
- `UNEXPECTED_ERROR`

## 7) Idempotency Rules

- Re-uploading same unchanged file should not create duplicate active records.
- Backend should detect unchanged row payload and no-op update.

## 8) Admin Portal Validation Rules

Pre-validate in UI before upload:
- Required columns present
- Invalid status values blocked
- Date format check
- Empty `law_key`/`state_code` blocked
- Duplicate `state_code + law_key` rows warning

## 9) Downloadable Template

Admin portal should provide a downloadable empty template with header only:

```csv
state_code,law_key,title,summary,details,penalty,status,effective_from,effective_to,category_tags,is_active
```

Reference samples in repository:
- Valid sample: `docs/samples/laws-template.csv`
- Invalid QA sample: `docs/samples/laws-template-invalid.csv`

## 10) Notes for Future Versions

- Add multilingual columns (`title_es`, `summary_es`, `details_es`)
- Add severity level (`low`, `medium`, `high`)
- Add legal references (`statute_url`, `statute_code`)
- Add applicability scope (age/vehicle/commercial/license class)
