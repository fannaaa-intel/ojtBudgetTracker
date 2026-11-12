---
description: The owner's GO signal — continue to the next pending step of the phase workflow
---

The owner said **GO**. This is their approval to do the next pending step. Extra instructions from the owner (may be empty): $ARGUMENTS

1. Read, in full: `CLAUDE.md`, `plan.md`, and `docs/HANDOFF.md` (especially §1 "How the owner works" and §4 "What GO means").
2. Work out where we are:
   - Look at the conversation so far. If a **STEP 1 report** was the last thing you gave and the owner hasn't asked for changes → this GO means **STEP 2: build that phase** (items in order; after each item run `npm run typecheck` and `npm test`, plus the Android bundle check from HANDOFF §5; fix errors; tick the item in plan.md), then give the **STEP 3 phase report** and STOP.
   - If there is no STEP 1 report in this conversation yet (new session) → this GO means: write the **STEP 1 report for the next phase** named in HANDOFF §3 (list items, how, files, packages, schema/migrations, tests, risks, questions). **No code.** STOP and wait for the next GO.
   - If the owner's extra instructions above say something specific (e.g. "commit and push", "fix X first"), do that first.
3. Follow every rule in CLAUDE.md and HANDOFF §1/§5. Owner is on Windows PowerShell. Never `npm audit fix --force`. Ask before changing a decision in plan.md. Commit/push only when asked.
4. At the end, update `docs/HANDOFF.md` §2–§4 so the next session knows the new state.
