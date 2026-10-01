# NoteSage product completion

## Product intent
Complete the existing private, offline, chat-style notebook. A person can open the app, create notes, record and edit thoughts, tag/search them, and return after a reload without losing work. Workspace JSON is a portable backup, not an automatic cloud sync. The existing assistant becomes a truthful local helper for counts, recent notes, overviews, and literal search. No account, paid model, or backend is required.

## Design
Keep React/Vite and the existing note/message/date JSON structure. Hydrate once before any write. Save mutations synchronously through one workspace store; expose storage errors instead of silently claiming success. Retain old workspace and legacy notes compatibility. Validate a whole import before replacing anything. Require confirmation when starting or importing a replacement workspace. Export through a feature-detected save picker or ordinary download; cancel has no side effects. Corrupt saved data must remain available for recovery until the user explicitly replaces it.

Use a calm sage/cream two-pane notebook with a clear workspace toolbar, searchable keyboard-accessible note list, editable message cards, draft-preserving composer, tags, useful empty states, theme toggle, and responsive mobile drawers. Keep Hebrew/Arabic text direction on content and inputs. The helper clearly states that it runs locally and uses only stored note text. Its history belongs to the workspace.

## Implementation and verification
1. Add failing workspace, local-helper, and user-flow regression tests
2. Fix the workspace parser, synchronous persistence, migration/recovery, and browser file export
3. Complete existing note/editor/sidebar/helper/workspace controls with immediate edits, retained drafts, safe replacement dialogs, and responsive styling
4. Use one generated service worker, precache production assets, and remove external fonts/unsupported AI promises
5. Run unit tests, TypeScript, lint, build, and production browser QA, including rapid navigation, repeated/cancelled operations, corrupted files, reload/offline, keyboard, mobile, themes, and Hebrew
6. Produce a local reviewable branch, patch, screenshots, and an inspectable preview. No merge or production deployment

## Completion bar
Every user-visible primary action works. Actual persisted data, including dates/tags/history/drafts, survives reload and JSON roundtrips. Invalid files and cancelled replacement operations preserve work. Offline production reload works after first online visit. No fabricated AI claims. Final checks and screenshots must be from the final code.
