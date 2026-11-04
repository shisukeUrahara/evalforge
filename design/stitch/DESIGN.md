# Design System: EvalForge

## 1. Visual Theme & Atmosphere
A release-control instrument for LLM changes. Calm night canvas, one restrained violet accent, and verdicts that read like a pre-flight checklist. Same family as Atlas "Evidence" and PromptFlight "Afterglow": the faint afterglow lives only in the page background, never on buttons or text.
- Density 7 (data-dense checklist and side-by-side answers, airy around the verdict)
- Variance 6 (asymmetric splits; nothing centered for the sake of it)
- Motion 4 (fluid CSS; verdict and claim highlights fade in, no theatrics)
The signature idea: **every verdict is one click from the exact case and the exact claim**. The verdict banner, tiered checklist rows and highlighted claims are the hero visuals.

## 2. Color Palette & Roles
Dark
- **Night Canvas** (#0b0c12) with a soft violet haze top-left at 12% and a blue haze bottom-right at 8%
- **Panel** (rgba(255,255,255,0.035)) with **Hairline** (rgba(255,255,255,0.08))
- **Inset** (rgba(255,255,255,0.025)) — answer text blocks, source passages
- **Paper Ink** (#ecedf3) primary text · **Steel Ink** (#9ba1b4) metadata
- **Afterglow Violet** (#9b8cf2) — the only accent: active tab, focus ring, selected row, slice-id chips
Light
- **Mist Canvas** (#f6f6fa), **Paper** (#ffffff), **Hairline** (#e4e4ee), **Inset** (#f3f3f8)
- **Ink** (#14151d), **Steel Ink** (#5a5f72), **Violet ink** (#5b45d1) on **Violet wash** (#efecff)
Verdict and status (ink tones on 14% tints, never solid fills)
- **Ship / supported / pass** teal (#2dd4bf dark / #0f766e on #e6f7f4 light)
- **Pending confirm / uncertain / warn** amber (#f2b84b dark / #8a5300 on #fdf3dc light)
- **Block / unsupported / fail** coral (#f87171 dark / #b4232a on #fde8e8 light)
- **Waived** steel ink with a dashed outline (a waived check never looks like a pass)
- Arms: **A** steel, **B** violet, **M** sky (#38bdf8 / #0369a1), **C** coral — small dot + mono letter

## 3. Typography Rules
- **Display:** Geist 300–500, tracking -0.02em, tabular numerals for counts.
- **Body:** Geist 15px, line-height 1.6, max 68 characters per line.
- **Mono:** Geist Mono for case ids (`c014`), slice ids (`stripe:/paths/~1v1~1refunds/post`, `ns:NS-R3`), shas, run ids, reason codes (`critical_unsupported_claim`).
- **Micro labels:** 11px uppercase, letter-spacing 0.08em, Steel Ink.
- Banned: Inter, serif, gradient text, all-caps headlines.

## 4. Component Stylings
- **Verdict banner:** wide card; left: big word SHIP / BLOCK / PENDING CONFIRM in the status ink; right: candidate name, what changed (prompt or model spec), counts "N checks · M failed", run id in mono.
- **Checklist row:** tier pill (CRITICAL / PRIORITY / WARN) · reason code in mono · status pill · failing case ids as mono chips · "label source: human / judge" micro label · chevron to the case.
- **Answer block:** inset block, body text. Claims are underlined by verdict colour (teal / amber / coral), with a tiny verdict tag after each claim. No code-block styling.
- **Source passage:** inset block with title, slice id chip, license pill, sha pill.
- **Buttons:** flat. Primary = violet fill, dark ink text, 10px radius. Secondary = hairline outline. Destructive-ish actions (waive) = outline + confirm dialog. No glows.
- **Cards:** 20px radius, hairline border, no shadow in dark, whisper shadow in light. Long lists use hairline dividers, not cards.
- **Pills:** fully rounded, 11px mono, 14% tint + matching ink.
- **Loading:** skeletons shaped like the content. **Empty:** one sentence + the exact next command (for example `pnpm ef run --candidate prompt:B`).

## 5. Layout Principles
- Max width 1400px, 12-column grid, 24px gutters.
- Top bar: wordmark "EvalForge" left; pill tabs (Release gate, Comparison, Judge audit); right: user chip ("lee · release manager" or "maya · viewer"), sun/moon toggle.
- Version strip under the top bar on every page: dataset sha · prompt versions · model specs · judge version · run id (mono, steel ink, wraps on phone).
- No centered hero. No row of three equal cards. Use 8/4 or 7/5 splits.
- Below 768px: single column, tabs become a bottom tab bar with 3 icons, drawers become bottom sheets, touch targets 44px, wide tables scroll inside their card.

## 6. Motion & Interaction
- 150ms fades for pills and highlights; panels use ease-out springs.
- Selecting a checklist row opens the case in Comparison with the failing claim pre-selected.
- Animate only transform and opacity. Respect reduced motion.

## 7. Anti-Patterns (Banned)
- No invented metrics, confidence scores or latencies; every number in a mock is labeled "sample".
- No avatars, photos, emojis, stock illustrations.
- No neon, outer glows, gradient text, purple button glow, pure black.
- No three equal feature cards, no centered hero.
- No marketing copy ("seamless", "elevate", "unleash", "next-gen", "AI-powered").
- No overlapping panels that hide text.
