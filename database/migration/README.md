# Legacy tutor migration (`tutors.json` → GHT v3)

Converts the 1,498-record legacy form export into the v3 relational schema.

## Setting up a fresh database

On a brand-new host (Aiven, or anywhere else), run these in order first:

```bash
node database/migration/check-connection.js     # verify credentials + TLS

mysql < database/ght-v3-schema.sql              # 9 tutor/reference tables
mysql < database/migration/002_operational_tables.sql   # admin_users, demo_requests, …
mysql < database/migration/001_add_own_vehicle.sql
mysql < database/seed_reference_data_v3.sql
mysql < database/seed_education_reference_v3.sql
```

`002_operational_tables.sql` is not optional: `ght-v3-schema.sql` contains only
the tutor tables, and without `admin_users` the login route throws and the panel
shows a generic "Server error".

Connecting to Aiven needs its CA certificate — download `ca.pem` from the service
overview page and point `DB_SSL_CA_PATH` at it. See `.env.local.example`.

## Run order

```bash
# 1. Build the canonical vocabulary from the seed files
node database/migration/extract-reference.js

# 2. See how the data lands before writing anything
node database/migration/analyse.js

# 3. Propose the localities/subjects the legacy data needs but the seeds lack
node database/migration/propose-reference-additions.js
#    -> REVIEW proposed-reference-additions.sql BY HAND, then run it on the DB

# 4. Re-extract so the parsers can use the newly seeded rows
node database/migration/extract-reference.js

# 5. Add the column the v3 schema dropped
#    mysql < database/migration/001_add_own_vehicle.sql

# 6. Generate the import, then check it
node database/migration/import-tutors.js
node database/migration/validate-sql.js

# 7. Apply — either pipe import-tutors.sql to your client, or:
node database/migration/import-tutors.js --execute
```

Steps 1–4 and 6 are read-only and safe to repeat. The whole import runs inside a
single transaction, so a failure rolls back cleanly.

## Files

| File | Purpose |
|---|---|
| `check-connection.js` | Probes DNS → TCP → MySQL handshake → auth → schema |
| `001_add_own_vehicle.sql` | Restores the `own_vehicle` column |
| `002_operational_tables.sql` | `admin_users`, `demo_requests`, `class_assignments`, `telegram_broadcasts`, `page_views` |
| `extract-reference.js` | Reads the seed SQL into `reference.json` (the vocabulary) |
| `normalize.js` | All parsers. Pure functions, no side effects |
| `analyse.js` | Dry-run coverage report → `analysis-report.txt`, `review-unmatched.json` |
| `propose-reference-additions.js` | Vocabulary gaps → `proposed-reference-additions.sql` |
| `import-tutors.js` | Generates (and optionally runs) `import-tutors.sql` |
| `validate-sql.js` | Static checks on the generated SQL, no DB needed |

## Decisions baked into the import

- **Duplicates** — one tutor per WhatsApp number (then email, then row). The
  newest submission wins for scalar fields; classes, subjects and areas are
  unioned across the group so nothing is lost. `created_at` is the *earliest*
  submission, `updated_at` the latest. 1,498 records → 1,364 tutors.
- **"All subjects"** — expanded to a core set based on the classes taught:
  English/Hindi/Maths/EVS for classes 1–5, plus Science and Social Science above
  that. Only applied when the tutor named no specific subject.
- **Experience → start year** — `teaching_start_year = submission year − years`.
  "Fresher"/"No" counts as 0.
- **Status** — `active` only when the tutor has a usable phone *and* at least one
  class, subject and area; otherwise `inactive`. `verified` is always 0.
- **Qualification** — the original text always goes to `tutors.qualification`.
  `highest_qualification_id` is set only when a specific degree was named, so the
  ~370 generic answers ("Graduation", "Post graduate") lose nothing.
- **Dropped** — dates of birth implying an age outside 16–80 (62 rows where the
  tutor typed the form-fill date), and `+91`-only phone placeholders.

## Reference rows are addressed by slug

Every `INSERT` resolves foreign keys with `SELECT id FROM … WHERE slug = …`, so
the SQL stays valid regardless of auto-increment values and can be re-run against
a rebuilt reference set.

## Known limits

- Sector-level areas ("Rohini Sector 20, 21") collapse to the parent locality;
  the reference table has no sector granularity.
- ~40 records name no parseable class and ~160 no parseable area. They import as
  `inactive` with their other fields intact, for an admin to complete.
- `tutor_custom_subjects` rows are attached to the tutor's lowest class, because
  the legacy form never linked a subject to a specific class.

## Tutor panel (added 2026-09-05)

`003_tutor_accounts.sql` adds four tables:

| Table | Holds |
|---|---|
| `tutor_accounts` | one login per tutor: password hash, status, lockout counters |
| `tutor_auth_tokens` | SHA-256 of emailed verify/reset links — never the raw token |
| `tutor_profile_changes` | one row per submission a tutor makes |
| `tutor_profile_change_fields` | one row per changed field, so an admin can approve some and reject others |

`004_tutor_email_unique.sql` adds the `UNIQUE` index on `tutors.email`. It is
**blocked** until every shared address is resolved — see the file header. Until
then the application enforces the same rule: signup refuses any address matching
more than one tutor.

Run `node scripts/merge-duplicate-emails.js` to see what is still shared.

### Verifying it

```bash
npx next dev -p 3000                          # in one terminal
node scripts/smoke-tutor-panel.js --port 3000 # in another
```

Creates a disposable tutor, walks signup → verify → login → read → submit →
admin review → confirm applied, then deletes everything it made. Safe against
the live database; it only touches the row it created.
