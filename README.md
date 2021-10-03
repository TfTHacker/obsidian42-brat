# Beta Reviewers Autou-pdate Tester
Beta Reviewers Auto-update Tester or BRAT for short is a plugin that makes it easier for you to assist other developers with reviewing and testing their plugins. 

Simply add the GitHub repository path for the beta Obsidian plugin to the list for testing and now you can just check for updates. Updates are downloaded and the plugin is reloaded. No more having to create folders, download files, copy them to right place and so on. This plugin takes care of all that for you.

# How to use the plugin
The first thing you need is the GitHub Repository path for the beta plugin. This sounds way more complicated than it is. Plugins are developed using GitHub.  Each developer has their own account on GitHub and create a unique repository for their plugin. Likely the developer will give you this information, but you can ascertain it for yourself using your own powerful brain.

This is the info you need: The GitHub user name for the developer followed by the repository name. So for example, for this plugin, the repository is located at: https://github.com/**TfTHacker/obsidian42-brat**. From this, you can ignore "https://github.com". But the next block of text is the user name, then a forward slash / then the repository name. So the GitHub repository path in this case is:

`TfTHacker/obsidian42-brat`

That is all you need. Once you have the repository path, open the command palette and find the "Add a beta plugin for testing" command and then you will be prompted for the repository path. Once you add it, this will install the beta plugin into your vault.

## Check for Updates
From the command palette, use the "Check for updates to beta plugins" to check if there are updates. Updates will be downloaded, installed and the plugin will reload so that you can continue testing.

Also, in the settings tab for BRAT, you can configure that at startup of Obsidian that all beta plugins are checked for updates.

Please note, it might 5 to 15 minutes for an updated beta plugin to update. This has to do with how GitHub caches information. So, if the developer tells you an update is available, you might need to wait a brief period of time before check updates works.

## Restart a plugin
You may not need this often, but this is a useful feature for developers. Using the Restart a plugin command from command palette, you can force a plugin to be reloaded.

I use this for mobile development. Obsidian Sync synchronizes my code changes to my iPad, and then on the iPad I use the restart command to reload the plugin without having to restart Obsidian.

Most of you won't need this, but its useful to developers. I bet you wish I told you this before you read this section.

# Special notes for Developers
The following is a brief explanation of how the plugin works.

BRAT examines your repository looking first for a manifest-beta.json. If it finds this file, it will use that file for information about which GitHub release to use from your repository. If that file doesn't exists, it uses the default manifest.json file for your plugin.

This allows you to control what release version beta testers are using, while leaving the "published" version available to the general community plugins list.

If you choose to use manifest-beta.json, it needs to be formatted with the same structure of a manifest.json file.

Again, manifest-beta.json file is completly optional. However there needs to be at least one of these files.