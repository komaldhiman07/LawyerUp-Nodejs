# Law Storage Schema (Implemented Models)

This document describes the normalized law-storage models added under `database/models`.

## Models Added

- `LawMaster` -> collection: `laws_master`
- `StateLaw` -> collection: `state_laws`
- `LawIngestionJob` -> collection: `law_ingestion_jobs`
- `LawIngestionError` -> collection: `law_ingestion_errors`
- `LawAuditLog` -> collection: `law_audit_logs`

## 1) `laws_master`

Purpose: canonical law identity independent of state text.

Key columns:
- `law_key` (unique, lowercase)
- `title`, `short_title`, `description_global`
- `domain`, `sub_domain`, `tags[]`
- `severity`, `risk_score`
- `source_type`
- `is_active`, `is_deleted`
- `created_by`, `updated_by`
- timestamps

Important indexes:
- unique(`law_key`)
- (`domain`, `sub_domain`, `is_active`)
- (`tags`)

## 2) `state_laws`

Purpose: state/jurisdiction-specific law content and versioning.

Key columns:
- `state_code`, `country_code`
- `law_key`
- `jurisdiction_type`, `jurisdiction_code`, `city`, `county`
- `title`, `summary`, `details`, `penalty_text`
- `status` (`draft|active|repealed`)
- `effective_from`, `effective_to`
- `version`
- `content_hash`
- `change_source`, `admin_note`, `published_at`
- `is_active`, `is_deleted`
- `created_by`, `updated_by`
- timestamps

Validation:
- `effective_to >= effective_from` when both are present

Important indexes:
- unique(`state_code`, `law_key`, `version`)
- (`state_code`, `law_key`, `is_active`, `is_deleted`)
- (`state_code`, `status`, `jurisdiction_type`)
- (`country_code`, `jurisdiction_type`, `city`, `county`)

## 3) `law_ingestion_jobs`

Purpose: track CSV import lifecycle.

Key columns:
- `job_id` (unique)
- `file_name`, `uploaded_by`, `upload_source`, `template_version`
- `status` (`queued|processing|completed|partial|failed|cancelled`)
- `total_rows`, `success_rows`, `error_rows`, `skipped_rows`
- `started_at`, `finished_at`, `error_report_url`
- `dedupe_key`, `metadata`
- timestamps

Important indexes:
- unique(`job_id`)
- (`uploaded_by`, `createdAt`)

## 4) `law_ingestion_errors`

Purpose: row-level CSV errors/warnings.

Key columns:
- `job_id`, `row_number`, `column_name`
- `error_code`, `error_message`, `severity`
- `raw_row`, `normalized_row`
- `is_resolved`
- timestamps

Important indexes:
- (`job_id`, `row_number`)
- (`job_id`, `error_code`)

## 5) `law_audit_logs`

Purpose: immutable audit trail for legal/content changes.

Key columns:
- `entity_type` (`laws_master|state_laws`)
- `entity_id`
- `action` (`create|update|delete|publish|repeal|import`)
- `changed_fields[]`
- `before_data`, `after_data`
- `changed_by`, `source`, `note`
- timestamps

Important indexes:
- (`entity_type`, `entity_id`, `createdAt`)
- (`changed_by`, `createdAt`)

## Notes

- Existing legacy `laws` model remains untouched for backward compatibility.
- New models are intended for admin portal and future law lifecycle workflows.
