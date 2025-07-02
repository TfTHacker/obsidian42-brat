import type { SettingTab } from "obsidian";
import type { CommunityPlugin, CommunityTheme } from "../features/githubUtils";
import { grabCommmunityPluginList, grabCommmunityThemesList } from "../features/githubUtils";
import { themesCheckAndUpdates } from "../features/themes";
import type BratPlugin from "../main";
import { toastMessage } from "../utils/notifications";
import AddNewTheme from "./AddNewTheme";
import type { SuggesterItem } from "./GenericFuzzySuggester";
import { GenericFuzzySuggester } from "./GenericFuzzySuggester";

export default class PluginCommands {
	plugin: BratPlugin;
	bratCommands = [
		{
			id: "AddBetaPlugin",
			icon: "BratIcon",
			name: "Plugins: Add a beta plugin for testing (with or without version)",
			showInRibbon: true,
			callback: () => {
				this.plugin.betaPlugins.displayAddNewPluginModal(false, true);
			},
		},
		{
			id: "checkForUpdatesAndUpdate",
			icon: "BratIcon",
			name: "Plugins: Check for updates to all beta plugins and UPDATE",
			showInRibbon: true,
			callback: async () => {
				await this.plugin.betaPlugins.checkForPluginUpdatesAndInstallUpdates(true, false);
			},
		},
		{
			id: "checkForUpdatesAndDontUpdate",
			icon: "BratIcon",
			name: "Plugins: Only check for updates to beta plugins, but don't Update",
			showInRibbon: true,
			callback: async () => {
				await this.plugin.betaPlugins.checkForPluginUpdatesAndInstallUpdates(true, true);
			},
		},
		{
			id: "updateOnePlugin",
			icon: "BratIcon",
			name: "Plugins: Choose a single plugin version to update",
			showInRibbon: true,
			callback: () => {
				const frozenVersions = new Map(
					this.plugin.settings.pluginSubListFrozenVersion.map((f) => [
						f.repo,
						{
							version: f.version,
							token: f.token,
						},
					]),
				);
				const pluginList: SuggesterItem[] = Object.values(this.plugin.settings.pluginList)
					.filter((repo) => {
						const frozen = frozenVersions.get(repo);
						return !frozen?.version || frozen.version === "latest";
					})
					.map((repo) => {
						const frozen = frozenVersions.get(repo);
						return {
							display: repo,
							info: repo,
						};
					});
				const gfs = new GenericFuzzySuggester(this.plugin);
				gfs.setSuggesterData(pluginList);
				gfs.display((results) => {
					const msg = `Checking for updates for ${results.info as string}`;
					const frozen = frozenVersions.get(results.info as string);
					void this.plugin.log(msg, true);
					toastMessage(this.plugin, `\n${msg}`, 3);
					void this.plugin.betaPlugins.updatePlugin(results.info as string, false, true, false, frozen?.token);
				});
			},
		},
		{
			id: "reinstallOnePlugin",
			icon: "BratIcon",
			name: "Plugins: Choose a single plugin to reinstall",
			showInRibbon: true,
			callback: () => {
				const pluginSubListFrozenVersionNames = new Set(this.plugin.settings.pluginSubListFrozenVersion.map((f) => f.repo));
				const pluginList: SuggesterItem[] = Object.values(this.plugin.settings.pluginList)
					.filter((f) => !pluginSubListFrozenVersionNames.has(f))
					.map((m) => {
						return { display: m, info: m };
					});
				const gfs = new GenericFuzzySuggester(this.plugin);
				gfs.setSuggesterData(pluginList);
				gfs.display((results) => {
					const msg = `Reinstalling ${results.info as string}`;
					toastMessage(this.plugin, `\n${msg}`, 3);
					void this.plugin.log(msg, true);
					void this.plugin.betaPlugins.updatePlugin(results.info as string, false, false, true);
				});
			},
		},
		{
			id: "restartPlugin",
			icon: "BratIcon",
			name: "Plugins: Restart a plugin that is already installed",
			showInRibbon: true,
			callback: () => {
				const pluginList: SuggesterItem[] = Object.values(this.plugin.app.plugins.manifests).map((m) => {
					return { display: m.id, info: m.id };
				});
				const gfs = new GenericFuzzySuggester(this.plugin);
				gfs.setSuggesterData(pluginList);
				gfs.display((results) => {
					toastMessage(this.plugin, `${results.info as string}\nPlugin reloading .....`, 5);
					void this.plugin.betaPlugins.reloadPlugin(results.info as string);
				});
			},
		},
		{
			id: "disablePlugin",
			icon: "BratIcon",
			name: "Plugins: Disable a plugin - toggle it off",
			showInRibbon: true,
			callback: () => {
				const pluginList = this.plugin.betaPlugins.getEnabledDisabledPlugins(true).map((manifest) => {
					return {
						display: `${manifest.name} (${manifest.id})`,
						info: manifest.id,
					};
				});
				const gfs = new GenericFuzzySuggester(this.plugin);
				gfs.setSuggesterData(pluginList);
				gfs.display((results) => {
					void this.plugin.log(`${results.display} plugin disabled`, false);
					if (this.plugin.settings.debuggingMode) console.log(results.info);
					void this.plugin.app.plugins.disablePluginAndSave(results.info as string);
				});
			},
		},
		{
			id: "enablePlugin",
			icon: "BratIcon",
			name: "Plugins: Enable a plugin - toggle it on",
			showInRibbon: true,
			callback: () => {
				const pluginList = this.plugin.betaPlugins.getEnabledDisabledPlugins(false).map((manifest) => {
					return {
						display: `${manifest.name} (${manifest.id})`,
						info: manifest.id,
					};
				});
				const gfs = new GenericFuzzySuggester(this.plugin);
				gfs.setSuggesterData(pluginList);
				gfs.display((results) => {
					void this.plugin.log(`${results.display} plugin enabled`, false);
					void this.plugin.app.plugins.enablePluginAndSave(results.info as string);
				});
			},
		},
		{
			id: "openGitHubZRepository",
			icon: "BratIcon",
			name: "Plugins: Open the GitHub repository for a plugin",
			showInRibbon: true,
			callback: async () => {
				const communityPlugins = await grabCommmunityPluginList(this.plugin.settings.debuggingMode);
				if (communityPlugins) {
					const communityPluginList: SuggesterItem[] = Object.values(communityPlugins).map((p: CommunityPlugin) => {
						return { display: `Plugin: ${p.name}  (${p.repo})`, info: p.repo };
					});
					const bratList: SuggesterItem[] = Object.values(this.plugin.settings.pluginList).map((p) => {
						return { display: `BRAT: ${p}`, info: p };
					});
					for (const si of communityPluginList) {
						bratList.push(si);
					}
					const gfs = new GenericFuzzySuggester(this.plugin);
					gfs.setSuggesterData(bratList);
					gfs.display((results) => {
						if (results.info) window.open(`https://github.com/${results.info as string}`);
					});
				}
			},
		},
		{
			id: "openGitHubRepoTheme",
			icon: "BratIcon",
			name: "Themes: Open the GitHub repository for a theme (appearance)",
			showInRibbon: true,
			callback: async () => {
				const communityTheme = await grabCommmunityThemesList(this.plugin.settings.debuggingMode);
				if (communityTheme) {
					const communityThemeList: SuggesterItem[] = Object.values(communityTheme).map((p: CommunityTheme) => {
						return { display: `Theme: ${p.name}  (${p.repo})`, info: p.repo };
					});
					const gfs = new GenericFuzzySuggester(this.plugin);
					gfs.setSuggesterData(communityThemeList);
					gfs.display((results) => {
						if (results.info) window.open(`https://github.com/${results.info as string}`);
					});
				}
			},
		},
		{
			id: "opentPluginSettings",
			icon: "BratIcon",
			name: "Plugins: Open Plugin Settings Tab",
			showInRibbon: true,
			callback: () => {
				const settings = this.plugin.app.setting;
				const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(settings.pluginTabs).map((t) => {
					return { display: `Plugin: ${t.name}`, info: t.id };
				});
				const gfs = new GenericFuzzySuggester(this.plugin);
				const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(settings.settingTabs).map((t) => {
					return { display: `Core: ${t.name}`, info: t.id };
				});
				for (const si of listOfPluginSettingsTabs) {
					listOfCoreSettingsTabs.push(si);
				}
				gfs.setSuggesterData(listOfCoreSettingsTabs);
				gfs.display((results) => {
					settings.open();
					settings.openTabById(results.info as string);
				});
			},
		},
		{
			id: "GrabBetaTheme",
			icon: "BratIcon",
			name: "Themes: Grab a beta theme for testing from a Github repository",
			showInRibbon: true,
			callback: () => {
				new AddNewTheme(this.plugin).open();
			},
		},
		{
			id: "updateBetaThemes",
			icon: "BratIcon",
			name: "Themes: Update beta themes",
			showInRibbon: true,
			callback: async () => {
				await themesCheckAndUpdates(this.plugin, true);
			},
		},
		{
			id: "allCommands",
			icon: "BratIcon",
			name: "All Commands list",
			showInRibbon: false,
			callback: () => {
				this.ribbonDisplayCommands();
			},
		},
	];

