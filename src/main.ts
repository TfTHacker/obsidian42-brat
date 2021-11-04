import { Notice, Plugin } from "obsidian";
import { BratSettingsTab } from "./SettingsTab";
import { Settings, DEFAULT_SETTINGS } from "./settings";
import BetaPlugins from "./BetaPlugins";
import { GenericFuzzySuggester, SuggesterItem } from "./GenericFuzzySuggester";
import { grabCommmunityPluginList, grabCommmunityThemesList } from "./githubUtils";
import { addIcons } from "./icons";

export default class ThePlugin extends Plugin {
	appName = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
	appID = "obsidian42-brat";
	settings: Settings;
	betaPlugins: BetaPlugins;

	async onload(): Promise<void> {
		console.log("loading Obsidian42 - BRAT");
		await this.loadSettings();
		this.addSettingTab(new BratSettingsTab(this.app, this));

		this.betaPlugins = new BetaPlugins(this);

		const bratCommands = [
			{
				id: "BRAT-AddBetaPlugin", 
				name: "Add a beta plugin for testing",
				callback: async () => { await this.betaPlugins.displayAddNewPluginModal() }
			},
			{
				id: "BRAT-checkForUpdatesAndUpdate", 
				name: "Check for updates to all beta plugins and UPDATE",
				callback: async () => { await this.betaPlugins.checkForUpdatesAndInstallUpdates(true, false) }
			},
			{
				id: "BRAT-checkForUpdatesAndDontUpdate",
				name: "Only check for updates to beta plugins, but don't Update",
				callback: async () => { await this.betaPlugins.checkForUpdatesAndInstallUpdates(true, true) }
			},
			{
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
			},
			{
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
			},
			{
				id: "BRAT-disablePlugin",
				name: "Disable a plugin - toggle it off",
				callback: async () => {
					const pluginList = this.betaPlugins.getEnabledDisabledPlugins(true).map(manifest => { return { display: `${manifest.name} (${manifest.id})`, info: manifest.id } });
					const gfs = new GenericFuzzySuggester(this);
					gfs.setSuggesterData(pluginList);
					await gfs.display(async (results) => {
						// @ts-ignore
						await this.app.plugins.disablePlugin(results.info);
					});
				}
			},
			{
				id: "BRAT-enablePlugin",
				name: "Enable a plugin - toggle it on",
				callback: async () => {
					const pluginList = this.betaPlugins.getEnabledDisabledPlugins(false).map(manifest => { return { display: `${manifest.name} (${manifest.id})`, info: manifest.id } });
					const gfs = new GenericFuzzySuggester(this);
					gfs.setSuggesterData(pluginList);
					await gfs.display(async (results) => {
						// @ts-ignore
						await this.app.plugins.enablePlugin(results.info);
					});
				}
			},
			{
				id: "BRAT-openGitHubRepository",
				name: "Open the GitHub repository for a plugin",
				callback: async () => {
					const communityPlugins = await grabCommmunityPluginList();
					const communityPluginList: SuggesterItem[] = Object.values(communityPlugins).map((p) => { return { display: `Plugin: ${p.name}  (${p.repo})`, info: p.repo } });
					const bratList: SuggesterItem[] = Object.values(this.settings.pluginList).map((p) => { return { display: "BRAT: " + p, info: p } });
					communityPluginList.forEach(si => bratList.push(si));
					const gfs = new GenericFuzzySuggester(this);
					gfs.setSuggesterData(bratList);
					await gfs.display(async (results) => {
						if (results.info) window.open(`https://github.com/${results.info}`)
					});
				}
			},
			{
				id: "BRAT-openGitHubRepoTheme",
				name: "Open the GitHub repository for a theme ",
				callback: async () => {
					const communityTheme = await grabCommmunityThemesList();
					const communityThemeList: SuggesterItem[] = Object.values(communityTheme).map((p) => { return { display: `Theme: ${p.name}  (${p.repo})`, info: p.repo } });
					const gfs = new GenericFuzzySuggester(this);
					gfs.setSuggesterData(communityThemeList);
					await gfs.display(async (results) => {
						if (results.info) window.open(`https://github.com/${results.info}`)
					});
				}
			},
			{
				id: "BRAT-opentPluginSettings",
				name: "Open Plugin Settings Tab",
				callback: async () => {
					// @ts-ignore
					const settings = this.app.setting;
					// @ts-ignore
					const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(settings.pluginTabs).map((t) => { return { display: "Plugin: " + t.name, info: t.id } });
					const gfs = new GenericFuzzySuggester(this);
					// @ts-ignore
					const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(settings.settingTabs).map((t) => { return { display: "Core: " + t.name, info: t.id } });
					listOfPluginSettingsTabs.forEach(si => listOfCoreSettingsTabs.push(si));
					gfs.setSuggesterData(listOfCoreSettingsTabs);
					await gfs.display(async (results) => {
						settings.open();
						settings.openTabById(results.info);
					});
				}
			},
			{
				id: "BRAT-switchTheme",
				name: "Switch Active Theme ",
				callback: async () => {
					// @ts-ignore
					const communityThemeList: SuggesterItem[] = Object.values(this.app.customCss.themes).map((t) => { return { display: t, info: t } });
					const gfs = new GenericFuzzySuggester(this);
					gfs.setSuggesterData(communityThemeList);
					await gfs.display(async (results) => {
						// @ts-ignore
						this.app.customCss.setTheme(results.info);
					});
				}
			},
		]

		bratCommands.forEach(async (item) => {
			this.addCommand({
				id: item.id,
				name: item.name,
				callback: async () => { await item.callback() }
			})
		});


		const ribbonDisplayCommands = async () => {
			const bratCommandList: SuggesterItem[] = bratCommands.map((t) => { return { display: t.name, info: t.callback } });
			const gfs = new GenericFuzzySuggester(this);
			// @ts-ignore
			const settings = this.app.setting;
			// @ts-ignore
			const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(settings.settingTabs).map((t: any) => {
				return {
					display: "Core: " + t.name,
					info: async () => {
						settings.open();
						settings.openTabById(t.id);
					}
				}
			});
			// @ts-ignore
			const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(settings.pluginTabs).map((t: any) => {
				return {
					display: "Plugin: " + t.name,
					info: async () => {
						settings.open();
						settings.openTabById(t.id);
					}
				}
			});

			bratCommandList.push({ display: "---- Core Plugin Settings ----", info: async () => { await ribbonDisplayCommands() } })
			listOfCoreSettingsTabs.forEach(si => bratCommandList.push(si));
			bratCommandList.push({ display: "---- Plugin Settings ----", info: async () => { await ribbonDisplayCommands() } })
			listOfPluginSettingsTabs.forEach(si => bratCommandList.push(si));

			gfs.setSuggesterData(bratCommandList);
			await gfs.display(async (results) => await results.info());
		};

		addIcons();
		this.addRibbonIcon("BratIcon", "BRAT", async () => ribbonDisplayCommands())

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

	onunload(): void { console.log("unloading " + this.appName) }

	async loadSettings(): Promise<void> { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()) }

	async saveSettings(): Promise<void> { await this.saveData(this.settings) }
}