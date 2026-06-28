# Developer notes: build and release

## Current release flow (what is live today)

Releases are automated with `semantic-release` in `.github/workflows/semantic-release.yml`.

`semantic-release` is intentionally opinionated: release versions and release notes come from conventional commits on the release branches, not from manual version bumps or hand-made tags.

- Push to `main` => stable release
- Push to `beta` => prerelease channel (`beta`)
- The workflow builds with `npm run build:main` or `npm run build:beta`, publishes the GitHub release, and (on `main`) syncs `manifest.json`
- `build:beta` keeps an inline source map to make debugging easier during beta testing

In short: we do not manually bump versions or create tags for normal releases anymore. Commit messages drive the versioning.

## How version bumps are decided

`semantic-release` reads commit messages on the release branch and applies conventional-commit rules:

- `fix:` => patch release
- `feat:` => minor release
- `!` in the type/scope or a `BREAKING CHANGE:` footer => major release

Examples:

- `fix: :bug: handle empty plugin list in settings tab` -> `1.4.2` to `1.4.3`
- `feat: :sparkles: add frozen-version install picker` -> `1.4.2` to `1.5.0`
- `feat!: :boom: drop support for legacy manifest-beta.json` -> `1.4.2` to `2.0.0`
- `refactor: :recycle: simplify settings rendering` -> no release by itself unless paired with a release-triggering commit

On `beta`, the same rules apply, but releases are published as prereleases. In practice, you get beta tags like `1.5.0-beta.1`, `1.5.0-beta.2`, and so on, until the changes land on `main` as a stable release.

## Major releases in practice

A major release means we made a breaking change for plugin users or plugin developers. That includes things like removing behavior people rely on, changing configuration format in a non-backward-compatible way, or dropping support for an older Obsidian baseline.

Versioning follows semver:

- `MAJOR.MINOR.PATCH` (`2.0.0`)
- bump `MAJOR` when behavior is intentionally breaking
- reset `MINOR` and `PATCH` to `0` on a major bump

When you introduce a breaking change, make it explicit in the commit message (`feat!:` or `BREAKING CHANGE:`) and call it out clearly in PR text and release notes.

## Local commands that still matter

- `npm run dev`: watch build into `build/main.js`
- `npm run build:main`: production build for stable
- `npm run build:beta`: production build for beta/prerelease behavior
- `npm run lint`: run Biome + ESLint

## Removed legacy release paths

We removed the `release-it` fallback and old manual tagging flow. The project now uses semantic-release as the single release path.

## Branching for larger features

For larger features, do the work in a dedicated feature branch first. When the feature is stable enough for wider testing, merge it into `beta` so testers get prerelease builds with sourcemaps. After validation on `beta`, promote the tested changes to `main`.
