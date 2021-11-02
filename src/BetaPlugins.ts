import ThePlugin from "./main";
import AddNewPluginModal from "./AddNewPluginModal";
import { grabManifestJsonFromRepository, grabReleaseFileFromRepository } from "./githubUtils";
import { normalizePath, Notice, PluginManifest } from "obsidian";
import { addBetaPluginToList } from "./settings";

/**
 * all the files needed for a plugin based on the release files are hre
 */
interface ReleaseFiles {
    mainJs: string;
    manifest: string;
    styles: string;
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
     * @return  {<Promise><void>}
     */
    async displayAddNewPluginModal(openSettingsTabAfterwards = false): Promise<void> {
        const newPlugin = new AddNewPluginModal(this.plugin, this, openSettingsTabAfterwards);
        newPlugin.open();
    }

    /**
     * Validates that a GitHub repository is plugin
     *
     * @param   {string}                     repositoryPath   GithubUser/RepositoryName (example: TfThacker/obsidian42-brat)
     * @param   {[type]}                     getBetaManifest  test the beta version of the manifest, not at the root
     * @param   {[type]}                     false            [false description]
     * @param   {[type]}                     reportIsues      will display notices as it finds issues
     *
     * @return  {Promise<PluginManifest>}                     the manifest file if found, or null if its incomplete
     */
    async validateRepository(repositoryPath: string, getBetaManifest = false, reportIsues = false): Promise<PluginManifest> {
        const noticeTimeout = 15000;
        const manifestJson = await grabManifestJsonFromRepository(repositoryPath, !getBetaManifest);
        if (!manifestJson) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice(`BRAT\n${repositoryPath}\nThis does not seem to be an obsidian plugin, as there is no manifest.json file.`, noticeTimeout);
            return null;
        }
        // Test that the mainfest has some key elements, like ID and version
        if (!("id" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice(`BRAT\n${repositoryPath}\nThe plugin id attribute for the release is missing from the manifest file`, noticeTimeout);
            return null;
        }
        if (!("version" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice(`BRAT\n${repositoryPath}\nThe version attribute for the release is missing from the manifest file`, noticeTimeout);
            return null;
        }
        return manifestJson;
    }

    /**
     * Gets all the relese files based on the version number in the manifest
     *
     * @param   {string}                        repositoryPath  path to the GitHub repository
     * @param   {PluginManifest<ReleaseFiles>}  manifest        manifest file
     * @param   {boolean}                       getManifest     grab the remote manifest file
     *
     * @return  {Promise<ReleaseFiles>}                         all relase files as strings based on the ReleaseFiles interaface
     */
    async getAllReleaseFiles(repositoryPath: string, manifest: PluginManifest, getManifest: boolean): Promise<ReleaseFiles> {
        return {
            mainJs: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "main.js"),
            manifest: getManifest ? await grabReleaseFileFromRepository(repositoryPath, manifest.version, "manifest.json") : null,
            styles: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "styles.css")
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
     * Primary function for adding a new beta plugin to obsidian. Also this function is use for updating
     * existing plugins.
     *
     * @param   {string}              repositoryPath     path to GitHub repository formated as USERNAME/repository
     * @param   {boolean}             updatePluginFiles  true if this is just an update not an install
     * @param   {boolean}             seeIfUpdatedOnly   if true, and updatePluginFiles true, will just check for updates, but not do the update. will report to user that there is a new plugin
     * @param   {boolean}             reportIfNotUpdted  if true, report if an update has not succed
     *
     * @return  {Promise<boolean>}                       true if succeeds
     */
    async addPlugin(repositoryPath: string, updatePluginFiles = false, seeIfUpdatedOnly = false, reportIfNotUpdted = false): Promise<boolean> {
        const noticeTimeout = 10000;
        let primaryManifest = await this.validateRepository(repositoryPath, true, false); // attempt to get manifest-beta.json
        const usingBetaManifest: boolean = primaryManifest ? true : false;
        if(usingBetaManifest===false) 
            primaryManifest = await this.validateRepository(repositoryPath, false, true); // attempt to get manifest.json

        if(primaryManifest===null) {
            new Notice(`BRAT\n${repositoryPath}\nA manifest.json or manifest-beta.json file does not exist in the root directory of the repository. This plugin cannot be installed.`, noticeTimeout);
            return false;
        }
            
        if(!primaryManifest.hasOwnProperty('version')) {
            new Notice(`BRAT\n${repositoryPath}\nThe manifest${usingBetaManifest ? "-beta" : ""}.json file in the root directory of the repository does not have a version number in the file. This plugin cannot be installed.`, noticeTimeout);
            return false;
        }

        const getRelease = async ()=>{
            const rFiles = await this.getAllReleaseFiles(repositoryPath, primaryManifest, usingBetaManifest);
            if(usingBetaManifest || rFiles.manifest === null)  //if beta, use that manifest, or if there is no manifest in release, use the primaryManifest
                rFiles.manifest = JSON.stringify(primaryManifest);
    
            if (rFiles.mainJs === null) {
                new Notice(`BRAT\n${repositoryPath}\nThe release is not complete and cannot be download. main.js is missing from the Release`, noticeTimeout);
                return null;
            }
            return rFiles;
        }

        if (updatePluginFiles === false) {
            const releaseFiles = await getRelease();
            if (releaseFiles===null) return;
            await this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
            await addBetaPluginToList(this.plugin, repositoryPath);
            //@ts-ignore
            await this.plugin.app.plugins.loadManifests();
            new Notice(`BRAT\n${repositoryPath}\nThe plugin has been registered with BRAT. You may still need to enable it the Community Plugin List.`, noticeTimeout);
        } else {
            // test if the plugin needs to be updated
            const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + primaryManifest.id + "/";
            let localManifestContents = null;
            try {
                localManifestContents = await this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json")
            } catch (e) {
                if (e.errno === -4058) { // file does not exist, try installing the plugin
                    await this.addPlugin(repositoryPath, false, usingBetaManifest);
                    return true; // even though failed, return true since install will be attempted
                }
                else
                    console.log("BRAT - Local Manifest Load", primaryManifest.id, JSON.stringify(e, null, 2));
            }
            const localManifestJSON = await JSON.parse(localManifestContents);
            if (localManifestJSON.version !== primaryManifest.version) { //manifest files are not the same, do an update
                const releaseFiles = await getRelease();
                if (releaseFiles===null) return;

                if (seeIfUpdatedOnly) { // dont update, just report it
                    new Notice(`BRAT\nThere is an update available for ${primaryManifest.id} from version ${localManifestJSON.version} to ${primaryManifest.version}`,30000);
                } else {
                    await this.writeReleaseFilesToPluginFolder(primaryManifest.id, releaseFiles);
                    //@ts-ignore
                    await this.plugin.app.plugins.loadManifests();
                    //@ts-ignore
                    if(this.plugin.app.plugins.plugins[primaryManifest.id]?.manifest) await this.reloadPlugin(primaryManifest.id); //reload if enabled
                    new Notice(`BRAT\n${primaryManifest.id}\nPlugin has been updated from version ${localManifestJSON.version} to ${primaryManifest.version}.`, 30000);
                }
            } else
                if (reportIfNotUpdted) new Notice(`BRAT\nNo update available for ${repositoryPath}`, 3000);
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
        } catch (e) { console.log("reload plugin", e) }
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
            new Notice(`BRAT\n${repositoryPath}\nUpdate of plugin failed.`)
        return result;
    }

    /**
     * walks through the list  of plugins and performs anupdate
     *
     * @param   {boolean}           showInfo  should this with a started/completed message - useful when ran from CP
     * @return  {Promise<void>}              
     */
    async checkForUpdatesAndInstallUpdates(showInfo = false, onlyCheckDontUpdate = false): Promise<void> {
        if (showInfo) new Notice(`BRAT\nChecking for plugin updates STARTED`, 10000);
        for (const bp of this.plugin.settings.pluginList) {
            await this.updatePlugin(bp, onlyCheckDontUpdate);
        }
        if (showInfo) new Notice(`BRAT\nChecking for plugin updates COMPLETED`, 10000);
    }

    /**
     * Removes the beta plugin from the list of beta plugins (does not delete them from disk)
     *
     * @param   {string<void>}   betaPluginID  repository path
     *
     * @return  {Promise<void>}                [return description]
     */
    async deletePlugin(repositoryPath: string): Promise<void> {
        this.plugin.settings.pluginList = this.plugin.settings.pluginList.filter((b) => b != repositoryPath);
        this.plugin.saveSettings();
    }

    /**
     * Returns a list of plugins that are currently enabled or currently disabled
     *
     * @param   {boolean[]}        enabled  true for enabled plugins, false for disabled plutings
     *
     * @return  {PluginManifest[]}           manifests  of plugins
     */
    getEnabledDisabledPlugins( enabled: boolean): PluginManifest[] {
        // @ts-ignore
        const pl = this.plugin.app.plugins;
        const manifests: PluginManifest[] = Object.values(pl.manifests);
        // @ts-ignore
        const enabledPlugins: PluginManifest[] = Object.values(pl.plugins).map(p=>p.manifest);
        return  enabled ? 
                manifests.filter(manifest => enabledPlugins.find(pluginName=> manifest.id===pluginName.id)) :
                manifests.filter(manifest => !enabledPlugins.find(pluginName=> manifest.id===pluginName.id));
    }
}