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

1. Create a GitHub release

2. Optionally mark it as a pre-release

3. Include the `manifest.json`, `main.js`, and `styles.css` (if needed) in the release assets

This gives you effectively the same "live" and "beta" channels, but managed entirely through GitHub's release system.

>[!IMPORTANT]
> Don't commit `manifest.json` to your default branch yet. Obsidian will pick up an update once the `manifest.json` in the default branch of your repository itself changes.
>
>If you publish a version for beta tests, you should not commit the change of the version number in `manifest.json` to your default branch yet.  

## GitHub Releases and manifest.json

Since v1.1.0, BRAT primarily works with GitHub releases. When installing or updating a plugin, BRAT will:

1. For a specific version (frozen): Download that exact release version, regardless of whether it's marked as a pre-release

2. For latest version: Download the latest available release or pre-release, prioritizing by semantic version number

The `manifest.json` is fetched directly from the release package, making BRAT independent of the version numbering in the repository root.

## Legacy: manifest-beta.json

Before v1.1.0, BRAT used an additional `manifest-beta.json` file in the repository root to override the version number in `manifest.json`. While this file is still supported for backwards compatibility, it is no longer necessary with the new release-based approach.

## How BRAT works

BRAT examines your repository's GitHub releases. For installation and updates, it will:

1. Fetch the list of available releases

2. Select the appropriate release (specific version for frozen installs, latest by semver otherwise)

3. Download the `manifest.json`, `main.js`, and `styles.css` directly from the release assets

This approach makes BRAT more robust as it uses GitHub releases as the source of truth.

>[!IMPORTANT]
>Obsidian does not support the full `semver` spec. If you use `-preview` and other branches to build beta versions of your plugin, Obsidian will not pick up the final release automatically, unless the version number is bumped at least a minor release number higher than the beta version. In these cases, it is best to use BRAT to upgrade from to the latest release.
>
>If your users have installed a pre-release like `1.0.1-preview.1`, Obsidian will not pick up `1.0.1` once its release, and they would have to update manually via BRAT.
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

## Sample Plugin Repository

For an example of how to setup your repository for use with BRAT see: <https://github.com/TfTHacker/obsidian-brat-example-plugin>
