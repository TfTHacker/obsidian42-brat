
# Special notes for Developers
Please note: these notes only apply to plugins. Themes do not follow the same logic as plugins nor is manifest-beta.json used for themes.

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

