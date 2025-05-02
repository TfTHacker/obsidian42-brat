# BRAT Guide for Plugin Developers

This guide explains how to set up your Obsidian plugin for beta testing with BRAT.

>[!WARNING]
>Please note: these notes only apply to plugins. Themes follow a different process.

## How Obsidian loads plugins

The following is a brief explanation of how the plugin works.

Obsidian looks at a plugin repository for a `manifest.json` file in the repository's root folder. The `manifest.json` file contains a version number for the plugin. Obsidian uses that version number to look for a "release" in that GitHub repository with the same version number. Once a matching release is found based on that version number, the `main.js`, `manifest.json`, and `styles.css` are downloaded by Obsidian and installed into your vault.

BRAT uses a slightly different approach for "Beta" versions of your plugin, but uses the same process to *install* your plugin.  

## How to prepare your plugin for BRAT

If you want to test pre-release versions of your plugin:

1. Create a GitHub release with a [semantic version number](https://semver.org/#semantic-versioning-specification-semver)

2. Optionally mark it as a pre-release

3. Include the `manifest.json`, `main.js`, and, if needed, `styles.css`, in the release assets

This gives you effectively the same "live" and "beta" channels, but managed entirely through GitHub's release system.

>[!IMPORTANT]
> Don't commit `manifest.json` to your default branch yet. Obsidian will pick up an update once the `manifest.json` in the default branch of your repository itself changes.
>
>If you publish a version for beta tests, you should not commit the change of the version number in `manifest.json` to your default branch yet.

## GitHub Releases and manifest.json

Since v1.1.0, BRAT primarily works with GitHub releases. When installing or updating a plugin, BRAT will:

1. For a specific version (frozen): Download that exact release version, regardless of whether it's marked as a pre-release

2. For latest version: Download the latest available release or pre-release, prioritizing by semantic version number of the release

The `manifest.json` is fetched directly from the release assets, making BRAT independent of the version numbering in the repository root.

## Release Tag and Name, and Manifest Version Handling

When BRAT installs or updates a plugin, it validates both the release tag version and the version in the `manifest.json` asset.

If there is a mismatch between the release tag version and name (e.g., `1.0.1-beta.0`) and the version in the released `manifest.json` asset (e.g. `1.0.0`), BRAT will:
   - Use the release tag version as the source of truth
   - Override the version in the `manifest.json` to match the release tag
   - Display a notification about the mismatch

>[!IMPORTANT]
>Obsidian itself requires that release tag, release name, and the version stored in the released `manifest.json` [are the same](https://docs.obsidian.md/Plugins/Releasing/Release+your+plugin+with+GitHub+Actions). This applies to beta plugins tested with BRAT too. It is best you always ensure the version in your released `manifest.json` file matches your release tag version and release name. For example:
>- Release tag: `1.0.1-beta.0`
>- Release name: `1.0.1-beta.0`
>- Version in released `manifest.json`: `1.0.1-beta.0`


>[!INFO]
>BRAT is a bit opinionated with respect to semantic versions but will attempt to normalize non-standard version strings using the [`semver`](https://github.com/npm/node-semver?tab=readme-ov-file#coercion) library for comparison operations. 

## Legacy: older BRAT installs and manifest-beta.json

Before v1.1.0, BRAT used an additional `manifest-beta.json` file in the repository root to override the version number in `manifest.json`. From version v1.1.0 on, BRAT will simply ignore a `manifest-beta.json` in your repository root.

As a developer, you might want to keep this file some time for backwards compatibility for users which still have older versions of BRAT installed. Alternatively, you might want to indicate to your users that your plugin  must be used with BRAT >= v1.1.0.

BRAT itself is backwards compatible with older Obsidian versions back to Obsidian v1.7.2.

## How BRAT works

BRAT examines your repository's GitHub releases. For installation and updates, it will:

1. Fetch the list of available releases

2. Select the appropriate release (specific version for frozen installs, latest by semver otherwise) based on the release tag

3. Download the `manifest.json`, `main.js`, and `styles.css` directly from the release assets

This approach makes BRAT more robust as it uses GitHub releases as the source of truth.

>[!IMPORTANT]
>Obsidian does not support the full `semver` spec. If you use `-preview` and other branches to build beta versions of your plugin, Obsidian will not pick up the final release automatically, unless the version number is bumped at least a minor release number higher than the beta version. In these cases, it is best to use BRAT to upgrade from to the latest release.
>
>If your users have installed a pre-release like `1.0.1-preview.1`, Obsidian will not pick up `1.0.1` once it's released, and they would have to update manually via BRAT.
>
>However, once `1.0.2` or higher is released, Obsidian's update mechanism will kick-in again, offering to upgrade the respective (pre-)release.
>
>The following table illustrates the results of a Semver compliant comparison from lowest to highest version and indicates which versions will and will not be picked up by Obsidian's update mechanism.
>
>| Semantic Versions | | |
>|---------|---|----------|
>| `1.0.0` | 1 | |
>| `1.0.1-alpha.25` | 2 | |
>| `1.0.1-beta.5`| 3 | |
>| *`1.0.1-preview.1`* | 4  | *Installed by user with BRAT* |
>| `1.0.1` | 5 | Not picked up by Obsidian's update mechanism |
>| **`1.0.2`** | 6 | **Picked up by Obsidian's update mechanism** |

## GitHub API Rate Limits

If you are a plugin developer yourself and/or do a lot of installing and reinstalling of plugins via BRAT, you might hit [GitHub API rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-unauthenticated-users) (60 request per hour for anonymous requests). You avoid this by adding a personal access token (PAT) to BRAT which increases the limit to 5000 requests per hour. You will need a read only [PAT](https://github.com/settings/personal-access-tokens/) with "Repository access" set to "All repositories", granting "Read-only access" for the "Contents" repository permissions:

![image](https://github.com/user-attachments/assets/816b4d02-fae0-41e0-973f-672a5937d65a)

![image](https://github.com/user-attachments/assets/d2898fd5-17d8-49a9-be46-710382319d89)

Once created, add this PAT on BRAT's main settings page.

## Private Repository PAT

If you want to provide read-only access to a private repository (e.g. for private beta tests) you should create a dedicated PAT for that repository only, selecting the repository in question under "Only selected repositories" for "Repository access".

![image](https://github.com/user-attachments/assets/da16fb77-623e-4ee2-abf3-0b63ea216e89)

The permissions required remain the same.
