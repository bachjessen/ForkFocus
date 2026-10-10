# ForkFocus Agent Guide

## Purpose

Use this file as the repository-level checklist for maintaining ForkFocus. Preserve the existing architecture and avoid unrelated changes.

## Adding or changing an option

1. Edit `shared/options/options.json`.
2. Keep the option ID unique and place the option in the correct category and desktop/mobile group.
3. Add localized names where available, with at least an English fallback.
4. Define the complete selector list in `styles` and set an explicit `defaultValue`.
5. Increment `currentVersion` for every catalog change. A changed catalog with an unchanged version can appear in the popup while the persisted catalog and runtime CSS remain stale.
6. Run `npm test` and `npm run lint`.
7. Reload ForkFocus in `about:debugging`, then reload affected site tabs.

## Runtime data flow

The expected path is:

`shared/options/options.json` -> bundled catalog -> `socialFocus_remote_options_data` -> runtime snapshot -> injected site stylesheet

The relevant storage keys use lowercase names:

- `socialFocus_options_state`
- `socialFocus_remote_options_data`
- `socialFocus_runtime_snapshot`
- `socialFocus_lifecycle_meta`

When an option is enabled but has no effect, verify each stage in that order instead of inspecting raw SQLite files first.

## Preferred runtime inspection

Open the extension page directly when the `about:debugging` Inspect button is unreliable:

`moz-extension://<runtime-uuid>/popup.html`

Open DevTools on that page and run:

```js
const all = await browser.storage.local.get();

({
  lifecycle: all.socialFocus_lifecycle_meta,
  optionState: all.socialFocus_options_state,
  catalog: all.socialFocus_remote_options_data,
  snapshot: all.socialFocus_runtime_snapshot,
});
```

Check all four conditions:

1. `lifecycle.optionsVersion` equals `currentVersion` in `shared/options/options.json`.
2. The option value is correct in `optionState`.
3. The option definition and selector exist in `catalog`.
4. The selector exists in `snapshot.css.<site>`.

On the affected website, open page DevTools and inspect the injected stylesheet:

```js
const style = document.querySelector(
  "style[social-youtube-data-runtime-styles]",
);

({
  styleExists: Boolean(style),
  css: style?.textContent,
});
```

Use `document.querySelector(<selector>)` and `getComputedStyle(element)` to distinguish selector matching from CSS injection failures.

## Verified YouTube Most Relevant implementation

Option ID:

`socialFocus_youtube_hide_subscriptions_most_relevant`

Working selector:

```css
ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[has-expansion-button][show-bottom-divider] ytd-rich-item-renderer[is-shelf-item])
```

The selector targets the complete `ytd-rich-section-renderer` containing the expandable subscription shelf. The implementation became active only after the catalog version advanced beyond the already persisted version.

## Diagnostic cautions

- Do not search Firefox IndexedDB SQLite or WAL files for plain selector text as the primary verification method. Structured values may not appear as raw UTF-8 or UTF-16 text.
- The extension page DevTools result is authoritative for `browser.storage.local`.
- The affected tab's DevTools result is authoritative for injected styles and selector matching.
- Do not conclude that a visible popup option is present in the persisted runtime catalog.
- Do not add another version bump until the current bundled and persisted versions have been compared.

## Completion criteria

A catalog option change is complete only when:

1. Tests and lint pass.
2. The persisted lifecycle version matches the bundled catalog version.
3. The option exists in persisted state and catalog.
4. The runtime snapshot contains the expected selector when enabled.
5. The affected page contains the injected selector and the intended element is hidden.
