import { checksumForString } from "./features/githubUtils";
import type BratPlugin from "./main";

export interface ThemeInforamtion {
	repo: string;
	// checksum of theme file (either theme.css or theme-beta.css)
	lastUpdate: string;
}

export interface PluginVersion {
	repo: string; // path to the GitHub repository
	version: "latest" | string; // version of the plugin (semver or latest)
	token?: string; // optional private API key
}

export interface Settings {
	pluginList: string[];
	pluginSubListFrozenVersion: PluginVersion[];
	themesList: ThemeInforamtion[];
	updateAtStartup: boolean;
	updateThemesAtStartup: boolean;
	enableAfterInstall: boolean;
	loggingEnabled: boolean;
	loggingPath: string;
	loggingVerboseEnabled: boolean;
	debuggingMode: boolean;
	notificationsEnabled: boolean;
	personalAccessToken?: string;
	showCommandsInRibbon: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
	pluginList: [],
	pluginSubListFrozenVersion: [],
	themesList: [],
	updateAtStartup: true,
	updateThemesAtStartup: true,
	enableAfterInstall: true,
	loggingEnabled: false,
	loggingPath: "BRAT-log",
	loggingVerboseEnabled: false,
	debuggingMode: false,
	notificationsEnabled: true,
	personalAccessToken: "",
	showCommandsInRibbon: true,
};

/**
 * Adds a plugin for beta testing to the data.json file of this  plugin
 *
 * @param  plugin - the plugin object
 * @param  repositoryPath - path to the GitHub repository
 * @param  specifyVersion  - if the plugin needs to stay at the frozen version, we need to also record the version
 */
export function addBetaPluginToList(plugin: BratPlugin, repositoryPath: string, specifyVersion = "latest", privateApiKey = ""): void {
	let save = false;
	if (!plugin.settings.pluginList.contains(repositoryPath)) {
		plugin.settings.pluginList.unshift(repositoryPath);
		save = true;
	}
	if (plugin.settings.pluginSubListFrozenVersion.filter((x) => x.repo === repositoryPath).length === 0) {
		plugin.settings.pluginSubListFrozenVersion.unshift({
			repo: repositoryPath,
			version: specifyVersion,
			token: privateApiKey ? privateApiKey : undefined,
		});
		save = true;
	}
	if (save) {
		void plugin.saveSettings();
	}
}

/**
 * Tests if  a  plugin  is in data.json
 *
 * @param plugin - the plugin object
 * @param repositoryPath - path to the GitHub repository
 *
 */
export function existBetaPluginInList(plugin: BratPlugin, repositoryPath: string): boolean {
	return plugin.settings.pluginList.contains(repositoryPath);
}

/**
 * Adds a theme for beta testing to the data.json file of this  plugin
 *
 * @param plugin - the plugin object
 * @param repositoryPath - path to the GitHub repository
 * @param themeCss - raw text of the theme. It is checksummed and this is used for tracking if changes occurred to the theme
 *
 */
export function addBetaThemeToList(plugin: BratPlugin, repositoryPath: string, themeCss: string): void {
	const newTheme: ThemeInforamtion = {
		repo: repositoryPath,
		lastUpdate: checksumForString(themeCss),
	};
	plugin.settings.themesList.unshift(newTheme);
	void plugin.saveSettings();
}

/**
 * Tests if a  theme  is in data.json
 *
 * @param plugin - the plugin object
 * @param repositoryPath - path to the GitHub repository
 *
 */
export function existBetaThemeinInList(plugin: BratPlugin, repositoryPath: string): boolean {
	const testIfThemExists = plugin.settings.themesList.find((t) => t.repo === repositoryPath);
	return !!testIfThemExists;
}

/**
 * Update the lastUpate field for the theme
 *
 * @param plugin - the plugin object
 * @param repositoryPath - path to the GitHub repository
 * @param checksum - checksum of file. In past we used the date of file update, but this proved to not be consisent with the GitHub cache.
 *
 */
export function updateBetaThemeLastUpdateChecksum(plugin: BratPlugin, repositoryPath: string, checksum: string): void {
	for (const t of plugin.settings.themesList) {
		if (t.repo === repositoryPath) {
			t.lastUpdate = checksum;
			void plugin.saveSettings();
		}
	}
}
