import { PluginManifest, request } from "obsidian";

const GITHUB_RAW_USERCONTENT_PATH = "https://raw.githubusercontent.com/";

/**
 * pulls from github a release file by its version number
 *
 * @param   {string}           repository  path to GitHub repository in format USERNAME/repository
 * @param   {string}           version     version of release to retrive
 * @param   {string<string>}   fileName    name of file to retrieve from release
 *
 * @return  {Promise<string>}              contents of file as string from the repository's release
 */
export const grabReleaseFileFromRepository = async (repository: string, version: string, fileName: string): Promise<string> => {
    const URL = `https://github.com/${repository}/releases/download/${version}/${fileName}`;
    try {
        const download = await request({ url: URL });
        return ((download === "Not Found" || download === `{"error":"Not Found"}`) ? null : download);
    } catch (error) {
        console.log("error in grabReleaseFileFromRepository", URL, error)
    }
}

/**
 * grabs the manifest.json from the repository. rootManifest - if true grabs manifest.json if false grabs manifest-beta.json
 *
 * @param   {string}                     repositoryPath  path to GitHub repository in format USERNAME/repository
 * @param   {[type]}                     rootManifest    if true grabs manifest.json if false grabs manifest-beta.json
 *
 * @return  {Promise<PluginManifest>}                    returns manifest file for  a plugin
 */
export const grabManifestJsonFromRepository = async (repositoryPath: string, rootManifest = true): Promise<PluginManifest> => {
    const manifestJsonPath = GITHUB_RAW_USERCONTENT_PATH + repositoryPath +
        (rootManifest === true ? "/HEAD/manifest.json" : "/HEAD/manifest-beta.json");
    try {
        const response = await request({ url: manifestJsonPath });
        return (response === "404: Not Found" ? null : await JSON.parse(response));
    } catch (error) {
        console.log(`error in grabManifestJsonFromRepository for ${manifestJsonPath}`, error);
    }
}


export const grabCommmunityPluginList = async (): Promise<JSON> => {
    const pluginListURL = `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json`;
    try {
        const response = await request({ url: pluginListURL });
        return (response === "404: Not Found" ? null : await JSON.parse(response));
    } catch (error) {
        console.log("error in grabCommmunityPluginList", error)
    }
}

export const grabCommmunityThemesList = async (): Promise<JSON> => {
    const themesURL = `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-css-themes.json`;
    try {
        const response = await request({ url: themesURL });
        return (response === "404: Not Found" ? null : await JSON.parse(response));
    } catch (error) {
        console.log("error in grabCommmunityThemesList", error)
    }
}


export const grabCommmunityThemeObsidianCss = async (repositoryPath: string): Promise<string> => {
    const themesURL = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/obsidian.css`;
    try {
        const response = await request({ url: themesURL });
        return (response === "404: Not Found" ? null : response);
    } catch (error) {
        console.log("error in grabCommmunityThemesList", error)
    }
}

export const grabLastCommitInfoForAFile = async (repositoryPath: string, path: string): Promise<string> => {
    const url = `https://api.github.com/repos/${repositoryPath}/commits?path=${path}&page=1&per_page=1`;
    console.log(url)
    try {
        const response = await request({ url: url });
        return (response === "404: Not Found" ? null : JSON.parse(response));
    } catch (error) {
        console.log("error in grabCommmunityThemesList", error)
    }
}

export const grabLastCommitDateForAFile = async (repositoryPath: string, path: string): Promise<string> => {
    const test = await grabLastCommitInfoForAFile(repositoryPath, path);
    if(test[0].commit.committer.date)
        return test[0].commit.committer.date
    else
        return "";
}
