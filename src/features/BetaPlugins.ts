import ThePlugin from "../main";
import AddNewPluginModal from "../ui/AddNewPluginModal";
import { grabManifestJsonFromRepository, grabReleaseFileFromRepository } from "./githubUtils";
import { normalizePath, PluginManifest, Notice, requireApiVersion, apiVersion } from "obsidian";
import { addBetaPluginToList } from "../ui/settings";
import { ToastMessage } from "../utils/notifications";
import { isConnectedToInternet } from "../utils/internetconnection";

/**
 * all the files needed for a plugin based on the release files are hre
 */
interface ReleaseFiles {
    mainJs:     string | null;
    manifest:   string | null;
    styles:     string | null;
}

/**
 * Primary handler for adding, updating, deleting beta plugins tracked by this plugin
 */
export default class BetaPlugins {
    plugin: ThePlugin;

    constructor(plugin: ThePlugin) {
        this.plugin = plugin;
    }

    /**
     * opens the AddNewPluginModal to get info for  a new beta plugin
     * @param   {boolean}   openSettingsTabAfterwards will open settings screen afterwards. Used when this command is called from settings tab
     * @param   {boolean}   useFrozenVersion          install the plugin using frozen version.
     * @return  {<Promise><void>}
     */
    async displayAddNewPluginModal(openSettingsTabAfterwards = false, useFrozenVersion = false): Promise<void> {
        const newPlugin = new AddNewPluginModal(this.plugin, this, openSettingsTabAfterwards, useFrozenVersion);
        newPlugin.open();
    }

