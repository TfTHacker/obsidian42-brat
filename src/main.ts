import { Plugin } from "obsidian";
import { BratSettingsTab } from "./ui/SettingsTab";
import { Settings, DEFAULT_SETTINGS } from "./ui/settings";
import BetaPlugins from "./features/BetaPlugins";
import { addIcons } from "./ui/icons";
import { logger } from "./utils/logging";
import PluginCommands from "./ui/PluginCommands";

export default class ThePlugin extends Plugin {
	appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
	appID = "obsidian42-brat";
	settings: Settings;
	betaPlugins: BetaPlugins;
	ribbonIcon: HTMLElement;
	commands: PluginCommands;

	async onload(): Promise<void> {
		console.log("loading Obsidian42 - BRAT");
		await this.loadSettings();
		this.addSettingTab(new BratSettingsTab(this.app, this));

		this.betaPlugins = new BetaPlugins(this);
		this.commands = new PluginCommands(this);

		addIcons();
		if (this.settings.ribbonIconEnabled) this.showRibbonButton();

		this.app.workspace.onLayoutReady((): void => {
			if (this.settings.updateAtStartup) { // let obsidian load and calm down before check
				setTimeout(async () => {
					console.log("BRAT Autoupdate check started");
					await this.betaPlugins.checkForUpdatesAndInstallUpdates(false)
					console.log("BRAT Autoupdate check completed.")
				}, 10000);
			}
		});
	}

	showRibbonButton(): void { this.ribbonIcon = this.addRibbonIcon("BratIcon", "BRAT", async () => this.commands.ribbonDisplayCommands()) }

	log(textToLog: string, verbose = false): void { logger(this, textToLog, verbose) }
	
	onunload(): void { console.log("unloading " + this.appName) }

	async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}