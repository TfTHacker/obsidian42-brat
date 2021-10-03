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
    try {
        const download = await request({ url: `https://github.com/${repository}/releases/download/${version}/${fileName}` });
        return (download === "Not Found" ? null : download);
    } catch (error) {
        console.log("error in grabReleaseFileFromRepository", error)
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
        console.log("error in grabManifestJsonFromRepository", error)
    }
}
