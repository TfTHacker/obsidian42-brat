# 0.7.0 (PENDING)

## Major updates to **THEMES** support
#### New
- BRAT now supports the Obsidian 1.0 themes architecture change (no longer using obsidian.css, rather using theme.css & manifest.json)
- if a repository has a **theme-beta.css** file, this will be downloaded instead of the theme.css in the repository. This allows a theme developer to have a version for beta testing, while still having a theme.css live for public users not testing a theme. [See themes documentation](help/themes.md)

#### Update 
- When deleting a theme from within BRAT's settings, the theme is removed from BRAT monitoring, but the theme is not physically deleted from the vault. 

#### Removed
- The ability to "switch themes" is removed as this feature was sherlocked and natively added to Obsidian in the command palette with the "Change Theme" command
- BRAT had the ability to list all community themes from the official community theme list. However, since Obsidian improved the themes UI, this feature became redudant and so was removed.



---

# 0.6.37

- Bug fixes 
- Updating core libraries
- Added promotional links for help with supporing the development of this plugin