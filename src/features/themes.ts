import { normalizePath, Notice } from "obsidian";
import ThePlugin from "../main";
import { GenericFuzzySuggester, SuggesterItem } from "../ui/GenericFuzzySuggester";
import { updateBetaThemeLastUpdateDate } from "../ui/settings";
import { grabCommmunityThemeCssFile, grabCommmunityThemeManifestFile, grabCommmunityThemesList, grabLastCommitDateForAFile } from "./githubUtils";
import { ToastMessage } from "../utils/notifications";
import { isConnectedToInternet } from "../utils/internetconnection";

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


/**
 * Installs a theme, including downloading and registring it with BRAT
 *
 * @param   {ThePlugin}           plugin               ThePlugin
 * @param   {string}              cssGithubRepository  The repository with the theme
 * @param   {undefined<boolean>}  cssFileName          name of the css file that will be saved to the themes folder inthe vault
 *
 * @return  {Promise<boolean>}                         true for succcess
 */
export const themeInstallTheme = async (plugin: ThePlugin, cssGithubRepository: string, cssFileName = ""): Promise<boolean> => {
    const themeCSS = await grabCommmunityThemeCssFile(cssGithubRepository, plugin.settings.debuggingMode);
    if(!themeCSS) {
        ToastMessage(plugin,"There is no theme.css file in the root path of this repository, so there is no theme to install.")
        return false;
    }

    const themeManifest = await grabCommmunityThemeManifestFile(cssGithubRepository, plugin.settings.debuggingMode);
    if(!themeManifest) {
        ToastMessage(plugin,"There is no manifest.json file in the root path of this repository, so theme cannot be installed.")
        return false;
    }

    await themesSaveTheme(plugin, cssFileName, themeCSS, themeManifest);

    const manifestInfo = await JSON.parse(themeManifest);

    const msg = `${manifestInfo.name} theme installed from ${cssGithubRepository}. `;
    plugin.log(msg + `[Theme Info](https://github.com/${cssGithubRepository})`, false);
    ToastMessage(plugin,`${msg}`,10, async ()=>{ window.open(`https://github.com/${cssGithubRepository}`)});
    setTimeout(() => {
        // @ts-ignore            
        plugin.app.customCss.setTheme(manifestInfo.name);
    }, 500);
    return true;
}

/**
 * Saves the  theme file to the vault
 *
 * @param   {ThePlugin}      plugin         ThePlugin
 * @param   {string}         cssFileName    file name to be used in the themes folder
 * @param   {string<void>}   cssText        the css file contents
 * @param   {string<void>}   manifestFile   the css file contents
 *
 * @return  {Promise<void>}               
 */
export const themesSaveTheme = async (plugin: ThePlugin, cssFileName: string, cssText: string, manifestFile: string): Promise<void> => {
    const manifestInfo = await JSON.parse(manifestFile);
    const themeTargetFolderPath = normalizePath(themesRootPath(plugin) + manifestInfo.name);

    const adapter = plugin.app.vault.adapter;
    if (await adapter.exists(themeTargetFolderPath) === false) await adapter.mkdir(themeTargetFolderPath);

    await adapter.write( normalizePath(themeTargetFolderPath + "/theme.css"), cssText);
    await adapter.write( normalizePath(themeTargetFolderPath + "/manifest.json"), manifestFile);
}


/**
 * Install a theme from the community list. this is doing the same thing as the built in theme installer in obsidian, but this makes it fast to do through command palette
 *
 * @param   {ThePlugin<void>}  plugin  ThePlugin
 *
 * @return  {}            [return description]
 */
export const themesInstallFromCommunityList = async (plugin: ThePlugin): Promise<void> =>{
    const communityTheme = await grabCommmunityThemesList(plugin.settings.debuggingMode);
    const communityThemeList: SuggesterItem[] = Object.values(communityTheme).map((p) => { return { display: `Theme: ${p.name}  (${p.repo})`, info: p } });
    const gfs = new GenericFuzzySuggester(plugin);
    gfs.setSuggesterData(communityThemeList);
    await gfs.display(async (results) => {
        await themeInstallTheme(plugin, results.info.repo, results.info.name);
    });
}


