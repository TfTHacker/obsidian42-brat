# 1.0.4

### New
- The internal command names have been renamed. Any plugins using these internal command names will need to be updated.

### Updates
- Transition to Biome from EsLint and Prettier.
- Updating plugint to newest Obsidian recommendations https://docs.obsidian.md/oo24/plugin
- The output log file format for when debugging is enabled in BRAT has changed. It now appends to the log file, not prepends.

# 1.0.3

### fix

- modified main.ts to better conform to obdisidan.dt.ts
- chore: update all dependencies.

# 1.0.2

### Fix

- Improved the update logic to better handle when a personal access token has failed.
- chore: update all dependencies.

# 1.0.1

### New

- Private repositories are now accessible by BRAT. This will allow for private testing of plugins. You will need to setup a GitHub token in the settings to access private repositories. Check out https://tfthacker.com/brat-private-repo for more info.
- BRAT is no longer in beta, though it will always be in beta since we add new features. So I am bumping this up to 1.0.0.
- Moved the build process to use GitHub Actions. This will allow for more automation in the future.

# 0.8.3

### Fix

- New auto-enable for new plugin installs not persisting the enabled state. (Issue: https://github.com/TfTHacker/obsidian42-brat/issues/74)
- chore: update all dependencies.

# 0.8.2

### New

- A new setting controls if a beta plugin is auto-enabled after installation. This means after it is installed, it will be enabled in settings. This reduces the additional step of manually enabling a plugin after installation. This setting is now enabled by default.
- chore: update all dependencies.

# 0.8.1

### New

- Obsidian Protocol handler for making installing plugins and themes easier by using Obsidian's protocol feature. See https://tfthacker.com/brat-protocol for more information.
  This new feature contributed by [RyotaUshio](https://github.com/RyotaUshio) (Thank you!).
- chore: updated all dependencies.

### Fix

- Bug introduced with 8.02 when manifest-beta.json is used that a plugin will not installed. (https://github.com/TfTHacker/obsidian42-brat/issues/71) Thank you for reporting this [mProjectsCode](https://github.com/mProjectsCode).

# 0.8.0

### New

- To better conform with Obsidian's naming policies for the settings screen, Obsidian42-BRAT is now just known as BRAT in the Settings Tab.
- In settings, when a plugin or theme is listed, they are now linked to their GitHub repositories. It's a small addition, but it's very nice to quickly jump to a repo for plugins or themes being tested. Addresses FR #[67](https://github.com/TfTHacker/obsidian42-brat/issues/67)
- Removed the Ribbon icon toggle from settings, as this is now controlled natively by Obsidian since v1.1.0
- **Major** code refactoring - the goal was to make this strongly typed according to Typescript rules and additionally applied a new protocol to the formatting of the code. The result is extensive changes in all files. While this won't mean a lot to users, it will make the code easier to maintain and understand for others.
- chore: update all dependencies.

# 0.7.1

### New

- Can now force a reinstall of a beta plugin. This might be useful when a local file gets corrupted, and you want to replace it with the current file in the release. (Addresses FR https://github.com/TfTHacker/obsidian42-brat/issues/62)

#### Fixes

- If the URL ends with .git, the Add New Plugin form will strip the .git extension. This makes it easier to use the GitHub copy code button URL with BRAT (fix for https://github.com/TfTHacker/obsidian42-brat/issues/55)

#### Updates

- updated to the newest esbuild and also all project dependencies

# 0.7.0

## Major updates to **THEMES** support

#### New

- BRAT now supports the Obsidian 1.0+ changes to the way Themes are handled (no longer using obsidian.css, rather using theme.css & manifest.json)
- if a repository has a **theme-beta.css** file, this will be downloaded instead of the theme.css in the repository. This allows a theme developer to have a theme file for beta testing, while still having a theme.css live for public users not testing a theme. [See themes documentation](help/themes.md)

#### Update

- When deleting a theme from within BRAT's settings, the theme is removed from BRAT monitoring, but the theme is not physically deleted from the vault. The user can delete in Settings > Appearance

#### Removed

- The ability to "switch themes" is removed as this feature was sherlocked and natively added to Obsidian in the command palette with the "Change Theme" command
- BRAT had the ability to install any community theme from the official community theme list. However, since Obsidian improved the themes UI, this feature became redundant and so was removed.

---

# 0.6.37

- Bug fixes
- Updating core libraries
- Added promotional links for help with supporing the development of this plugin
