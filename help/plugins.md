## Updating beta plugins
From the command palette, use the "Check for updates to beta plugins and UPDATE" to check if there are updates. Updates will be downloaded, installed and the plugin will reload so that you can continue testing.

Also, in the settings tab for BRAT, you can configure that at startup of Obsidian that all beta plugins are checked for updates.

Please note, it might take 5 to 15 minutes for an updated beta plugin to update. This has to do with how GitHub caches information. So, if the developer tells you an update is available, you might need to wait a brief period of time before check updates works.

## Frozen version based on a release tag
BRAT will monitor and update plugins as they are updated in their GitHub repositories. However, if you want to freeze the version of a plugin, you can do so by using the command "BRAT: Add a beta plugin with frozen version based on a release tag". This will install the plugin with the version you specify, but not update it when other plugins are updated.

## See if there are upates, but don't update them
The command palette command "Only check for updates to beta plugins, but don't Update" will look for updates to beta plugins, but will not do any updates.

## Manually update one plugin
To update just a specific plugin, use the "Choose a single plugin to update" command in the command palette.

## Restart a plugin
You may not need this often, but this is a useful feature for developers. Using the Restart a plugin command from command palette, you can force a plugin to be reloaded.

I use this for mobile development. Obsidian Sync synchronizes my code changes to my iPad, and then on the iPad I use the restart command to reload the plugin without having to restart Obsidian.

Most of you won't need this, but its useful to developers. I bet you wish I told you this before you read this section.

## Enable/Disable a plugin
You can enable a plugin that is currently disabled or disable a plugin that is currently enabled. This saves you from having to into the Settings to toggle these plugins off and on.

# Little more explanation for those who like to read
The first thing you need is the GitHub Repository path for the beta plugin. This sounds way more complicated than it is. Plugins are developed using GitHub.  Each developer has their own account on GitHub and creates a unique repository for their plugin. Likely the developer will give you this information, but you can ascertain it for yourself using your own powerful ability to think, reason and understand.

This is the info you need: The GitHub user name for the developer followed by the repository name. So for example, for this plugin, the repository is located at: `https://github.com/TfTHacker/obsidian42-brat`. From this, you can ignore "https://github.com". But the next block of text is the user name, then a forward slash / then the repository name. So the GitHub repository path in this case is:

`TfTHacker/obsidian42-brat`

That is all you need. Once you have the repository path, open the command palette and find the "Add a beta plugin for testing" (or "Add a beta plugin with frozen version for testing") command and then you will be prompted for the repository path. Once you add it, this will install the beta plugin into your vault.

