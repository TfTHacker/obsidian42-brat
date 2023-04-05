import { grabChecksumOfThemeCssFile, grabCommmunityThemeCssFile, grabLastCommitDateForAFile } from "../features/githubUtils";
import { themeSave, themeDelete, themesCheckAndUpdates } from "../features/themes";
import ThePlugin from "../main";
import { Settings } from "../ui/settings";


// This module is for API access for use in debuging console 

export default class BratAPI {
    plugin: ThePlugin;
    settings: Settings; 

    constructor(plugin: ThePlugin) {
        this.plugin = plugin    
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    console = (logDescription: string, ...outputs: any[]): void => {
        console.log("BRAT: " + logDescription, outputs)
    }

    themes = {

        themeseCheckAndUpates: async (showInfo: boolean): Promise<void> => {
            await themesCheckAndUpdates(this.plugin, showInfo);
        },

        themeInstallTheme: async (cssGithubRepository: string): Promise<void> => {
            const scrubbedAddress = cssGithubRepository.replace("https://github.com/", "");
            await themeSave(this.plugin, scrubbedAddress, true);
        },

        themesDelete: async (cssGithubRepository: string): Promise<void> => {
            const scrubbedAddress = cssGithubRepository.replace("https://github.com/", "");
            await themeDelete(this.plugin, scrubbedAddress)
        },

        grabCommmunityThemeCssFile: async (repositoryPath: string, betaVersion = false): Promise<string|null> =>  {
            return await grabCommmunityThemeCssFile(repositoryPath, betaVersion, this.plugin.settings.debuggingMode);
        },

        grabChecksumOfThemeCssFile: async (repositoryPath: string, betaVersion = false): Promise<string> =>  {
            return await grabChecksumOfThemeCssFile(repositoryPath, betaVersion, this.plugin.settings.debuggingMode);
        },

        grabLastCommitDateForAFile: async (repositoryPath: string, path: string): Promise<string> => {
            // example await grabLastCommitDateForAFile(t.repo, "theme-beta.css");
            return await grabLastCommitDateForAFile(repositoryPath, path)
        },




        
    }

}