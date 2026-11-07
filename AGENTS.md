# gridloom development

- Product display name is always lowercase `gridloom`. Keep existing extension IDs and preset storage keys stable.

- Keep the extension lean: no third-party runtime dependency without a concrete need.
- UI uses Illustrator host font, size and background from appSkinInfo; every control inherits the common rules in src/panel.css. Grayscale only, including focus and selection. No hover tooltips or title attributes; keep accessible labels. Use the centralized minimal icons for compact actions. No in-panel visual preview or unit picker; accept explicit unit suffixes and use document ruler units for bare values. Auto-match host UI locale with Chinese/English resources in src/i18n.js. Generate custom notation using English keywords regardless of UI locale. Do not introduce an icon library or copy private Illustrator assets.
- assets/icon.svg is the user's latest approved geometry. Do not redesign or tighten its gaps. The build generates theme-compatible PNGs.
- Core geometry and notation must remain independent of CEP and Illustrator. Host scripts are ES3, not modern JavaScript.
- Never evaluate imported notation as code. Bound recursive expansion and guide counts.
- Distinguish preview from actual document writes. Re-read context before writing; reject stale document/selection. Never clear user guides unless the explicit all-guides action is selected.
- Do not declare cross-version or native undo support without actual host testing. Track incomplete v3 items honestly.
- Run npm test, npm run check and npm run build before handoff.
- Design principles: let work objects lead, group controls by task, show feedback at the relevant action, and avoid redundant explanatory copy.

- Measure the active tab and resize to its content, as requested by the user. Coalesce sizing to one animation frame, cap to the available screen, and scroll internally when the host refuses resizing. Do not reserve hidden-tab or routine-status space.

- Lock and visibility buttons control the gridloom layer, not global guide menu commands. Read actual layer state; never infer global guide state from these properties.

- Do not push to GitHub, create releases, or upload updated packages unless the user explicitly requests publication. Local implementation, tests and installation remain separate.
