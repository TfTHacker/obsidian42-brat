import ThePlugin from "./main";
import AddNewPluginModal from "./AddNewPluginModal";
import { grabManifestJsonFromRepository, grabReleaseFileFromRepository, reloadPlugin } from "./githubUtils";
import { Notice, PluginManifest } from "obsidian";

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

    async displayAddNewPluginModal() {
        const newPlugin = new AddNewPluginModal(this.plugin, this);
        newPlugin.open();
    }

    /**
     *  Validates that a GitHub repository is plugin
     * 
     * @param {string} repositoryPath - GithubUser/RepositoryName (example: TfThacker/obsidian42-brat)
     * @param {boolean} getBetaManifest - test the beta version of the manifest, not at the root
     * @param {boolean} reportIsues - will display notices as it finds issues
     * @returns {PluginManifest} the manifest file if found, or null if its incomplete
     */
    async validateRepository(repositoryPath: string, getBetaManifest = false, reportIsues = false): Promise<PluginManifest> {
        const manifestJson = await grabManifestJsonFromRepository(repositoryPath, !getBetaManifest);
        if (!manifestJson) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice("This does not seem to be an obsidian plugin, as there is no manifest.json file.")
            return null;
        }
        // Test that the mainfest has some key elements, like ID and version
        if (!("id" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice("The plugin id attribute for the release is missing from the manifest file")
            return null;
        }
        if (!("version" in manifestJson)) { // this is a plugin with a manifest json, try to see if there is a beta version
            if (reportIsues) new Notice("The version attribute for the release is missing from the manifest file")
            return null;
        }
        return manifestJson;
    }

    /**
     * Gets all the release files  based on the version number in the manifest
     * @param repositoryPath 
     * @param manifest 
     * @returns ReleaseFiles object (with main.js, manifest.json, styles.css)
     */
    async getAllReleaseFiles(repositoryPath: string, manifest: PluginManifest): Promise<ReleaseFiles> {
        return {
            mainJs: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "main.js"),
            manifest: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "manifest.json"),
            styles: await grabReleaseFileFromRepository(repositoryPath, manifest.version, "styles.css")
        }
    }

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
     * Adds a plugin to the list of beta plugins and installs the plugin
     * @param repositoryPath path to repository
     * @returns true if succeed
     */
    async addPlugin(repositoryPath: string, updatePluginFiles = false): Promise<boolean> {
        const manifestJson = await this.validateRepository(repositoryPath, false, true);
        if (manifestJson === null) return false;
        const betaManifestJson = await this.validateRepository(repositoryPath, false, true);
        const primaryManifest: PluginManifest = betaManifestJson ? betaManifestJson : manifestJson; // if there is a beta manifest, use that

        const releaseFiles = await this.getAllReleaseFiles(repositoryPath, primaryManifest)

        if (releaseFiles.mainJs === "Not Found") {
            new Notice("The release is not complete and cannot be download. main.js is missing from the release", 20000);
            return false;
        }

        if (releaseFiles.manifest === "Not Found") {
            new Notice("The release is not complete and cannot be download. manifest.json is missing from the release", 20000);
            return false;
        }
        const remoteManifestJSON = JSON.parse(releaseFiles.manifest);

        if (updatePluginFiles === false) {
            await this.writeReleaseFilesToPluginFolder(remoteManifestJSON.id, releaseFiles);
            new Notice("The plugin has been installed and now needs to be enabled in Community Plugins in Settings. First refresh community plugins and then enable this plugin", 20000);
        } else {
            // test if the plugin needs to be updated
            const pluginTargetFolderPath = this.plugin.app.vault.configDir + "/plugins/" + remoteManifestJSON.id + "/";
            const localManifestContents = await this.plugin.app.vault.adapter.read(pluginTargetFolderPath + "manifest.json")
            const localManifestJSON = await JSON.parse(localManifestContents);
            if (localManifestJSON.version !== remoteManifestJSON.version) { //manifest files are not the same, do an update
                await this.writeReleaseFilesToPluginFolder(remoteManifestJSON.id, releaseFiles);
                await reloadPlugin(this.plugin, remoteManifestJSON.id)
                new Notice(`The "${remoteManifestJSON.id}" plugin has been updated and reloaded`, 20000);
            }
        }
        return true;
    }

    async updatePlugin(repositoryPath: string) {
        const result = await this.addPlugin(repositoryPath,true);
        if(result===false)
            new Notice(`The update of "${repositoryPath}" plugin failed.`)
    }

    // Removes plugin from the list of beta plugins
    // unistalls the beta
    deletePlugin() {

    }

    async getBetaPluginIDs(): Promise<Array<string>> {
        let bratEnabledPlugins = [];
        //@ts-ignore
        const pluginManifests = this.plugin.app.plugins.manifests;
        for(const manifest of Object.values(pluginManifests)) {
            if(await this.plugin.app.vault.adapter.exists(manifest.dir + "/.brat")) {
                bratEnabledPlugins.push(manifest.id);
            }
        }
        return bratEnabledPlugins;
    }

    /**
     * update all plugins
     * looks for a .brat file in the plugin folder.  if it is there, it will check for  updates
     */
    checkForUpdates() {

    }

}