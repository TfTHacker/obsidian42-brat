# Beta Reviewers Auto-update Tester
**Beta Reviewers Auto-update Tester** or **BRAT** for short is a plugin that makes it easier for you to assist other developers with reviewing and testing their plugins. 

Simply add the GitHub repository path for the beta Obsidian plugin to the list for testing and now you can just check for updates. Updates are downloaded and the plugin is reloaded. No more having to create folders, download files, copy them to right place and so on. This plugin takes care of all that for you.

# Quick Use Guide 
## Adding a beta plugin
1. Install BRAT from the Community Plugins in Obsidian 
2. Get the link to the GitHub repository you want to test. The plugin developer can provide you with this link. 
  - It will look something like: GitMurf/my-plugin or https://github.com/GitMurf/my-plugin
3. Open the command palette and run the command **BRAT: Add a beta plugin for testing**
4. Using the link from step 2, copy that into the modal that opens up
5. Click on **Add Plugin** -- wait a few seconds and BRAT will tell you what is going on
6. After BRAT confirms the installation, in Settings go to the **Community plugins ** tab.
7. Refresh the list of plugins
8. Find the beta plugin you just installed and Enable it.

## Updating beta plugins
- Plugins can be updated using the command palette by running the command **BRAT: Check for updates to all beta plugins and UPDATE**
- Optionally, beta plugins can be configured to auto-update when starting Obsidian. This feature can be enabled in the **Obsidian42- BRAT" tab in settings.

# Little more explanation for those who like to read
The first thing you need is the GitHub Repository path for the beta plugin. This sounds way more complicated than it is. Plugins are developed using GitHub.  Each developer has their own account on GitHub and creates a unique repository for their plugin. Likely the developer will give you this information, but you can ascertain it for yourself using your own powerful ability to think, reason and understand.

This is the info you need: The GitHub user name for the developer followed by the repository name. So for example, for this plugin, the repository is located at: `https://github.com/TfTHacker/obsidian42-brat`. From this, you can ignore "https://github.com". But the next block of text is the user name, then a forward slash / then the repository name. So the GitHub repository path in this case is:

`TfTHacker/obsidian42-brat`

That is all you need. Once you have the repository path, open the command palette and find the "Add a beta plugin for testing" command and then you will be prompted for the repository path. Once you add it, this will install the beta plugin into your vault.

## Updating beta plugins
From the command palette, use the "Check for updates to beta plugins and UPDATE" to check if there are updates. Updates will be downloaded, installed and the plugin will reload so that you can continue testing.

Also, in the settings tab for BRAT, you can configure that at startup of Obsidian that all beta plugins are checked for updates.

Please note, it might take 5 to 15 minutes for an updated beta plugin to update. This has to do with how GitHub caches information. So, if the developer tells you an update is available, you might need to wait a brief period of time before check updates works.

## See if there are upates, but don't update them
The command palette command "Only check for updates to beta plugins, but don't Update" will look for updates to beta plugins, but will not do any updates.

## Manually update one plugin
To update just a specific plugin, use the "Choose a single plugin to update" command in the command palette.

## Restart a plugin
You may not need this often, but this is a useful feature for developers. Using the Restart a plugin command from command palette, you can force a plugin to be reloaded.

I use this for mobile development. Obsidian Sync synchronizes my code changes to my iPad, and then on the iPad I use the restart command to reload the plugin without having to restart Obsidian.

Most of you won't need this, but its useful to developers. I bet you wish I told you this before you read this section.

## Open a GitHub repository (This is way more cool than it sounds)
The command palette contains a command **BRAT: Open the GitHub repository for a plugin**. This gives you a list of all beta plugins registered with BRAT, but also all plugins from the community plugin list. By selecting a plugin from the list, the GitHub repository will be opened in your browser

---

# Special notes for Developers
## How Obsidian loads plugins
The following is a brief explanation of how the plugin works.

Obsidian looks at a plugin repository for a manifest.json file in the root folder of the repository. The manifest.json file contains a version number for the plugin. Obsidian uses that version number to look for a "release" in that GitHub repository with the same version number. Once a matching release is found based on that version number, the main.js, manifest.json and styles.css are downloaded by Obsidian and installed into your vault. BRAT doesn't replace this process, rather it uses the same process. 

BRAT emulates the Obsidian install/update process. 

## manifest-beta.json
BRAT adds one addditional feature. You can also define in the root of your plugin repository another file called manifest-beta.json which is used by BRAT to override the version number in manifest.json. This gives two advantages: (1) your plugin once released continues to use the required manifest.json file, however (2) you can continue to do beta testing on your plugin with the manifest-beta.json file. So your testers in this case would not install your plugin via the commmunity plugins tab in Settings, rather they would use BRAT to install your plugin which will use manifest-beta.json. In effect you then have a "live" channel for your plugin and a "beta" channel for your plugin.

## How BRAT works
With all that was just said in mind, BRAT examines your repository looking FIRST for a manifest-beta.json. If it finds this file, it will use that file for information about which GitHub release to use from your repository for beta testing. If a manifest-beta.json file doesn't exists, BRAT will then use the default manifest.json file in the root directory of the repository for testing your plugin.

This allows you to control what release version beta testers are using, while leaving the "published" version available to the general community plugins list.

If you choose to use manifest-beta.json, it needs to be formatted with the same structure of a manifest.json file. Again, manifest-beta.json file is completly optional. 

Pseudo code for how the manifest files are processed:
```
if repositoryRoot/manifest-beta.json exists
    use repositoryRoot/manifest-beta.json for release information, ignore repositoryRoot/manifest.json
    copy repositoryRoot/manifest-beta.json to plugin folder, renaming it to manifest.json
else
    use repositoryRoot/manifest.json for release information
    copy Release/manifest.json to the plugin folder if it exists. If it doesn't exist, use the repositoryRoot/manifest.json

main.js and styles.css copied from the correspondencing release version depending upon the above logic
````


Few additional notes:
* manifest-beta.json does not need to be in the GitHub release, it just needs to be on the root of the repository itself.
* manifest-beta.json should have the exact same details as your manifest.json file, except the version number in this file should point to the release you want tested.
* For additional instructions on plugin requirements, see the plugins documentation provided by obsidian: [Obsidian Sample Plugin](https://github.com/obsidianmd/obsidian-sample-plugin)
* BRAT is a little forgiving in what it allows to be installed as a plugin, since many plugins are still under development. Therefore, before releasing your plugin to the public, you need to verify that everything is configured for production use. (Example: do you have a valid manifest.json in the root of your repository? Is there a release with the correct tag as indicated in your manifest.json? Does your release contain main.js and manifest.json)