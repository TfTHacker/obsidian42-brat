import { Plugin } from "obsidian";
import { BratSettingsTab } from "./ui/SettingsTab";
import { Settings, DEFAULT_SETTINGS } from "./ui/settings";
import BetaPlugins from "./features/BetaPlugins";
import { addIcons } from "./ui/icons";
import { logger } from "./utils/logging";
import PluginCommands from "./ui/PluginCommands";
import { themesCheckAndUpdates } from "./features/themes";
import BratAPI from "./utils/BratAPI";

export default class ThePlugin extends Plugin {
	appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
	appID = "obsidian42-brat";
	settings: Settings;
	betaPlugins: BetaPlugins;
	ribbonIcon: HTMLElement;
	commands: PluginCommands;
	bratAPI: BratAPI

	async onload(): Promise<void> {
		console.log("loading Obsidian42 - BRAT");		

		await this.loadSettings();
		this.addSettingTab(new BratSettingsTab(this.app, this));

		this.betaPlugins = new BetaPlugins(this);
		this.commands = new PluginCommands(this);

		addIcons();
		if (this.settings.ribbonIconEnabled) this.showRibbonButton();

		this.app.workspace.onLayoutReady((): void => { // let obsidian load and calm down before check
			if (this.settings.updateAtStartup) { 
				setTimeout(async () => {
					await this.betaPlugins.checkForUpdatesAndInstallUpdates(false)
				}, 60000);
			}
			if (this.settings.updateThemesAtStartup) { 
				setTimeout(async () => {
					await themesCheckAndUpdates(this, false);
				}, 120000);
			}
			setTimeout(async () => {
				this.bratAPI = new BratAPI(this);
				(globalThis as any).bratAPI = this.bratAPI;
			}, 500);
		});
	}
	showRibbonButton(): void { this.ribbonIcon = this.addRibbonIcon("BratIcon", "BRAT", async () => this.commands.ribbonDisplayCommands()) }

	log(textToLog: string, verbose = false): void { logger(this, textToLog, verbose) }
	
	onunload(): void { console.log("unloading " + this.appName) }

	async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}