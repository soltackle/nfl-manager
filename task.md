# Coach Selection & Match Engine Balancing Tasks

- [x] Create Database Migration
  - [x] Create `coaches` table (id, name, coach_type, prediction_rating, traits).
  - [x] Add `defensive_coach_id` to `franchises` table (Added as relationship via franchise_id in coaches table instead).
- [x] Develop Coach Selection UI
  - [x] Create `/coach-selection` route and page.
  - [x] Implement random coach generation logic on the frontend (or via a new edge function/RPC).
  - [x] Update `useDraft.ts` / `DraftPage.tsx` to redirect to Coach Selection after draft completion.
- [x] Update Match Engine (`admin-simulate-match`)
  - [x] Fetch franchise coach information.
  - [x] Implement play calling/prediction clash logic.
  - [x] Implement coach prediction success/failure math to prevent blowout matches.
- [x] Testing & Verification
  - [x] Run a simulation locally.
  - [x] Deploy Edge Functions.
