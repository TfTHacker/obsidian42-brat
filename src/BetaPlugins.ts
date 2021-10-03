import ThePlugin from "./main";
import AddNewPluginModal from "./AddNewPluginModal";
import { grabManifestJsonFromRepository, grabReleaseFileFromRepository } from "./githubUtils";
import { Notice, PluginManifest } from "obsidian";
import { addBetaPluginToList } from "./settings";

/**
 * all the files needed for a plugin based on the release files are hre
 */
interface ReleaseFiles {
    mainJs: string;
    manifest: string;
    styles: string;
}

export default class BetaPlugins {
    plugin: ThePlugin;

    constructor(plugin: ThePlugin) {
        this.plugin = plugin;
    }

    /**
     * opens the AddNewPluginModal to get info for  a new beta plugin
     *
     * @return  {<Promise><void>}
     */
    async displayAddNewPluginModal(): Promise<void> {
        const newPlugin = new AddNewPluginModal(this.plugin, this);
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
    async validateRepository(repositoryPath: string, getBetaManifest: boolean = false, reportIsues: boolean = false): Promise<PluginManifest> {
        const noticeTimeout = 60000;
        const manifestJson = await grabManifestJsonFromRepository(repositoryPath, !getBetaManifest);
        if (!manifestJson) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice(`${repositoryPath}\nThis does not seem to be an obsidian plugin, as there is no manifest.json file.`, noticeTimeout);
            return null;
        }
        // Test that the mainfest has some key elements, like ID and version
        if (!("id" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice(`${repositoryPath}\nThe plugin id attribute for the release is missing from the manifest file`, noticeTimeout);
            return null;
        }
        if (!("version" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice(`${repositoryPath}\nThe version attribute for the release is missing from the manifest file`, noticeTimeout);
            return null;
        }
        return manifestJson;
    }

    /**
     * Gets all the relese files based on the version number in the manifest
     *
     * @param   {string}                        repositoryPath  path to the GitHub repository
     * @param   {PluginManifest<ReleaseFiles>}  manifest        manifest file
     *
     * @return  {Promise<ReleaseFiles>}                         all relase files as strings based on the ReleaseFiles interaface
     */
    async getAllReleaseFiles(repositoryPath: string, manifest: PluginManifest): Promise<ReleaseFiles> {
        return {
            mainJs: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "main.js"),
            manifest: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "manifest.json"),
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
        const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + betaPluginID + "/";
        if (await this.plugin.app.vault.adapter.exists(pluginTargetFolderPath) === false ||
            !(await this.plugin.app.vault.adapter.exists(pluginTargetFolderPath + "manifest.json"))) {
            // if plugin folder doesnt exist or manifest.json doesn't exist, create it and save the plugin files
            await this.plugin.app.vault.adapter.mkdir(pluginTargetFolderPath);
        }
        await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "main.js", relFiles.mainJs);
        await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "manifest.json", relFiles.manifest);
        if (relFiles.styles) await this.plugin.app.vault.adapter.write(pluginTargetFolderPath + "styles.css", relFiles.styles);
    }

    /**
     * Primary function for adding a new beta plugin to obsidian. Also this function is use for updating
     * existing plugins.
     *
     * @param   {string}              repositoryPath     path to GitHub repository formated as USERNAME/repository
     * @param   {[type]}              updatePluginFiles  true if this is just an update not an install
     *
     * @return  {Promise<boolean>}                       true if succeeds
     */
    async addPlugin(repositoryPath: string, updatePluginFiles: boolean = false): Promise<boolean> {
        const manifestJson = await this.validateRepository(repositoryPath, false, true);
        const noticeTimeout = 60000;
        if (manifestJson === null) return false;
        const betaManifestJson = await this.validateRepository(repositoryPath, true, false);
        const primaryManifest: PluginManifest = betaManifestJson ? betaManifestJson : manifestJson; // if there is a beta manifest, use that

        const releaseFiles = await this.getAllReleaseFiles(repositoryPath, primaryManifest)

        if (releaseFiles.mainJs === "Not Found") {
            new Notice(`${repositoryPath}\nThe release is not complete and cannot be download. main.js is missing from the release`, noticeTimeout);
            return false;
        }

        if (releaseFiles.manifest === "Not Found") {
            new Notice(`${repositoryPath}\nThe release is not complete and cannot be download. manifest.json is missing from the release`, noticeTimeout);
            return false;
        }
        const remoteManifestJSON = JSON.parse(releaseFiles.manifest);

        if (updatePluginFiles === false) {
            await this.writeReleaseFilesToPluginFolder(remoteManifestJSON.id, releaseFiles);
            await addBetaPluginToList(this.plugin, repositoryPath);
            new Notice(`${repositoryPath}\nThe plugin has been installed and now needs to be enabled in Community Plugins in Settings. First refresh community plugins and then enable this plugin`, noticeTimeout);
        } else {
            // test if the plugin needs to be updated
            const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + remoteManifestJSON.id + "/";
            let localManifestContents = null;
            try {
                localManifestContents = await this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json")
            } catch (e) {
                if (e.errno = -4058) { // file does not exist, try installing the plugin
                    await this.addPlugin(repositoryPath, false);
                    return true; // even though failed, return true since install will be attempted
                } else
                    console.log(JSON.stringify(e, null, 2));
            }
            const localManifestJSON = await JSON.parse(localManifestContents);
            if (localManifestJSON.version !== remoteManifestJSON.version) { //manifest files are not the same, do an update
                await this.writeReleaseFilesToPluginFolder(remoteManifestJSON.id, releaseFiles);
                await this.reloadPlugin(remoteManifestJSON.id)
                new Notice(`${remoteManifestJSON.id}\n plugin has been updated and reloaded`, noticeTimeout);
            }
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
     * @param   {string<void>}   repositoryPath  repository path on GitHub
     *
     * @return  {Promise<void>}                  
     */
    async updatePlugin(repositoryPath: string): Promise<void> {
        const result = await this.addPlugin(repositoryPath, true);
        if (result === false)
            new Notice(`${repositoryPath}\nUpdate of plugin failed.`)
    }

    /**
     * walks through the list  of plugins and performs anupdate
     *
     * @param   {boolean}           showInfo  should this with a started/completed message - useful when ran from CP
     * @return  {Promise<void>}              
     */
    async checkForUpdates(showInfo: boolean = false): Promise<void> {
        if (showInfo) new Notice(`Checking for plugin updates STARTED`);
        for (const bp of this.plugin.settings.pluginList) {
            await this.updatePlugin(bp)
        }
        if (showInfo) new Notice(`Checking for plugin updates COMPLETED`);
    }

}