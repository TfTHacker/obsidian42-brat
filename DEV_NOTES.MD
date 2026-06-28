# Developer notes: build and release

## Current release flow (what is live today)

Releases are automated with `semantic-release` in `.github/workflows/semantic-release.yml`.

`semantic-release` is intentionally opinionated: release versions and release notes come from conventional commits on the release branches, not from manual version bumps or hand-made tags.

- Push to `main` => stable release
- Push to `beta` => prerelease channel (`beta`)
- The workflow builds with `npm run build:main` or `npm run build:beta`, publishes the GitHub release, and (on `main`) syncs `manifest.json`
- `build:beta` keeps an inline source map to make debugging easier during beta testing

In short: we do not manually bump versions or create tags for normal releases anymore. Commit messages drive the versioning.

## Local commands that still matter

- `npm run dev`: watch build into `build/main.js`
- `npm run build:main`: production build for stable
- `npm run build:beta`: production build for beta/prerelease behavior
- `npm run lint`: run Biome + ESLint

## Removed legacy release paths

We removed the `release-it` fallback and old manual tagging flow. The project now uses semantic-release as the single release path.

## Branching for larger features

For larger features, do the work in a dedicated feature branch first. When the feature is stable enough for wider testing, merge it into `beta` so testers get prerelease builds with sourcemaps. After validation on `beta`, promote the tested changes to `main`.
