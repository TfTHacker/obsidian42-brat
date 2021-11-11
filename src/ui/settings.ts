import { grabLastCommitDateForAFile } from "../features/githubUtils";
import ThePlugin from "../main";

export interface ThemeInforamtion {
    repo: string;
    lastUpdate: string;
}

export interface Settings {
    pluginList: string[];
    themesList: ThemeInforamtion[];
    updateAtStartup: boolean;
    ribbonIconEnabled: boolean;
    loggingEnabled: boolean;
    loggingPath: string;
    loggingVerboseEnabled: boolean;
    debuggingMode: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
    pluginList: [],
    themesList: [],
    updateAtStartup: false,
    ribbonIconEnabled: true,
    loggingEnabled: false,
    loggingPath: "BRAT-log",
    loggingVerboseEnabled: false,
    debuggingMode: true
}

/**
 * Adds a plugin for beta testing to the data.json file of this  plugin
 *
 * @param   {ThePlugin}      plugin         
 * @param   {string<void>}   repositoryPath  path to the GitHub repository
 *
 * @return  {Promise<void>}                  
 */
export async function addBetaPluginToList(plugin: ThePlugin, repositoryPath: string): Promise<void> {
    if (!plugin.settings.pluginList.contains(repositoryPath)) {
        plugin.settings.pluginList.unshift(repositoryPath);
        plugin.saveSettings();
    }
}

/**
 * Tests if  a  plugin  is in data.json
 *
 * @param   {ThePlugin}         plugin          
 * @param   {string<boolean>}   repositoryPath  path to the GitHub repository
 *
 * @return  {Promise<boolean>}  true if exists      
 */
export async function existBetaPluginInList(plugin: ThePlugin, repositoryPath: string): Promise<boolean> {
    return plugin.settings.pluginList.contains(repositoryPath);
}


/**
 * Adds a theme for beta testing to the data.json file of this  plugin
 *
 * @param   {ThePlugin}      plugin         
 * @param   {string<void>}   repositoryPath  path to the GitHub repository
 *
 * @return  {Promise<void>}                  
 */
 export async function addBetaThemeToList(plugin: ThePlugin, repositoryPath: string): Promise<void> {
     const newTheme: ThemeInforamtion = { 
         repo: repositoryPath, 
         lastUpdate: await grabLastCommitDateForAFile(repositoryPath, "obsidian.css")
    }
    plugin.settings.themesList.unshift(newTheme);
    plugin.saveSettings();
}

/**
 * Tests if a  theme  is in data.json
 *
 * @param   {ThePlugin}         plugin          
 * @param   {string<boolean>}   repositoryPath  path to the GitHub repository
 *
 * @return  {Promise<boolean>}  true if exists      
 */
export async function existBetaThemeinInList(plugin: ThePlugin, repositoryPath: string): Promise<boolean> {
    const testIfThemExists = plugin.settings.themesList.find(t=> t.repo === repositoryPath);
    return testIfThemExists ? true : false;
}


/**
 * Update the lastUpate field for the theme
 *
 * @param   {ThePlugin}         plugin          
 * @param   {string<boolean>}   repositoryPath  path to the GitHub repository
 * @param   {string<newDate>}   newDate  last update for this theme
 *
 * @return  {Promise<boolean>}  true if exists      
 */
 export function updateBetaThemeLastUpdateDate(plugin: ThePlugin, repositoryPath: string, newDate: string): void {
    plugin.settings.themesList.forEach(t=>{
        if(t.repo === repositoryPath) {
            t.lastUpdate = newDate;
            plugin.saveSettings();
        }
    });


}

