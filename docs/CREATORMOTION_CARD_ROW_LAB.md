# CreatorMotion Card Row — Prototype Test

**Status:** visual prototype added; not yet rendered as a video.

## Why this exists
This is a native NahaLabs preview of the presenter-foreground-card-row concept. It avoids making the product dependent on Skillry's paid skill package while we validate whether the motion treatment adds value.

## Open the lab
Run the NahaLabs Video Engine locally, then visit `/labs/creatormotion-card-row`. On a deployed preview, use the same route on that preview host.

## Test steps
1. Open the lab route.
2. Select a short presenter clip from the local machine. The preview creates a browser-local object URL; the file is not uploaded by this page.
3. Replace the three sample labels with concise, truthful points from a real NahaLabs business story.
4. Compare White & Yellow, Charcoal & Lime, Paper & Orange, and Black & White.
5. Replay and inspect the first card entrance, full settled row, face clearance, text size and spacing.
6. Record pass/fail before moving the effect into the production render pipeline.

## Acceptance criteria
- Presenter face and key gestures remain unobstructed.
- Three cards read clearly at mobile viewing size in the 16:9 preview.
- Staggered entrances feel intentional rather than bouncy or distracting.
- Copy is concise and evidence-backed.
- Reduced-motion preference disables entrance animation.
- Local footage is not transmitted by the preview page.
- A real MP4 render is not considered complete until it has been generated and inspected separately.

## Known limitations
- This is a browser visual QA prototype, not a HyperFrames/Remotion render integration.
- The demo is authored for 16:9, matching the referenced CreatorMotion skill. Do not assume 9:16 support.
- It uses sample presenter geometry until a real clip is selected.
- Skillry's complete CreatorMotion library is marked Pro on the public page; use this native prototype for evaluation before considering any paid access.

## Source
https://skillry.dev/skills/bs-creatormotion-cards-foreground-row
https://skillry.dev/skills/bs-creatormotion
