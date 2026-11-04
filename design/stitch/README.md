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

## Approved screens (4 Nov 2026, dark)
The owner approved these before any UI code. PNGs in `screens/`, shrunk to 1280 px wide.

| Page | Screen id | PNG |
|---|---|---|
| Release gate | `0b3d4c96a1424661b87bddfe0655a8a9` | `screens/gate-dark.png` |
| Comparison | `3b03629accbc490a91de5c9e1301a292` | `screens/compare-dark.png` |
| Judge audit | `eb02f5b15b714a1bbaddad435ae1e0f0` | `screens/judge-dark.png` |

Invented by Stitch, not used in the build: the hub icon next to the wordmark, slice ids like `slice-returns` (real ids look like `ns:NS-R3`), case ids above `c080`, and every number (real values come from run folders). Comparison clips the "refused: no" label; the build fixes that.

## Light and phone screens (4 Nov 2026)
Made after the dark screens were approved, in the same layout. Light design system: `assets/f6792dce2692429899de1d709132bc79`.

| Page | Variant | Screen id | PNG |
|---|---|---|---|
| Release gate | light | `2ae920c5eebf41cf9a6f22f8fda9fe67` | `screens/gate-light.png` |
| Comparison | light | `8b04f4673f664b57a4e9316de74426e5` | `screens/compare-light.png` |
| Judge audit | light | `40e0a2932f6c47d496b3ef097eaec9d1` | `screens/judge-light.png` |
| Release gate | phone, dark | `ad9b8b81337544a6a8bee46685a89c29` | `screens/gate-phone-dark.png` |
| Comparison | phone, dark | `82c54e7061e14dedb6d01f1748ac3358` | `screens/compare-phone-dark.png` |
| Judge audit | phone, dark | `2bb05ff8d3e84ce48f310bc5e6a832d9` | `screens/judge-phone-dark.png` |

The dark desktop screens stay the reference. What the build ignores here:
- gate-light: solid coral FAIL pills (spec: tint only), extra check icon on the selected candidate.
- compare-light: words broken mid-word, changed answer text for A, extra warning icon. Use the dark screen's text and normal wrapping.
- judge-light: moon icon where the sun belongs, person icon in the user chip.
- gate-phone-dark: missing "Noise floor" title; the C candidate is off screen (the build uses a scrollable segmented control).
- compare-phone-dark: the "3 sources" count in the bottom sheet (there is one source).
- judge-phone-dark: the confusion table is clipped; the build scrolls it inside its card. "trusted" should be a pill.
