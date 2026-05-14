# Audit Note — AIMartialArtDojoManager

Source audit: `_AUDIT/reports/batch_05.md` § 17

## Original audit recommendations

### Missing AI endpoints
- `/student-performance-analytics`
- `/class-optimization`
- `/equipment-demand-forecast`
- `/instructor-workload-balancer`

### Missing non-AI features
- Parent portal
- Mobile app
- Video submission system
- Instructor notes / feedback tracking
- Payment systems integration
- Social media integration

### Custom feature suggestions
- Agentic belt progression advisor
- Vision-based technique evaluation
- Autonomous tournament organizer
- Streaming student engagement agent
- Instructor productivity optimization
- Competitive athlete pipeline

## Implemented in this pass
1. **POST `/api/ai/student-performance-analytics`** — analyzes attendance + testing + belt-progression for a student; returns score, strengths, struggling areas, retention risk.
2. **POST `/api/ai/class-optimization`** — suggests schedule changes (add / reschedule / merge / split / cancel) using classes + attendance + demographics.

Both reuse the existing `callAI`, `parseAIJson`, and `persistAIAnalysis` helpers; rate limiting is inherited from `router.use(aiRateLimiter)`. Syntax checked.

## Backlog (priority order)

### Mechanical
- `/equipment-demand-forecast` (uses equipment + student level data)
- `/instructor-workload-balancer` (uses instructor + class data)

### Needs creds / external SDK
- Payment integration (recurring billing)
- SMS / parent notifications
- Social media auto-posting

### Needs product decision
- Parent portal (auth role + child link schema)
- Mobile app (frontend scope)
- Video submission (storage + moderation policy)
- Instructor feedback tracking (private notes schema, retention rules)

## Apply pass 3 (frontend)

Frontend already calls every backend AI endpoint, including the apply-pass-2
additions `student-performance-analytics` and `class-optimization`:

- `frontend/src/components/AIFeaturePage.js` defines route configs for both
  endpoints (lines ~128-148) including form inputs and JSON parsing.
- `frontend/src/components/Dashboard.js` lists tiles for both features so they
  are reachable from the dashboard.
- All AI fetches use `Authorization: Bearer ${localStorage.getItem('dojo_token')}`
  via `getHeaders()`.
- 503-no-key responses come back as `data.error`, which the page surfaces in the
  red error banner.

No frontend changes required. Action: **LEFT-AS-IS**.

## Apply pass 4 (mechanical backlog)

Drained both remaining mechanical backlog items. Reuse `callAI`,
`parseAIJson`, `persistAIAnalysis`, and the router-level `aiRateLimiter`:

1. `POST /api/ai/equipment-demand-forecast` — forecasts equipment needs
   from inventory + student level data (with `horizon_days`).
2. `POST /api/ai/instructor-workload-balancer` — recommends reassignments
   from instructor + class + per-class attendance volume.

Frontend:
- Added two route configs (with form inputs) to
  `frontend/src/components/AIFeaturePage.js` so the existing AI feature
  page can render the forms and post via the existing JWT-bearer fetch
  helper.
- Added two tile entries to `frontend/src/components/Dashboard.js`'s
  `aiFeatures` list so they show up alongside the other AI features.
- 503-no-key path: `data.error` continues to surface in the existing red
  banner (no FE plumbing change needed).

Verification:
- `node --check backend/routes/ai.js` → OK.
- `@babel/parser` (jsx) on `AIFeaturePage.js` and `Dashboard.js` → OK.

No new dependencies, no `npm install`.

### Remaining backlog
- All items now non-mechanical: NEEDS-CREDS (payments, SMS, social) or
  NEEDS-PRODUCT-DECISION (parent portal, mobile app, video submission,
  instructor feedback retention). Unchanged.
