# Career Studio — UI/UX Style Guide (v1.0, APPROVED)

**Prepared:** November 14, 2026 · Companion to Master Blueprint v9.1 (Sections 2J and 6 — "white/gray/navy design system" is superseded by this guide: white / light grey / bright orange accent).
**Status:** Approved by product owner on November 14, 2026 as the default style for **every module and screen** built from now on, until the owner explicitly asks for a change. Reference implementation: `sample-page/index-v2.html`. Still to be validated with first-time resume writers.

## 1. Personality
Contemporary, calm, trustworthy. The page should feel mostly empty and white. Grey gives structure. Orange is a small signal that marks where you are, what's selected and what to do next. It is never decoration.

## 2. Color tokens

| Token | Hex | Use |
|---|---|---|
| `canvas` | #FFFFFF | Page background (≈85% of any screen) |
| `grey-50` | #FAFAFA | Alternate bands, quiet cards, context bar |
| `grey-100` | #F4F4F5 | Progress tracks, subtle dividers, neutral tags |
| `grey-200` | #E7E7EA | Borders, input outlines |
| `grey-500` | #71717A | Secondary text, captions (4.8:1 on white) |
| `grey-600` | #52525B | Body-secondary text |
| `ink` | #18181B | Primary text, primary buttons |
| `orange` (Signal Orange) | #FF6B2C | Accents only: logo dot, progress fill, thin accent line |
| `orange-ink` | #C2410C | Any orange **text** or small icon (5.2:1 on white) |
| `orange-wash` | #FFF4ED | Small tag backgrounds only |

**Usage ratio:** about 85% white, 9% grey, 5% ink and 1% orange. If orange is the first thing you notice, there's too much.

### Orange rules
- **Do:** use it for the logo dot, progress bars, small labels like "Start here", and at most one thin accent line per section.
- **Don't:** use it for large fills, backgrounds, gradients or body text. Don't use Signal Orange as text on white, because it fails contrast. Don't use it for errors or warnings; those use separate red/amber colors. Don't put more than one or two orange elements on one screen.
- **Primary buttons are ink, not orange.** This keeps orange rare and contrast strong.
- **Selections and focus are black/grey, never orange.** A selected option gets a 1.5px ink outline, a grey-50 fill and an ink check. A focused input gets a 1.5px ink border and a 4px grey-100 halo. (Decided November 14, 2026; bright red was trialled as the accent and rejected in favour of orange.)

## 3. Typography
- Headings: **Inter Tight** 600, letter-spacing between −0.015em and −0.035em.
- Body/UI: **Inter** 400/500.
- Scale: Display 56–60 · Heading 36 · Title 20–22 · Body 16 (lead 18) · Caption 13.
- Line-height: 1.05 for display text, 1.5–1.6 for body text.

## 4. Shape, space, depth
- Corner radii: buttons and inputs 10–12px; cards 14–18px; large panels 24px; pills fully rounded.
- Spacing: 8px base; sections use 80–88px vertical padding; content max width is 1200px with 24px side gutters.
- Borders over shadows: 1px `grey-200` or #EDEDF0. Only the main focus card may use a soft, diffuse shadow.
- Icons: thin outline (1.5–2px stroke), ink or `orange-ink`. No emoji.

## 4a. Signature brand mark — the progress line
The brand mark is a segmented line: **one Signal Orange segment followed by two grey segments** (#D4D4D8, #E4E4E7), with 2–4px gaps and rounded ends. It stands for "one question at a time."
- **Logo:** mark (16 / 8 / 8 px wide, 5px tall) + "Career Studio" in Inter Tight 600.
- **Section eyebrows:** small mark (14 / 7 / 7 px, 4px tall) + uppercase label in grey-600.
- **Progress:** multi-step flows use segmented bars (one segment per step, 4px tall, grey-100 track). Only the current step's fill is orange.
- **Stage indicators:** six-segment 3px line on stage cards. The current/recommended stage is orange; other stages show their position in grey-400 (#A1A1AA).
- **Closing call-to-action and footer:** the mark replaces decorative lines.
- This is the **main place orange appears**. Don't invent other orange decoration.

## 4b. Signature layout patterns
- **Show the result next to the input.** Any guided flow (resume building, tailoring, interview prep) pairs the question/form with a live preview of the output inside a grey-50 framed panel (28px radius).
- **Live preview conventions:** newly added content gets a grey-100 highlight and a small "Just added" label in orange-ink. Upcoming sections use a dashed grey-200 box with "Coming up next…". Unfilled areas are faint grey-100 placeholder bars. Status line: green dot "Live preview" and "Saved just now".
- **Featured vs regular cards:** the recommended item gets a 1.5px ink border and a "Start here" tag. Other cards use a 1px #EDEDF0 border. Grids use `repeat(auto-fit, minmax(300px, 1fr))`, never cramped columns.
- **Example data** is always labelled "example" and never presented as a real customer.

## 4c. Voice and microcopy
- Warm, plain and reassuring, written for first-time and anxious job seekers. Normalise not knowing ("'I'm not sure yet' is a perfectly good answer").
- After a key answer, add a one-line grey note that explains what happens next (an info icon, never orange).
- Never invent stats, testimonials or outcomes. Leave a space for real pilot evidence.

## 5. Components (initial set)
Primary/secondary/quiet buttons (44px minimum height, 52px for hero buttons) · pill tags (orange-wash or grey-100) · input with ink focus border and 4px grey-100 halo · 4px progress bar · single-question card with radio options · Copilot context bar (`Target · Resume version · Saved · Privacy`) · stage cards numbered 01–06.

## 6. Accessibility (required)
- Text contrast ≥ 4.5:1. Orange text always uses `orange-ink`.
- Visible focus ring: 2px ink (#18181B), 2px offset.
- Touch targets ≥ 44px. Use real buttons, links and labels. Layouts must work at phone width with no horizontal scroll.
- A selected state must never rely on color alone: add a check icon or a heavier weight.

## 7. Reference
- Approved reference page: `docs/sample-page/index-v2.html` (screenshots `desktop-v2.png`, `mobile-v2.png`).
- Visual-language board and both page versions: Career Studio — Look & Feel canvas (claude.ai artifact, private to owner).

## 8. Change control
This guide stays in force for all modules (Resume Studio, Fit to JD, Auto Apply, Interview Prep, Peer Review Marketplace, Referrals, Profile Alignment, Verified Skills, Employer Connect, account and settings screens) until the product owner explicitly requests a change. Any change becomes a new version of this file.
