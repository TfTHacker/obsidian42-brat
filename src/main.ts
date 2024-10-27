import { Plugin } from "obsidian";
import type { ObsidianProtocolData } from "obsidian";
import BetaPlugins from "./features/BetaPlugins";
import { themesCheckAndUpdates } from "./features/themes";
import type { Settings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";
import AddNewPluginModal from "./ui/AddNewPluginModal";
import AddNewTheme from "./ui/AddNewTheme";
import PluginCommands from "./ui/PluginCommands";
import { BratSettingsTab } from "./ui/SettingsTab";
import { addIcons } from "./ui/icons";
import BratAPI from "./utils/BratAPI";
import { logger } from "./utils/logging";
import { toastMessage } from "./utils/notifications";

export default class BratPlugin extends Plugin {
	APP_NAME = "BRAT";
	APP_ID = "obsidian42-brat";
	settings: Settings = DEFAULT_SETTINGS;
	betaPlugins = new BetaPlugins(this);
	commands: PluginCommands = new PluginCommands(this);
	bratApi: BratAPI = new BratAPI(this);

	onload() {
		console.log(`loading ${this.APP_NAME}`);

		this.loadSettings()
			.then(() => {
				this.app.workspace.onLayoutReady(() => {
					this.addSettingTab(new BratSettingsTab(this.app, this));

					addIcons();
					this.showRibbonButton();
					this.registerObsidianProtocolHandler(
						"brat",
						this.obsidianProtocolHandler,
					);

					if (this.settings.updateAtStartup) {
						setTimeout(() => {
							void this.betaPlugins.checkForPluginUpdatesAndInstallUpdates(
								false,
							);
						}, 60000);
					}
					if (this.settings.updateThemesAtStartup) {
						setTimeout(() => {
							void themesCheckAndUpdates(this, false);
						}, 120000);
					}
					setTimeout(() => {
						window.bratAPI = this.bratApi;
					}, 500);
				});
			})
			.catch((error: unknown) => {
				console.error("Failed to load settings:", error);
			});
	}

	showRibbonButton(): void {
		this.addRibbonIcon("BratIcon", "BRAT", () => {
			this.commands.ribbonDisplayCommands();
		});
	}

	async log(textToLog: string, verbose = false): Promise<void> {
		await logger(this, textToLog, verbose);
	}

	onunload(): void {
		console.log(`unloading ${this.APP_NAME}`);
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	obsidianProtocolHandler = (params: ObsidianProtocolData) => {
		if (!params.plugin && !params.theme) {
			toastMessage(this, "Could not locate the repository from the URL.", 10);
			return;
		}

		for (const which of ["plugin", "theme"]) {
			if (params[which]) {
				const modal =
					which === "plugin"
						? new AddNewPluginModal(this, this.betaPlugins)
						: new AddNewTheme(this);
				modal.address = params[which];
				modal.open();
				return;
			}
		}
	};
}
