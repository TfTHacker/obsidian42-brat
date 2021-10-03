import { Notice, Plugin } from "obsidian";
import { SettingsTab } from "./SettingsTab";
import { Settings, DEFAULT_SETTINGS, existBetaPluginInList } from "./settings";
import BetaPlugins from "./BetaPlugins";
import { GenericFuzzySuggester, SuggesterItem } from "./GenericFuzzySuggester";

export default class ThePlugin extends Plugin {
	appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
	appID = "obsidian42-brat";
	settings: Settings;
	betaPlugins: BetaPlugins;

	async onload(): Promise<void> {
		console.log("loading " + this.appName);
		await this.loadSettings();
		this.addSettingTab(new SettingsTab(this.app, this));

		this.betaPlugins = new BetaPlugins(this);

		this.addCommand({
			id: "BRAT-AddBetaPlugin",
			name: "Add a beta plugin for testing",
			callback: async () => { await this.betaPlugins.displayAddNewPluginModal() }
		});

		this.addCommand({
			id: "BRAT-checkForUpdates",
			name: "Check for updates to beta plugins",
			callback: async () => { await this.betaPlugins.checkForUpdates(true) }
		});

		this.addCommand({
			id: "BRAT-restart plugin",
			name: "Restart a plugin that is already installed",
			callback: async () => { 
				// @ts-ignore
				const pluginList: SuggesterItem[] = Object.values(this.app.plugins.manifests).map( (m)=> { return { display: m.id, info: m.id }} );
				const gfs = new GenericFuzzySuggester(this);
				gfs.setSuggesterData(pluginList);
				await gfs.display( async (results) => {
					new Notice(`${results.info}\nPlugin reloading .....`, 5000);
					await this.betaPlugins.reloadPlugin(results.info);
				});
			}
		});

		this.app.workspace.onLayoutReady((): void => {
			if(this.settings.updateAtStartup) // let obsidian load and calm down before check
				setTimeout( async () => {  await this.betaPlugins.checkForUpdates(false) }, 60000);
		});
	}

	onunload(): void { console.log("unloading " + this.appName) }

	async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}