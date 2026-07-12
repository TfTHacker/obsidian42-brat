import type { ObsidianProtocolData } from "obsidian";
import { Plugin } from "obsidian";
import BetaPlugins from "./features/BetaPlugins";
import { themesCheckAndUpdates } from "./features/themes";
import { migrateTokensToSecretStorage } from "./migrations";
import type { Settings } from "./settings";
import { DEFAULT_SETTINGS } from "./settings";
import AddNewPluginModal from "./ui/AddNewPluginModal";
import AddNewTheme from "./ui/AddNewTheme";
import { addIcons } from "./ui/icons";
import PluginCommands from "./ui/PluginCommands";
import { BratSettingsTab } from "./ui/SettingsTab";
import BratAPI from "./utils/BratAPI";
import { logger } from "./utils/logging";
import { toastMessage } from "./utils/notifications";

export default class BratPlugin extends Plugin {
	APP_NAME = "BRAT";
	APP_ID = "obsidian42-brat";
	settings: Settings = DEFAULT_SETTINGS;
	settingsTab: BratSettingsTab = new BratSettingsTab(this.app, this);
	betaPlugins = new BetaPlugins(this);
	commands: PluginCommands = new PluginCommands(this);
	bratApi: BratAPI = new BratAPI(this);

	onload() {
		console.debug(`loading ${this.APP_NAME}`);

		addIcons();
		this.addRibbonIcon("BratIcon", "BRAT", () => {
			this.commands.ribbonDisplayCommands();
		});

		// Register the settings tab synchronously during onload so the "Options"
		// button shows up immediately on first enable. If this is deferred (into a
		// promise chain or onLayoutReady), Obsidian's Community Plugins view paints
		// before the tab exists and the button only appears after a disable/enable.
		// settings is already initialized to DEFAULT_SETTINGS, and display() runs
		// lazily when the user opens the tab, so no loaded data is required here.

		this.loadSettings()
			.then(async () => {
				// Migrate tokens to SecretStorage (Obsidian 1.11.4+)
				await migrateTokensToSecretStorage(this.app, this.settings, () => this.saveSettings());

				this.addSettingTab(this.settingsTab);
				this.app.workspace.onLayoutReady(() => {
					this.registerObsidianProtocolHandler("brat", this.obsidianProtocolHandler);

					this.betaPlugins.checkIncompatiblePlugins();

					if (this.settings.updateAtStartup) {
						// registerInterval so the timer is cancelled if BRAT unloads before it
						// fires (clearInterval also clears setTimeout ids), avoiding update
						// checks running against a dead plugin instance.
						this.registerInterval(
							window.setTimeout(() => {
								void this.betaPlugins.checkForPluginUpdatesAndInstallUpdates(false);
							}, 60000),
						);
					}
					if (this.settings.updateThemesAtStartup) {
						this.registerInterval(
							window.setTimeout(() => {
								void themesCheckAndUpdates(this, false);
							}, 120000),
						);
					}
					this.registerInterval(
						window.setTimeout(() => {
							window.bratAPI = this.bratApi;
						}, 500),
					);
				});
			})
			.catch((error: unknown) => {
				console.error("Failed to load settings:", error);
			});
	}

	async log(textToLog: string, verbose = false): Promise<void> {
		await logger(this, textToLog, verbose);
	}

	onunload(): void {
		console.debug(`unloading ${this.APP_NAME}`);
		// Remove the global API handle so it does not dangle after unload.
		delete window.bratAPI;
	}

	async loadSettings(): Promise<void> {
		const loadedSettings = (await this.loadData()) as Partial<Settings> | null;
		this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedSettings ?? {});
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
				let modal: AddNewPluginModal | AddNewTheme;
				switch (which) {
					case "plugin":
						modal = new AddNewPluginModal(this, this.betaPlugins, true, false, params[which], params.version ? params.version : undefined);
						modal.open();
						break;
					case "theme":
						modal = new AddNewTheme(this);
						modal.address = params[which];
						modal.open();
						break;
				}

				return;
			}
		}
	};
}