	ribbonDisplayCommands(): void {
		const bratCommandList: SuggesterItem[] = [];
		for (const cmd of this.bratCommands) {
			if (cmd.showInRibbon) bratCommandList.push({ display: cmd.name, info: cmd.callback });
		}
		const gfs = new GenericFuzzySuggester(this.plugin);
		// @ts-ignore
		const settings = this.plugin.app.setting;

		const listOfCoreSettingsTabs: SuggesterItem[] = Object.values(
			settings.settingTabs,
			// @ts-ignore
		).map((t: SettingTab) => {
			return {
				// @ts-ignore
				display: `Core: ${t.name}`,
				info: () => {
					settings.open();
					// @ts-ignore
					settings.openTabById(t.id);
				},
			};
		});
		const listOfPluginSettingsTabs: SuggesterItem[] = Object.values(
			settings.pluginTabs,
			// @ts-ignore
		).map((t: SettingTab) => {
			return {
				// @ts-ignore
				display: `Plugin: ${t.name}`,
				info: () => {
					settings.open();
					// @ts-ignore
					settings.openTabById(t.id);
				},
			};
		});

		bratCommandList.push({
			display: "---- Core Plugin Settings ----",
			info: () => {
				this.ribbonDisplayCommands();
			},
		});
		for (const si of listOfCoreSettingsTabs) {
			bratCommandList.push(si);
		}
		bratCommandList.push({
			display: "---- Plugin Settings ----",
			info: () => {
				this.ribbonDisplayCommands();
			},
		});
		for (const si of listOfPluginSettingsTabs) {
			bratCommandList.push(si);
		}

		gfs.setSuggesterData(bratCommandList);
		gfs.display((results) => {
			if (typeof results.info === "function") {
				results.info();
			}
		});
	}

	constructor(plugin: BratPlugin) {
		this.plugin = plugin;
		this.registerCommands();
	}

	registerCommands(): void {
		if (this.plugin.settings.showCommandsInRibbon) {
			for (const item of this.bratCommands) {
				this.plugin.addCommand({
					id: item.id,
					name: item.name,
					icon: item.icon,
					callback: () => {
						item.callback();
					},
				});
			}
		}
	}

	unregisterCommands(): void {
		for (const item of this.bratCommands) {
			if (this.plugin.app.commands.removeCommand) {
				this.plugin.app.commands.removeCommand(`${this.plugin.manifest.id}:${item.id}`);
			}
		}
	}

	updateCommandRegistration(): void {
		this.unregisterCommands();
		this.registerCommands();
	}
}
