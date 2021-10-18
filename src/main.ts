import { Notice, Plugin } from "obsidian";
import { SettingsTab } from "./SettingsTab";
import { Settings, DEFAULT_SETTINGS } from "./settings";
import BetaPlugins from "./BetaPlugins";
import { GenericFuzzySuggester, SuggesterItem } from "./GenericFuzzySuggester";
import { grabCommmunityPluginList } from "./githubUtils";

export default class ThePlugin extends Plugin {
	appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
	appID = "obsidian42-brat";
	settings: Settings;
	betaPlugins: BetaPlugins;

	async onload(): Promise<void> {
		console.log("loading Obsidian42 - BRAT");
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.betaPlugins = new BetaPlugins(this);

		this.addCommand({
			id: "BRAT-AddBetaPlugin",
			name: "Add a beta plugin for testing",
			callback: async () => { await this.betaPlugins.displayAddNewPluginModal() }
		});

		this.addCommand({
			id: "BRAT-checkForUpdatesAndUpdate",
			name: "Check for updates to all beta plugins and UPDATE",
			callback: async () => { await this.betaPlugins.checkForUpdatesAndInstallUpdates(true, false) }
		});

		this.addCommand({
			id: "BRAT-checkForUpdatesAndDontUpdate",
			name: "Only check for updates to beta plugins, but don't Update",
			callback: async () => { await this.betaPlugins.checkForUpdatesAndInstallUpdates(true, true) }
		});

		this.addCommand({
			id: "BRAT-updateOnePlugin",
			name: "Choose a single plugin to update",
			callback: async () => {
				const pluginList: SuggesterItem[] = Object.values(this.settings.pluginList).map((m) => { return { display: m, info: m } });
				const gfs = new GenericFuzzySuggester(this);
				gfs.setSuggesterData(pluginList);
				await gfs.display(async (results) => {
					new Notice(`BRAT\nChecking for updates for ${results.info}`, 3000);
					await this.betaPlugins.updatePlugin(results.info, false, true);
				});
			}
		});

		this.addCommand({
			id: "BRAT-restartPlugin",
			name: "Restart a plugin that is already installed",
			callback: async () => {
				// @ts-ignore
				const pluginList: SuggesterItem[] = Object.values(this.app.plugins.manifests).map((m) => { return { display: m.id, info: m.id } });
				const gfs = new GenericFuzzySuggester(this);
				gfs.setSuggesterData(pluginList);
				await gfs.display(async (results) => {
					new Notice(`${results.info}\nPlugin reloading .....`, 5000);
					await this.betaPlugins.reloadPlugin(results.info);
				});
			}
		});

		this.addCommand({
			id: "BRAT-openGitHubRepository",
			name: "Open the GitHub repository for a plugin",
			callback: async () => {
				const communityPlugins = await grabCommmunityPluginList();
				const communityPluginList: SuggesterItem[] = Object.values(communityPlugins).map((p) => { return { display: `Community: ${p.name}  (${p.repo})`, info: p.repo } });
				const bratList: SuggesterItem[] = Object.values(this.settings.pluginList).map((p) => { return { display: "BRAT: " + p, info: p } });
				communityPluginList.forEach(si => bratList.push(si));
				const gfs = new GenericFuzzySuggester(this);
				gfs.setSuggesterData(bratList);
				await gfs.display(async (results) => {
					if (results.info) window.open(`https://github.com/${results.info}`)
				});
			}
		});

		this.app.workspace.onLayoutReady((): void => {
			if (this.settings.updateAtStartup) // let obsidian load and calm down before check
				setTimeout(async () => { await this.betaPlugins.checkForUpdatesAndInstallUpdates(false) }, 60000);
		});
	}

	onunload(): void { console.log("unloading " + this.appName) }

	async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}