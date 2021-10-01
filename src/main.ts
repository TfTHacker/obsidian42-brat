import { Plugin } from "obsidian";
import { addIcons } from "./icons";
import { Settings, DEFAULT_SETTINGS, SettingsTab } from "./SettingsTab";


export default class ThePlugin extends Plugin {
	appName = "Obsidian42 - Beta Reviewer's Autoupdate Tool (BRAT)";
	appID = "obsidian42-brat";
	settings: Settings;

    async onload(): Promise<void> {
		console.log("loading " + this.appName);
		await this.loadSettings();
		addIcons();
		this.addSettingTab(new SettingsTab(this.app, this));
	}

	onunload(): void { console.log("unloading " + this.appName) }

    async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}