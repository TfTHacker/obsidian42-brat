import { themeInstallTheme, themesDelete, themeseCheckAndUpdates } from "../features/themes";
import ThePlugin from "../main";
import { Settings, addBetaThemeToList } from "../ui/settings";


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
            await themeseCheckAndUpdates(this.plugin, showInfo);
        },

        themeInstallTheme: async (cssGithubRepository: string): Promise<void> => {
            const scrubbedAddress = cssGithubRepository.replace("https://github.com/", "");
            await themeInstallTheme(this.plugin, scrubbedAddress);
            await addBetaThemeToList(this.plugin, scrubbedAddress);
        },

        themesDelete: async (cssGithubRepository: string): Promise<void> => {
            const scrubbedAddress = cssGithubRepository.replace("https://github.com/", "");
            await themesDelete(this.plugin, scrubbedAddress)
        }

    }

}