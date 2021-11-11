# Switch active theme
Switch quickly between any installed theme, whether it is a beta theme you installed from a repository or a theme from the community list.

# Settings for themes
In settings for BRAT, you can delete any registered beta themes.


# Boring details about themes that are useful to know
## No theme versioning -- sad
One goal of BRAT is to make installing and updating themes that you want to test very easy to do.  While installing is easy, updating is not easy. Why?

Themes are not versioned, while plugins are. This means that a plugin developer intentionally updates the version number of there plugin and it makes it easy to detect when there is a change to a plugin and BRAT should udpate the plugin. However themes do not have version numbers and so there is no official way to know if a theme was updated. This explains  why you have to force an update from Obsidian for themes, because Obsidian can't really determine if there is an update, so it just re-downloads the theme when you click update.

BRAT goes a step further, it looks at the commit date on the obsidian.css file in the Github repository. If the commit date is greater than the date of the locally installed file it will download the updated and replace the local copy. While this works well, its not guaranted to work. Hopefully in the future Obsidian will add the concept of a theme version number system.

## How BRAT saves theme files to the vault
BRAT downloads the obsidian.css file from the Github repository and saves it to your themes folder in the vault. However, a plugin on a repository does not yet have a theme name. The theme name is given when published to the community theme list. This means BRAT has no way of determining the name of the theme. So BRAT derives a name that is used to save the theme to the vault and to assure othere themes are not over-written.

BRAT downloads obsidian.css from the repository and renames it. The name starts with "BRAT-", followed by the Github user name, 4 dashes  `----` then followed by the repository name. So the theme from the https://github.com/ezs/obsidian-comfort-color-dark will be saved as: `BRAT-obsidian-ezs----obsidian-comfort-color-dark.css` to your themese folder.

## Deleting of "BRAT-" beta themes
When a theme is deleted from the list of beta themese in the Settings form, the css file is  also deleted from the themes folder in your vault.

If you made it this far, I should probaby buy you a coffee.