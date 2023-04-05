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
export const grabReleaseFileFromRepository = async (repository: string, version: string, fileName: string, debugLogging = true): Promise<string|null> => {
    const URL = `https://github.com/${repository}/releases/download/${version}/${fileName}`;
    try {
        const download = await request({ url: URL });
        return ((download === "Not Found" || download === `{"error":"Not Found"}`) ? null : download);
    } catch (error) {
        if(debugLogging) console.log("error in grabReleaseFileFromRepository", URL, error)
        return null;
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
export const grabManifestJsonFromRepository = async (repositoryPath: string, rootManifest = true, debugLogging = true): Promise<PluginManifest|null> => {
    const manifestJsonPath = GITHUB_RAW_USERCONTENT_PATH + repositoryPath +
        (rootManifest === true ? "/HEAD/manifest.json" : "/HEAD/manifest-beta.json");
    try {
        const response = await request({ url: manifestJsonPath });
        return (response === "404: Not Found" ? null : await JSON.parse(response));
    } catch (error) {
        if(error!="Error: Request failed, status 404" && debugLogging)  { //normal error, ignore
            console.log(`error in grabManifestJsonFromRepository for ${manifestJsonPath}`, error);
        }
        return null;
    }
}


export const grabCommmunityPluginList = async (debugLogging = true): Promise<JSON|null> => {
    const pluginListURL = `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-plugins.json`;
    try {
        const response = await request({ url: pluginListURL });
        return (response === "404: Not Found" ? null : await JSON.parse(response));
    } catch (error) {
        if(debugLogging) console.log("error in grabCommmunityPluginList", error)
        return null;
    }
}

export const grabCommmunityThemesList = async (debugLogging = true): Promise<JSON|null> => {
    const themesURL = `https://raw.githubusercontent.com/obsidianmd/obsidian-releases/HEAD/community-css-themes.json`;
    try {
        const response = await request({ url: themesURL });
        return (response === "404: Not Found" ? null : await JSON.parse(response));
    } catch (error) {
        if(debugLogging) console.log("error in grabCommmunityThemesList", error)
        return null;
    }
}


export const grabCommmunityThemeCssFile = async (repositoryPath: string, betaVersion = false, debugLogging): Promise<string|null> => {
    const themesURL = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/theme${betaVersion ? "-beta" : ""}.css`;
    try {
        const response = await request({ url: themesURL });
        return (response === "404: Not Found" ? null : response);
    } catch (error) {
        if(debugLogging) console.log("error in grabCommmunityThemeCssFile", error)
        return null;
    }
}

export const grabCommmunityThemeManifestFile = async (repositoryPath: string, debugLogging = true): Promise<string|null> => {
    const themesURL = `https://raw.githubusercontent.com/${repositoryPath}/HEAD/manifest.json`;
    try {
        const response = await request({ url: themesURL });
        return (response === "404: Not Found" ? null : response);
    } catch (error) {
        if(debugLogging) console.log("error in grabCommmunityThemeManifestFile", error)
        return null;
    }
}

const checksum = (str: string): number => {
    let sum = 0;
    for (let i = 0; i < str.length; i++) {
        sum += str.charCodeAt(i);
    }
    return sum;
}

export const checksumForString = (str: string): string => {
    return checksum(str).toString();
}

export const grabChecksumOfThemeCssFile = async (repositoryPath: string, betaVersion, debugLogging): Promise<string> =>{
    const themeCSS = await grabCommmunityThemeCssFile(repositoryPath, betaVersion, debugLogging)
    return themeCSS ? checksumForString(themeCSS) : "0";
}

export const grabLastCommitInfoForAFile = async (repositoryPath: string, path: string, debugLogging = true): Promise<string|null> => {
    const url = `https://api.github.com/repos/${repositoryPath}/commits?path=${path}&page=1&per_page=1`;
    try {
        const response = await request({ url: url });
        return (response === "404: Not Found" ? null : JSON.parse(response));
    } catch (error) {
        if(debugLogging) console.log("error in grabLastCommitInfoForAFile", error)
        return null;
    }
}

export const grabLastCommitDateForAFile = async (repositoryPath: string, path: string): Promise<string> => {
    const test = await grabLastCommitInfoForAFile(repositoryPath, path);
    //@ts-ignore
    if(test[0].commit.committer.date){
        //@ts-ignore
        return test[0].commit.committer.date
    }
    else
        return "";
}

