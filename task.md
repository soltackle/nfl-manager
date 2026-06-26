# Situational Playbook (Play Call Sheet) Tasks

- [ ] Frontend Updates (`TacticsPage.tsx`)
  - [ ] Add `playbook` object to local state with default offense and defense choices for the 8 situations.
  - [ ] Remove old "Hücum Odağı / Savunma Odağı" sections.
  - [ ] Create the new Situational Matrix UI (Grid/Table).
  - [ ] Save the combined state (`slider_ayarlari` and `playbook`) to the database.

- [ ] Backend Updates (`admin-simulate-match/index.ts`)
  - [ ] Implement the Situation Analyzer (determine distance class, yard line zone).
  - [ ] Fetch the specific `offFocus` and `defFocus` from the playbook instead of a static value.
  - [ ] Keep the previously written Coach Prediction & Mismatch engine, ensure it reads the dynamic playbook values.

- [ ] Verification
  - [ ] Deploy Edge Function.
  - [ ] Update Walkthrough.