    /**
     * Validates that a GitHub repository is plugin
     *
     * @param   {string}                     repositoryPath   GithubUser/RepositoryName (example: TfThacker/obsidian42-brat)
     * @param   {[type]}                     getBetaManifest  test the beta version of the manifest, not at the root
     * @param   {[type]}                     false            [false description]
     * @param   {[type]}                     reportIssues      will display notices as it finds issues
     *
     * @return  {Promise<PluginManifest>}                     the manifest file if found, or null if its incomplete
     */
    async validateRepository(repositoryPath: string, getBetaManifest = false, reportIssues = false): Promise<PluginManifest|null> {
        const noticeTimeout = 15;
        const manifestJson = await grabManifestJsonFromRepository(repositoryPath, !getBetaManifest, this.plugin.settings.debuggingMode);
        if (!manifestJson) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIssues) ToastMessage(this.plugin, `${repositoryPath}\nThis does not seem to be an obsidian plugin, as there is no manifest.json file.`, noticeTimeout);
            return null;
        }
        // Test that the mainfest has some key elements, like ID and version
        if (!("id" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIssues) ToastMessage(this.plugin,`${repositoryPath}\nThe plugin id attribute for the release is missing from the manifest file`, noticeTimeout);
            return null;
        }
        if (!("version" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIssues) ToastMessage(this.plugin,`${repositoryPath}\nThe version attribute for the release is missing from the manifest file`, noticeTimeout);
            return null;
        }
        return manifestJson;
    }

    /**
     * Gets all the release files based on the version number in the manifest
     *
     * @param   {string}                        repositoryPath  path to the GitHub repository
     * @param   {PluginManifest<ReleaseFiles>}  manifest        manifest file
     * @param   {boolean}                       getManifest     grab the remote manifest file
     * @param   {string}                        specifyVersion  grab the specified version if set
     *
     * @return  {Promise<ReleaseFiles>}                         all relase files as strings based on the ReleaseFiles interaface
     */
    async getAllReleaseFiles(repositoryPath: string, manifest: PluginManifest, getManifest: boolean, specifyVersion = ""): Promise<ReleaseFiles> {
        const version = specifyVersion === "" ? manifest.version : specifyVersion;

        // if we have version specified, we always want to get the remote manifest file.
        const reallyGetManifestOrNot = getManifest || (specifyVersion !== "");

        return {
            mainJs: await grabReleaseFileFromRepository(repositoryPath, version, "main.js", this.plugin.settings.debuggingMode),
            manifest: reallyGetManifestOrNot ? await grabReleaseFileFromRepository(repositoryPath, version, "manifest.json", this.plugin.settings.debuggingMode) : "",
            styles: await grabReleaseFileFromRepository(repositoryPath, version, "styles.css", this.plugin.settings.debuggingMode)
        }
    }

    /**
     * Writes the plugin release files to the local obsidian .plugins folder
     *
     * @param   {string}              betaPluginID  the id of the plugin (not the repository path)
     * @param   {ReleaseFiles<void>}  relFiles      release file as strings, based on the ReleaseFiles interface
     *
     * @return  {Promise<void>}                     
     */
    async writeReleaseFilesToPluginFolder(betaPluginID: string, relFiles: ReleaseFiles): Promise<void> {
        const pluginTargetFolderPath = normalizePath(this.plugin.app.vault.configDir + "/plugins/" + betaPluginID) + "/";
        const adapter = this.plugin.app.vault.adapter;
        if (await adapter.exists(pluginTargetFolderPath) === false ||
            !(await adapter.exists(pluginTargetFolderPath + "manifest.json"))) {
            // if plugin folder doesnt exist or manifest.json doesn't exist, create it and save the plugin files
            await adapter.mkdir(pluginTargetFolderPath);
        }
        await adapter.write(pluginTargetFolderPath + "main.js", relFiles.mainJs);
        await adapter.write(pluginTargetFolderPath + "manifest.json", relFiles.manifest);
        if (relFiles.styles) await adapter.write(pluginTargetFolderPath + "styles.css", relFiles.styles);
    }

    /**
     * Primary function for adding a new beta plugin to Obsidian. 
     * Also this function is used for updating existing plugins.
     *
     * @param   {string}              repositoryPath     path to GitHub repository formated as USERNAME/repository
     * @param   {boolean}             updatePluginFiles  true if this is just an update not an install
     * @param   {boolean}             seeIfUpdatedOnly   if true, and updatePluginFiles true, will just check for updates, but not do the update. will report to user that there is a new plugin
     * @param   {boolean}             reportIfNotUpdted  if true, report if an update has not succed
     * @param   {string}              specifyVersion     if not empty, need to install a specified version instead of the value in manifest{-beta}.json
     *
     * @return  {Promise<boolean>}                       true if succeeds
     */
    async addPlugin(repositoryPath: string, updatePluginFiles = false, seeIfUpdatedOnly = false, reportIfNotUpdted = false, specifyVersion = ""): Promise<boolean> {
        const noticeTimeout = 10;
        let primaryManifest = await this.validateRepository(repositoryPath, true, false); // attempt to get manifest-beta.json
        const usingBetaManifest: boolean = primaryManifest ? true : false;
        if (usingBetaManifest === false)
            primaryManifest = await this.validateRepository(repositoryPath, false, true); // attempt to get manifest.json

        if (primaryManifest === null) {
            const msg = `${repositoryPath}\nA manifest.json or manifest-beta.json file does not exist in the root directory of the repository. This plugin cannot be installed.`;
            this.plugin.log(msg, true);
            ToastMessage(this.plugin, `${msg}`, noticeTimeout);
            return false;
        }

        if (!primaryManifest.hasOwnProperty('version')) {
            const msg = `${repositoryPath}\nThe manifest${usingBetaManifest ? "-beta" : ""}.json file in the root directory of the repository does not have a version number in the file. This plugin cannot be installed.`;
            this.plugin.log(msg, true);
            ToastMessage(this.plugin, `${msg}`, noticeTimeout);
            return false;
        }

        // Check manifest minAppVersion and current version of Obisidan, don't load plugin if not compatible
        if(primaryManifest.hasOwnProperty('minAppVersion')) { 
            if( !requireApiVersion(primaryManifest.minAppVersion) ) {
                const msg = `Plugin: ${repositoryPath}\n\n`+
                            `The manifest${usingBetaManifest ? "-beta" : ""}.json for this plugin indicates that the Obsidian ` +
                            `version of the app needs to be ${primaryManifest.minAppVersion}, ` +
                            `but this installation of Obsidian is ${apiVersion}. \n\nYou will need to update your ` +
                            `Obsidian to use this plugin or contact the plugin developer for more information.`;
                this.plugin.log(msg, true);
                ToastMessage(this.plugin, `${msg}`, 30);
                return false;    
            }
        }

        const getRelease = async () => { 
            
            const rFiles = await this.getAllReleaseFiles(repositoryPath, primaryManifest as PluginManifest, usingBetaManifest, specifyVersion);
            if (usingBetaManifest || rFiles.manifest === "")  //if beta, use that manifest, or if there is no manifest in release, use the primaryManifest
                rFiles.manifest = JSON.stringify(primaryManifest);

            if (rFiles.mainJs === null) {
                const msg = `${repositoryPath}\nThe release is not complete and cannot be download. main.js is missing from the Release`;
                this.plugin.log(msg, true);
                ToastMessage(this.plugin, `${msg}`, noticeTimeout);
                return null;
            }
            return rFiles;
        }

        if (updatePluginFiles === false) {
            const releaseFiles = await getRelease();
            if (releaseFiles === null) return false;
            await this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
            await addBetaPluginToList(this.plugin, repositoryPath, specifyVersion);
            //@ts-ignore
            await this.plugin.app.plugins.loadManifests();
            const versionText = specifyVersion === "" ? "" : ` (version: ${specifyVersion})`;
            const msg = `${repositoryPath}${versionText}\nThe plugin has been registered with BRAT. You may still need to enable it the Community Plugin List.`;
            this.plugin.log(msg, true);
            ToastMessage(this.plugin, msg, noticeTimeout);
        } else {
            // test if the plugin needs to be updated
            // if a specified version is provided, then we shall skip the update
            const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + primaryManifest.id + "/";
            let localManifestContents = "";
            try {
                localManifestContents = await this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json")
            } catch (e) {
                if (e.errno === -4058 || e.errno === -2) { // file does not exist, try installing the plugin
                    await this.addPlugin(repositoryPath, false, usingBetaManifest, false, specifyVersion);
                    return true; // even though failed, return true since install will be attempted
                }
                else
                    console.log("BRAT - Local Manifest Load", primaryManifest.id, JSON.stringify(e, null, 2));
            }

            if (
                specifyVersion !== "" 
                || this.plugin.settings.pluginSubListFrozenVersion.map(x=>x.repo).includes(repositoryPath)
            ) {
                // skip the frozen version plugin
                ToastMessage(this.plugin, `The version of ${repositoryPath} is frozen, not updating.`, 3);
                return false;
            }

            const localManifestJSON = await JSON.parse(localManifestContents);
            if (localManifestJSON.version !== primaryManifest.version) { //manifest files are not the same, do an update
                const releaseFiles = await getRelease();
                if (releaseFiles === null) return false;

                if (seeIfUpdatedOnly) { // dont update, just report it
                    const msg = `There is an update available for ${primaryManifest.id} from version ${localManifestJSON.version} to ${primaryManifest.version}. `;
                    this.plugin.log(msg + `[Release Info](https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version})`, false);
                    ToastMessage(this.plugin, msg, 30, async () => { window.open(`https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version}`)});
                } else {
                    await this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
                    //@ts-ignore
                    await this.plugin.app.plugins.loadManifests();
                    //@ts-ignore
                    if (this.plugin.app.plugins.plugins[primaryManifest.id]?.manifest) await this.reloadPlugin(primaryManifest.id); //reload if enabled
                    const msg = `${primaryManifest.id}\nPlugin has been updated from version ${localManifestJSON.version} to ${primaryManifest.version}. `;
                    this.plugin.log(msg + `[Release Info](https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version})`, false);
                    ToastMessage(this.plugin, msg, 30, async () => { window.open(`https://github.com/${repositoryPath}/releases/tag/${primaryManifest.version}`) } );
                }
            } else
                if (reportIfNotUpdted) ToastMessage(this.plugin, `No update available for ${repositoryPath}`, 3);
        }
        return true;
    }

    /**
     * reloads a plugin (assuming it has been enabled by user)
     * pjeby, Thanks Bro https://github.com/pjeby/hot-reload/blob/master/main.js
     * 
     * @param   {string<void>}   pluginName  name of plugin
     *
     * @return  {Promise<void>}              
     */
    async reloadPlugin(pluginName: string): Promise<void> {
        // @ts-ignore
        const plugins = this.plugin.app.plugins;
        try {
            await plugins.disablePlugin(pluginName);
            await plugins.enablePlugin(pluginName);
        } catch (e) { 
            if(this.plugin.settings.debuggingMode)
                console.log("reload plugin", e) 
        }
    }

    /**
     * updates a beta plugin
     *
     * @param   {string}   repositoryPath  repository path on GitHub
     * @param   {boolean}  onlyCheckDontUpdate only looks for update
     *
     * @return  {Promise<void>}                  
     */
    async updatePlugin(repositoryPath: string, onlyCheckDontUpdate = false, reportIfNotUpdted = false): Promise<boolean> {
        const result = await this.addPlugin(repositoryPath, true, onlyCheckDontUpdate, reportIfNotUpdted);
        if (result === false && onlyCheckDontUpdate === false)
        ToastMessage(this.plugin, `${repositoryPath}\nUpdate of plugin failed.`)
        return result;
    }

    /**
     * walks through the list of plugins without frozen version and performs an update
     *
     * @param   {boolean}           showInfo  should this with a started/completed message - useful when ran from CP
     * @return  {Promise<void>}              
     */
    async checkForUpdatesAndInstallUpdates(showInfo = false, onlyCheckDontUpdate = false): Promise<void> {
        if(await isConnectedToInternet()===false) { 
            console.log("BRAT: No internet detected.") 
            return;
        }
        let newNotice: Notice;
        const msg1 = `Checking for plugin updates STARTED`;
        this.plugin.log(msg1, true);
        if (showInfo && this.plugin.settings.notificationsEnabled) newNotice = new Notice(`BRAT\n${msg1}`, 30000);
        const pluginSubListFrozenVersionNames = 
            new Set(this.plugin.settings.pluginSubListFrozenVersion.map(f => f.repo));
        for (const bp of this.plugin.settings.pluginList) {
            if (pluginSubListFrozenVersionNames.has(bp)) {
                continue;
            }
            await this.updatePlugin(bp, onlyCheckDontUpdate);
        }
        const msg2 = `Checking for plugin updates COMPLETED`;
        this.plugin.log(msg2, true);
        if (showInfo) {
            newNotice.hide();
            ToastMessage(this.plugin, msg2, 10);
        }
    }

    /**
     * Removes the beta plugin from the list of beta plugins (does not delete them from disk)
     *
     * @param   {string<void>}   betaPluginID  repository path
     *
     * @return  {Promise<void>}                [return description]
     */
    async deletePlugin(repositoryPath: string): Promise<void> {
        const msg = `Removed ${repositoryPath} from BRAT plugin list`;
        this.plugin.log(msg, true);
        this.plugin.settings.pluginList = this.plugin.settings.pluginList.filter((b) => b != repositoryPath);
        this.plugin.settings.pluginSubListFrozenVersion = 
            this.plugin.settings.pluginSubListFrozenVersion.filter(
                (b) => b.repo != repositoryPath
            );
        this.plugin.saveSettings();
    }

    /**
     * Returns a list of plugins that are currently enabled or currently disabled
     *
     * @param   {boolean[]}        enabled  true for enabled plugins, false for disabled plutings
     *
     * @return  {PluginManifest[]}           manifests  of plugins
     */
    getEnabledDisabledPlugins(enabled: boolean): PluginManifest[] {
        // @ts-ignore
        const pl = this.plugin.app.plugins;
        const manifests: PluginManifest[] = Object.values(pl.manifests);
        // @ts-ignore
        const enabledPlugins: PluginManifest[] = Object.values(pl.plugins).map(p => p.manifest);
        return enabled ?
            manifests.filter(manifest => enabledPlugins.find(pluginName => manifest.id === pluginName.id)) :
            manifests.filter(manifest => !enabledPlugins.find(pluginName => manifest.id === pluginName.id));
    }
}