/**
 * Generates a file name for the theme. It is based on the github repository theme name
 *
 * @param   {string}  cssGithubRepository  [cssGithubRepository description]
 *
 * @return  {string}                       [return description]
 */
export const themesDeriveBetaNameFromRepository = (cssGithubRepository: string): string => {
    const betaName = "BRAT-" + cssGithubRepository.replace("/", "----");
    return betaName.substr(0, 100);
}


/**
 * Deletes a them from the BRAT list (Does not physically delete the theme)
 *
 * @param   {ThePlugin}  plugin               ThePlugin
 * @param   {string}     cssGithubRepository  Repository path
 *
 * @return  {void}
 */
export const themesDelete = async (plugin: ThePlugin, cssGithubRepository: string): Promise<void> => {
    plugin.settings.themesList = plugin.settings.themesList.filter((t) => t.repo != cssGithubRepository);
    plugin.saveSettings();
    const msg = `Removed ${cssGithubRepository} from BRAT themes list and will no longer be updated. However, the theme files still exist in the vault. To remove them, go into Settings > Appearance and uninstall the theme.`;
    plugin.log(msg, true);
    ToastMessage(plugin, `${msg}`);
}

/**
 * Checks  if there  are theme updates based on the commit date of the obsidian.css file on github in comparison to what is stored in the BRAT theme list
 *
 * @param   {ThePlugin}      plugin    ThePlugin
 * @param   {boolean<void>}  showInfo  provide  notices during the update proces
 *
 * @return  {Promise<void>}            
 */
export const themeseCheckAndUpdates = async (plugin: ThePlugin, showInfo:boolean): Promise<void> => {
    if(await isConnectedToInternet()===false) { 
        console.log("BRAT: No internet detected.") 
        return;
    }
    let newNotice: Notice;
    const msg1 = `Checking for beta theme updates STARTED`;
    plugin.log(msg1, true);
    if (showInfo && plugin.settings.notificationsEnabled) newNotice = new Notice(`BRAT\n${msg1}`, 30000);
    for(const t of plugin.settings.themesList) {
        const lastUpdateOnline = await grabLastCommitDateForAFile(t.repo, "obsidian.css");
        if(lastUpdateOnline!==t.lastUpdate) 
            await themeUpdateTheme(plugin, t.repo, t.lastUpdate, lastUpdateOnline);
    }
    const msg2 = `Checking for beta theme updates COMPLETED`;
    plugin.log(msg2, true);
    if (showInfo) {
        if(plugin.settings.notificationsEnabled) newNotice.hide();
        ToastMessage(plugin, msg2);
    }
} 

/**
 * Updates a theme already registered  with BRAT
 *
 * @param   {ThePlugin}           plugin               ThePlugin
 * @param   {string}              cssGithubRepository  Repository path
 * @param   {[type]}              oldFileDate          Old file date  from the BRAT theme list
 * @param   {undefined<boolean>}  newFileDate          new date to use for this update
 *
 * @return  {Promise<boolean>}                         true if succeeds
 */
export const themeUpdateTheme = async (plugin: ThePlugin, cssGithubRepository: string, oldFileDate = "", newFileDate = ""): Promise<boolean> => {
    const themeCSS = await grabCommmunityThemeCssFile(cssGithubRepository, plugin.settings.debuggingMode);
    if(!themeCSS) {
        ToastMessage(plugin, "There is no theme.css file in the root path of the ${cssGithubRepository} repository, so this theme cannot be updated.")
        return false;
    }
    const cssFileName = themesDeriveBetaNameFromRepository(cssGithubRepository);
    await themesSaveTheme(plugin, cssFileName, themeCSS);
    updateBetaThemeLastUpdateDate(plugin, cssGithubRepository, newFileDate);
    const msg = `${cssFileName} theme updated from ${cssGithubRepository}. From date: ${oldFileDate} to ${newFileDate} `;
    plugin.log(msg + `[Theme Info](https://github.com/${cssGithubRepository})`, false);
    ToastMessage(plugin, `${msg}`, 20, async ()=>{window.open(`https://github.com/${cssGithubRepository}`)}   );
    return true;
}

