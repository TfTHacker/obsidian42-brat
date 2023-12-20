import type ThePlugin from '../main';
import { normalizePath, Notice } from 'obsidian';
import { addBetaThemeToList, updateBetaThemeLastUpdateChecksum } from '../settings';
import {
  checksumForString,
  grabChecksumOfThemeCssFile,
  grabCommmunityThemeCssFile,
  grabCommmunityThemeManifestFile,
} from './githubUtils';
import { toastMessage } from '../utils/notifications';
import { isConnectedToInternet } from '../utils/internetconnection';
import type { ThemeManifest } from 'obsidian-typings';

/**
 * Installs or updates a theme
 *
 * @param plugin              - ThePlugin
 * @param cssGithubRepository - The repository with the theme
 * @param newInstall          - true = New theme install, false update the theme
 *
 * @returns true for succcess
 */
export const themeSave = async (
  plugin: ThePlugin,
  cssGithubRepository: string,
  newInstall: boolean
): Promise<boolean> => {
  // test for themes-beta.css
  let themeCss = await grabCommmunityThemeCssFile(
    cssGithubRepository,
    true,
    plugin.settings.debuggingMode
  );
  // grabe themes.css if no beta
  if (!themeCss)
    themeCss = await grabCommmunityThemeCssFile(
      cssGithubRepository,
      false,
      plugin.settings.debuggingMode
    );

  if (!themeCss) {
    toastMessage(
      plugin,
      'There is no theme.css or theme-beta.css file in the root path of this repository, so there is no theme to install.'
    );
    return false;
  }

  const themeManifest = await grabCommmunityThemeManifestFile(
    cssGithubRepository,
    plugin.settings.debuggingMode
  );
  if (!themeManifest) {
    toastMessage(
      plugin,
      'There is no manifest.json file in the root path of this repository, so theme cannot be installed.'
    );
    return false;
  }

  const manifestInfo = (await JSON.parse(themeManifest)) as ThemeManifest;

  const themeTargetFolderPath = normalizePath(themesRootPath(plugin) + manifestInfo.name);

  const { adapter } = plugin.app.vault;
  if (!(await adapter.exists(themeTargetFolderPath)))
    await adapter.mkdir(themeTargetFolderPath);

  await adapter.write(normalizePath(themeTargetFolderPath + '/theme.css'), themeCss);
  await adapter.write(
    normalizePath(themeTargetFolderPath + '/manifest.json'),
    themeManifest
  );

  updateBetaThemeLastUpdateChecksum(
    plugin,
    cssGithubRepository,
    checksumForString(themeCss)
  );

  let msg = ``;

  if (newInstall) {
    addBetaThemeToList(plugin, cssGithubRepository, themeCss);
    msg = `${manifestInfo.name} theme installed from ${cssGithubRepository}. `;
    setTimeout(() => {
      plugin.app.customCss.setTheme(manifestInfo.name);
    }, 500);
  } else {
    msg = `${manifestInfo.name} theme updated from ${cssGithubRepository}.`;
  }

  void plugin.log(msg + `[Theme Info](https://github.com/${cssGithubRepository})`, false);
  toastMessage(plugin, msg, 20, (): void => {
    window.open(`https://github.com/${cssGithubRepository}`);
  });
  return true;
};

/**
 * Checks  if there  are theme updates based on the commit date of the obsidian.css file on github in comparison to what is stored in the BRAT theme list
 *
 * @param plugin   - ThePlugin
 * @param showInfo - provide  notices during the update proces
 *
 */
export const themesCheckAndUpdates = async (
  plugin: ThePlugin,
  showInfo: boolean
): Promise<void> => {
  if (!(await isConnectedToInternet())) {
    console.log('BRAT: No internet detected.');
    return;
  }
  let newNotice: Notice | undefined;
  const msg1 = `Checking for beta theme updates STARTED`;
  await plugin.log(msg1, true);
  if (showInfo && plugin.settings.notificationsEnabled)
    newNotice = new Notice(`BRAT\n${msg1}`, 30000);
  for (const t of plugin.settings.themesList) {
    // first test to see if theme-beta.css exists
    let lastUpdateOnline = await grabChecksumOfThemeCssFile(
      t.repo,
      true,
      plugin.settings.debuggingMode
    );
    // if theme-beta.css does NOT exist, try to get theme.css
    if (lastUpdateOnline === '0')
      lastUpdateOnline = await grabChecksumOfThemeCssFile(
        t.repo,
        false,
        plugin.settings.debuggingMode
      );
    console.log('BRAT: lastUpdateOnline', lastUpdateOnline);
    if (lastUpdateOnline !== t.lastUpdate) await themeSave(plugin, t.repo, false);
  }
  const msg2 = `Checking for beta theme updates COMPLETED`;
  (async (): Promise<void> => {
    await plugin.log(msg2, true);
  })();
  if (showInfo) {
    if (plugin.settings.notificationsEnabled && newNotice) newNotice.hide();
    toastMessage(plugin, msg2);
  }
};

/**
 * Deletes a theme from the BRAT list (Does not physically delete the theme)
 *
 * @param plugin              - ThePlugin
 * @param cssGithubRepository - Repository path
 *
 */
export const themeDelete = (plugin: ThePlugin, cssGithubRepository: string): void => {
  plugin.settings.themesList = plugin.settings.themesList.filter(
    (t) => t.repo !== cssGithubRepository
  );
  void plugin.saveSettings();
  const msg = `Removed ${cssGithubRepository} from BRAT themes list and will no longer be updated. However, the theme files still exist in the vault. To remove them, go into Settings > Appearance and remove the theme.`;
  void plugin.log(msg, true);
  toastMessage(plugin, msg);
};

/**
 * Get the path to the themes folder fo rthis vault
 *
 * @param plugin - ThPlugin
 *
 * @returns path to themes folder
 */
export const themesRootPath = (plugin: ThePlugin): string => {
  return normalizePath(plugin.app.vault.configDir + '/themes') + '/';
};
