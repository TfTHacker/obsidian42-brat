import { normalizePath, Notice } from "obsidian";
import ThePlugin from "../main";
import { addBetaThemeToList, updateBetaThemeLastUpdateChecksum } from "../ui/settings";
import { checksumForString, grabChecksumOfThemeCssFile, grabCommmunityThemeCssFile, grabCommmunityThemeManifestFile } from "./githubUtils";
import { ToastMessage } from "../utils/notifications";
import { isConnectedToInternet } from "../utils/internetconnection";


/**
 * Installs or updates a theme
 *
 * @param   {ThePlugin}     plugin               ThePlugin
 * @param   {string}        cssGithubRepository  The repository with the theme
 * @param   {boolean}       newInstall           true = New theme install, false update the theme
 *
 * @return  {Promise<boolean>}                   true for succcess
 */
export const themeSave = async (plugin: ThePlugin, cssGithubRepository: string, newInstall: boolean): Promise<boolean> => {
    let themeCSS = await grabCommmunityThemeCssFile(cssGithubRepository, true, plugin.settings.debuggingMode); //test for themes-beta.css
    if(!themeCSS) themeCSS = await grabCommmunityThemeCssFile(cssGithubRepository, false, plugin.settings.debuggingMode); // grabe themes.css if no beta

    if(!themeCSS) {
        ToastMessage(plugin,"There is no theme.css or theme-beta.css file in the root path of this repository, so there is no theme to install.")
        return false;
    }

    const themeManifest = await grabCommmunityThemeManifestFile(cssGithubRepository, plugin.settings.debuggingMode);
    if(!themeManifest) {
        ToastMessage(plugin,"There is no manifest.json file in the root path of this repository, so theme cannot be installed.")
        return false;
    }

    const manifestInfo = await JSON.parse(themeManifest);

    const themeTargetFolderPath = normalizePath(themesRootPath(plugin) + manifestInfo.name);

    const adapter = plugin.app.vault.adapter;
    if (await adapter.exists(themeTargetFolderPath) === false) await adapter.mkdir(themeTargetFolderPath);

    await adapter.write( normalizePath(themeTargetFolderPath + "/theme.css"), themeCSS);
    await adapter.write( normalizePath(themeTargetFolderPath + "/manifest.json"), themeManifest);

    updateBetaThemeLastUpdateChecksum(plugin, cssGithubRepository, checksumForString(themeCSS))

    let msg = ``;
    
    if(newInstall) {
        await addBetaThemeToList(plugin, cssGithubRepository, themeCSS);
        msg = `${manifestInfo.name} theme installed from ${cssGithubRepository}. `;
        setTimeout(() => {
            // @ts-ignore            
            plugin.app.customCss.setTheme(manifestInfo.name);
        }, 500);    
    } else {
        msg = `${manifestInfo.name} theme updated from ${cssGithubRepository}.`;
    }

    plugin.log(msg + `[Theme Info](https://github.com/${cssGithubRepository})`, false);
    ToastMessage(plugin,`${msg}`,20, async ():Promise<void>=>{ window.open(`https://github.com/${cssGithubRepository}`)});
    return true;
}

/**
 * Checks  if there  are theme updates based on the commit date of the obsidian.css file on github in comparison to what is stored in the BRAT theme list
 *
 * @param   {ThePlugin}      plugin    ThePlugin
 * @param   {boolean<void>}  showInfo  provide  notices during the update proces
 *
 * @return  {Promise<void>}            
 */
export const themesCheckAndUpdates = async (plugin: ThePlugin, showInfo: boolean): Promise<void> => {
    if(await isConnectedToInternet()===false) { 
        console.log("BRAT: No internet detected.") 
        return;
    }
    let newNotice: Notice;
    const msg1 = `Checking for beta theme updates STARTED`;
    plugin.log(msg1, true);
    if (showInfo && plugin.settings.notificationsEnabled) newNotice = new Notice(`BRAT\n${msg1}`, 30000);
    for(const t of plugin.settings.themesList) {
        // first test to see if theme-beta.css exists
        let lastUpdateOnline = await grabChecksumOfThemeCssFile(t.repo, true, plugin.settings.debuggingMode);
        // if theme-beta.css does NOT exist, try to get theme.css
        if(lastUpdateOnline==="0") lastUpdateOnline = await grabChecksumOfThemeCssFile(t.repo, false, plugin.settings.debuggingMode);
        if(lastUpdateOnline!==t.lastUpdate) 
            await themeSave(plugin,t.repo,false)
    }
    const msg2 = `Checking for beta theme updates COMPLETED`;
    plugin.log(msg2, true);
    if (showInfo) {
        if(plugin.settings.notificationsEnabled) newNotice!.hide();
        ToastMessage(plugin, msg2);
    }
} 

/**
 * Deletes a theme from the BRAT list (Does not physically delete the theme)
 *
 * @param   {ThePlugin}  plugin               ThePlugin
 * @param   {string}     cssGithubRepository  Repository path
 *
 * @return  {void}
 */
export const themeDelete = async (plugin: ThePlugin, cssGithubRepository: string): Promise<void> => {
    plugin.settings.themesList = plugin.settings.themesList.filter((t) => t.repo != cssGithubRepository);
    plugin.saveSettings();
    const msg = `Removed ${cssGithubRepository} from BRAT themes list and will no longer be updated. However, the theme files still exist in the vault. To remove them, go into Settings > Appearance and remove the theme.`;
    plugin.log(msg, true);
    ToastMessage(plugin, `${msg}`);
}


/**
 * Get the path to the themes folder fo rthis vault
 *
 * @param   {ThePlugin}  plugin  ThPlugin
 *
 * @return  {string}             path to themes folder
 */
export const themesRootPath = (plugin: ThePlugin): string => {
    return normalizePath(plugin.app.vault.configDir + "/themes") + "/";
}

