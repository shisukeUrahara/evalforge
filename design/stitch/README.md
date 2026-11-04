# Stitch designs

All EvalForge screens are designed in Google Stitch before any UI code is written. The owner approves them first.

The look follows [DESIGN.md](DESIGN.md): the same family as Atlas "Evidence" and PromptFlight "Afterglow".

Model: `GEMINI_3_5_FLASH_LITE` (the default model timed out on earlier projects).

## Pages
| Page | What it shows |
|---|---|
| Release gate (home) | Candidate switcher: B (prompt change), M (model swap), C (injected, labeled). Verdict banner: SHIP / BLOCK / PENDING CONFIRM. Tiered checklist (critical, priority, warn) with reason codes, failing case ids and label source. Side panel: noise floor (A vs A flips), judge trust bar (κ, recall, canaries) with N, waivers and confirms with who and when. Button: download `gate.json`. |
| Comparison | Left: case list with category and pass/fail per arm, "regressions only" filter. Main: two synced columns, A and candidate, each answer with claims underlined by verdict. Drawer: the source slices (text, slice id, license), run manifest (dataset sha, prompt versions, model specs, judge version), prompt diff. |
| Judge audit | Trust bar status. Confusion matrix (judge vs human) with counts. Canary results (caught / missed) and control false alarms. Disagreement list: claim, human label, judge label. Judge v1 → v2 changelog. Every rate shows N and a Wilson range. |

## States every page needs
Empty (no runs yet + the command to make one), loading (skeleton), stale (run older than the dataset), invalid run (`context_mismatch`), pending confirm, denied (maya tries to waive), error.

## 90-second storyboard
| Time | Screen | Viewer learns |
|---|---|---|
| 0:00–0:12 | Release gate + version strip | the problem + data source |
| 0:12–0:30 | gate → blocked check → case | real end-to-end app |
| 0:30–0:48 | Comparison drawer: slice text, manifest, prompt diff, model spec | internals + reproducibility |
| 0:48–1:05 | C: cites a real Stripe slice, claim unsupported · M: one config line → ship/block | failures tested; swaps gated |
| 1:05–1:20 | Judge audit: κ, canaries, N, CIs, noise floor | honest numbers |
| 1:20–1:30 | README, ADR, `pnpm ef reproduce` | can hand off |

## Copy rule
Every Stitch prompt carries exact text. Numbers in the designs are **sample data** and are labeled "sample". The built pages read only real run folders. No avatars, no invented customer claims, no "live" tags.

## Project
- Stitch project: `projects/2497184839464694802` ("EvalForge", private to the owner)
- Design system made by Stitch from the first prompt: `assets/2132799dc50047c2bae19a7f9cf28581` ("EvalForge Release Gate", dark)
