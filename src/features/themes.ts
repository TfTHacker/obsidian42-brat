import type { ThemeManifest } from "@obsidian-typings/obsidian-public-1.11.4";
import { Notice, normalizePath } from "obsidian";
import { getTranslations } from "../i18n";
import type BratPlugin from "../main";
import { addBetaThemeToList, updateBetaThemeLastUpdateChecksum } from "../settings";
import { isConnectedToInternet } from "../utils/internetconnection";
import { toastMessage } from "../utils/notifications";
import { checksumForString, grabChecksumOfThemeCssFile, grabCommmunityThemeCssFile, grabCommmunityThemeManifestFile } from "./githubUtils";

type ThemeCssFile = "theme.css" | "theme-beta.css";

const getThemeCssFileOrder = (preferStableThemeCss: boolean): ThemeCssFile[] => {
	return preferStableThemeCss ? ["theme.css", "theme-beta.css"] : ["theme-beta.css", "theme.css"];
};

const grabPreferredThemeCssFile = async (plugin: BratPlugin, repository: string): Promise<string | null> => {
	for (const fileName of getThemeCssFileOrder(plugin.settings.preferStableThemeCss)) {
		const themeCss = await grabCommmunityThemeCssFile(repository, fileName === "theme-beta.css", plugin.settings.debuggingMode);
		if (themeCss) return themeCss;
	}

	return null;
};

const grabPreferredThemeCssChecksum = async (plugin: BratPlugin, repository: string): Promise<string> => {
	for (const fileName of getThemeCssFileOrder(plugin.settings.preferStableThemeCss)) {
		const checksum = await grabChecksumOfThemeCssFile(repository, fileName === "theme-beta.css", plugin.settings.debuggingMode);
		if (checksum !== "0") return checksum;
	}

	return "0";
};

/**
 * Installs or updates a theme
 *
 * @param plugin              - ThePlugin
 * @param cssGithubRepository - The repository with the theme
 * @param newInstall          - true = New theme install, false update the theme
 *
 * @returns true for succcess
 */
export const themeSave = async (plugin: BratPlugin, cssGithubRepository: string, newInstall: boolean): Promise<boolean> => {
	const text = getTranslations().themeMessages;
	const themeCss = await grabPreferredThemeCssFile(plugin, cssGithubRepository);

	if (!themeCss) {
		toastMessage(plugin, text.noThemeCssFile);
		return false;
	}

	const themeManifest = await grabCommmunityThemeManifestFile(cssGithubRepository, plugin.settings.debuggingMode);
	if (!themeManifest) {
		toastMessage(plugin, text.noManifestFile);
		return false;
	}

	const manifestInfo = (await JSON.parse(themeManifest)) as ThemeManifest;

	const themeTargetFolderPath = normalizePath(themesRootPath(plugin) + manifestInfo.name);

	const { adapter } = plugin.app.vault;
	if (!(await adapter.exists(themeTargetFolderPath))) await adapter.mkdir(themeTargetFolderPath);

	await adapter.write(normalizePath(`${themeTargetFolderPath}/theme.css`), themeCss);
	await adapter.write(normalizePath(`${themeTargetFolderPath}/manifest.json`), themeManifest);

	updateBetaThemeLastUpdateChecksum(plugin, cssGithubRepository, checksumForString(themeCss));

	let msg = "";

	if (newInstall) {
		addBetaThemeToList(plugin, cssGithubRepository, themeCss);
		msg = text.installed(manifestInfo.name, cssGithubRepository);
		window.setTimeout(() => {
			plugin.app.customCss.setTheme(manifestInfo.name);
		}, 500);
	} else {
		msg = text.updated(manifestInfo.name, cssGithubRepository);
	}

	void plugin.log(`${msg}[Theme Info](https://github.com/${cssGithubRepository})`, false);
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
export const themesCheckAndUpdates = async (plugin: BratPlugin, showInfo: boolean): Promise<void> => {
	if (!(await isConnectedToInternet())) {
		console.debug("BRAT: No internet detected.");
		return;
	}
	let newNotice: Notice | undefined;
	const msg1 = "Checking for theme updates STARTED";
	await plugin.log(msg1, true);
	if (showInfo && plugin.settings.notificationsEnabled) newNotice = new Notice(`BRAT\n${msg1}`, 30000);
	for (const t of plugin.settings.themesList) {
		const lastUpdateOnline = await grabPreferredThemeCssChecksum(plugin, t.repo);
		console.debug("BRAT: lastUpdateOnline", lastUpdateOnline);
		if (lastUpdateOnline !== t.lastUpdate) await themeSave(plugin, t.repo, false);
	}
	const msg2 = "Checking for theme updates COMPLETED";
	await plugin.log(msg2, true);
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
export const themeDelete = (plugin: BratPlugin, cssGithubRepository: string): void => {
	const text = getTranslations().themeMessages;
	plugin.settings.themesList = plugin.settings.themesList.filter((t) => t.repo !== cssGithubRepository);
	void plugin.saveSettings();
	const msg = text.removed(cssGithubRepository);
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
export const themesRootPath = (plugin: BratPlugin): string => {
	return `${normalizePath(`${plugin.app.vault.configDir}/themes`)}/`;
};
