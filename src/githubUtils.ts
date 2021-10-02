import { Notice, PluginManifest, request } from "obsidian";
import ThePlugin from "./main";

const GITHUB_RAW_USERCONTENT_PATH = "https://raw.githubusercontent.com/";

// pulls from github a release file by its version number
export const grabReleaseFileFromRepository = async (repository: string, version: string, fileName: string): Promise<string> => {
    const download = await fetch(`https://github.com/${repository}/releases/download/${version}/${fileName}`);
    return (download) ? await download.text() : null;
}

// grabs the manifest.json from the repository
// rootManifest - if true grabs manifest.json if false grabs manifest-beta.json
export const grabManifestJsonFromRepository = async (repositoryPath: string, rootManifest = true): Promise<PluginManifest> => {
    const manifestJsonPath = GITHUB_RAW_USERCONTENT_PATH + repositoryPath +
        (rootManifest === true ? "/HEAD/manifest.json" : "/HEAD/manifest-beta.json");
    try {
        const response = await fetch(manifestJsonPath);
        if (!response.ok)
            return null;
        else
            return await response.json();
    } catch (error) {
        console.log("error in download", error)
    }
}


// pjeby, Thanks Bro https://github.com/pjeby/hot-reload/blob/master/main.js
// reloads a plugin (assuming it has been enabled by user)
export const reloadPlugin = async (plugin: ThePlugin, pluginName: string) => {
    // @ts-ignore
    const plugins = plugin.app.plugins;
    try {
        await plugins.disablePlugin(pluginName);
        await plugins.enablePlugin(pluginName);
        new Notice(`Plugin "${pluginName}" has been reloaded`);
    } catch (e) { }
}