# Beta Reviewers Auto-update Tester
**Beta Reviewers Auto-update Tester** or **BRAT** for short is a plugin that makes it easier for you to assist other developers with reviewing and testing their plugins and themes. 

Simply add the GitHub repository path for the beta Obsidian plugin to the list for testing and now you can just check for updates. Updates are downloaded and the plugin is reloaded. No more having to create folders, download files, copy them to right place and so on. This plugin takes care of all that for you.

# Help Contents
- [Quick  Guide for using BRAT](#Quick-Guide-for-using-BRAT)
  - Plugins
    - Adding a beta plugin
    - Updating beta plugins
    - Stopping beta plugin updates/deleting a beta plugin/deleting-a-beta-plugin
  - Themes
    - Grab a beta theme from a repository
    - Update a beta theme from a repository
    - Grab a community theme
- [Plugins](/help/plugins.md)
  - Updating beta plugins
  - See if there are upates, but don't update them
  - Manually update one plugin
  - Restart a plugin
  - Enable/Disable a plugin
  - Little more explanation for those who like to read
- [Themes](/help/themes.md)
  - Switch active theme
  - Settings for themes
  - Boring details about themes that are useful to know
- [Github](/help/github.md)
  - Open a GitHub plugin repository
  - Open a GitHub themes repository
- [Logging](/help/logging.md)
  - Logging Support
- [For plugin developers](/help/developers.md)
  - How Obsidian loads plugins
  - manifest-beta.json
  - How BRAT works

# Quick Guide for using BRAT  
## Plugins
### Adding a beta plugin
1. Install BRAT from the Community Plugins in Obsidian 
2. Get the link to the GitHub repository you want to test. The plugin developer can provide you with this link. 
    > It will look something like: GitMurf/my-plugin or https://github.com/GitMurf/my-plugin
3. Open the command palette and run the command **BRAT: Add a beta plugin for testing** (If you want the plugin version to be frozen, use the command **BRAT: Add a beta plugin with frozen version based on a release tag**.)
4. Using the link from step 2, copy that into the modal that opens up
5. Click on **Add Plugin** -- wait a few seconds and BRAT will tell you what is going on
6. After BRAT confirms the installation, in Settings go to the **Community plugins ** tab.
7. Refresh the list of plugins
8. Find the beta plugin you just installed and Enable it.

### Updating beta plugins
- Plugins can be updated using the command palette by running the command **Check for updates to all beta plugins and UPDATE**
- Optionally, beta plugins can be configured to auto-update when starting Obsidian. This feature can be enabled in the **Obsidian42- BRAT" tab in settings.  

### Stopping beta plugin updates/deleting a beta plugin
- Stopping updates to a beta plugin (Step 1)
  - In the BRAT tab in settings, click the button with an x next to the beta plugin you want to stop updating. In place of the x button, a button will appear for you to confirm removing the beta plugin from updating
  - When you remove the beta plugin from BRAT, the plugin in still installed in your Obsidian vault and will receive updates in the normal way through Obsidian's "check for updates" feature. If you really want to remove the plugin, make sure to do the following step.

- Deleting a beta plugin from Obsidian (Step 2: optional)
  - If you want to delete the plugin, you need to do one more step. Go to the Community Plugins tab in settings and find the beta plugin and uninstall it, just as you would uninstall any other plugin.
  - You also have to remove the reference to this beta plugin in BRAT as outined in the previous step 1. Otherwise BRAT will continue to update the plugin

## Themes
### Grab a beta theme from a repository
- BRAT helps you to test themes currently under development. To use this feature:

1. Open the command palette and select the command **Grab a beta theme for testing from a Github repository**
2. You are then prompted for the url path to the github repository where the theme is stored

- BRAT will then validate that a theme exists, download it and switch your current theme to this beta theme.

- Since this is a beta theme and does not yet have a community name,  BRAT assigns it a unique name using "BRAT-" in the beginning and adding the name of the Github user and repository.

### Update a beta theme from a repository
- Using the theme update command, Brat will check  for all beta themese and see if there  is an update.  If there is an update, it downloads the update and notifies you.

### Grab a community theme
- While BRAT is designed for testing themes, you can still install a theme already published to the community. This theme wil not be updated with the BRAT update feature.

---

# Say Thank You
If you are enjoying this plugin then feel free to [buying me a coffee](https://bit.ly/o42-kofi).

Please also help spread the word by sharing your enthusiasim for this plugin on Twitter, Reddit, or any other social media platform you regularly use. 

You can find me on Twitter [@TfTHacker](https://bit.ly/o42-twitter) and at [Medium](https://bit.ly/o42-medium). 

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://bit.ly/o42-kofi)
