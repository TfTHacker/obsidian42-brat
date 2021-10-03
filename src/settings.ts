import ThePlugin from "./main";

export interface Settings {
    pluginList: string[];
}

export const DEFAULT_SETTINGS: Settings = {
    pluginList: []
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
        plugin.settings.pluginList.push(repositoryPath);
        plugin.saveSettings();
    }
}

/**
 * tests if  a  plugin  is in data.json
 *
 * @param   {ThePlugin}         plugin          
 * @param   {string<boolean>}   repositoryPath  path to the GitHub repository
 *
 * @return  {Promise<boolean>}  true if exists      
 */
export async function existBetaPluginInList(plugin: ThePlugin, repositoryPath: string): Promise<boolean> {
    return plugin.settings.pluginList.contains(repositoryPath);
}

