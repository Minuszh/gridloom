# Testing and development

[中文](testing.md) · [Installation](installing.en.md) · [README](../README.en.md)

Use Node.js 22+. No dependency installation is required.

```sh
npm test
npm run check
npm run build
npm run test:ui
npm run preview
```

UI tests require Chrome; set `CHROME_BIN` to override its location. Preview runs at `http://127.0.0.1:4173`; use `?lang=zh` or `?lang=en`. Browser preview uses a sample artboard and does not edit Adobe documents.

## Coverage

On 2026-11-12, 89 automated tests, resource checks, build and Chrome regression passed. Coverage includes center guides, mirrored inner/outer margins, older presets, serialized preview updates, session restoration and layouts at 260 / 320 / 400 px. Tab changes retain panel height and slider buttons remain inside their fields.

Native InDesign tests on temporary documents cover guide creation/replacement, preserving manual guides, margins/columns, selected-object page detection, repeated live updates, commit, cancellation restoration and stale-page rejection. Scripts: `scripts/smoke-indesign.jsx` and `scripts/smoke-illustrator.jsx`.

Full save/quit/reopen restoration still needs native acceptance testing. The earlier Illustrator crash investigation is recorded in [Chinese](crash-investigation.md). Windows has not been tested natively.

## Manual checks

1. On a 420 × 594 mm artboard, use 24 mm margins, 12 columns, 6 mm gutters and 0 rows. Column width should be 25.5 mm; top/bottom margin guides remain.
2. Change selection and active artboard/page. Scope changes; input values remain.
3. Apply twice. Replace scope-owned guides and preserve manual guides.
4. Enable each center guide and both together. Check midpoint coordinates and deduplication.
5. Test both book orientations with 20 mm inner and 12 mm outer margins. Binding margins mirror between pages.
6. Preview slider edits, apply, then preview another edit and turn preview off to restore. Locking ends preview.
7. Switch all tabs. Book controls and the footer remain visible; height does not shrink. Check narrow widths.
8. Apply, save, quit and reopen the host; check first-scope parameter restoration.
9. InDesign: check native margin/column prefill and both page presets. Guides span the page.

## Source layout

`src/`: shared UI and geometry. `host/`: Adobe adapters. `CSXS/`: manifest. `assets/`: icons. `scripts/`: build and checks. `test/`: automated tests. Generated `dist/` and `release/` are ignored by Git.
