import { ObsidianProtocolData, Plugin } from 'obsidian';
import { BratSettingsTab } from './ui/SettingsTab';
import type { Settings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import BetaPlugins from './features/BetaPlugins';
import { addIcons } from './ui/icons';
import { logger } from './utils/logging';
import PluginCommands from './ui/PluginCommands';
import { themesCheckAndUpdates } from './features/themes';
import BratAPI from './utils/BratAPI';
import { toastMessage } from './utils/notifications';
import AddNewTheme from './ui/AddNewTheme';
import AddNewPluginModal from './ui/AddNewPluginModal';

export default class ThePlugin extends Plugin {
  APP_NAME = "Obsidian42 - Beta Reviewer's Auto-update Tool (BRAT)";
  APP_ID = 'obsidian42-brat';
  settings: Settings = DEFAULT_SETTINGS;
  betaPlugins = new BetaPlugins(this);
  commands: PluginCommands = new PluginCommands(this);
  bratApi: BratAPI = new BratAPI(this);

  async onload(): Promise<void> {
    console.log('loading Obsidian42 - BRAT');

    await this.loadSettings();
    this.addSettingTab(new BratSettingsTab(this.app, this));

    addIcons();
    this.showRibbonButton();
    this.registerObsidianProtocolHandler('brat', this.obsidianProtocolHandler);

    this.app.workspace.onLayoutReady(() => {
      // let obsidian load and calm down before checking for updates
      if (this.settings.updateAtStartup) {
        setTimeout(() => {
          void this.betaPlugins.checkForPluginUpdatesAndInstallUpdates(false);
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
  }
  showRibbonButton(): void {
    this.addRibbonIcon('BratIcon', 'BRAT', () => {
      this.commands.ribbonDisplayCommands();
    });
  }

  async log(textToLog: string, verbose = false): Promise<void> {
    await logger(this, textToLog, verbose);
  }

  onunload(): void {
    console.log('unloading ' + this.APP_NAME);
  }

  async loadSettings(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Obsidian loadData is set to return Any
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
  }

  obsidianProtocolHandler = async (params: ObsidianProtocolData) => {
    if (!params.plugin && !params.theme) {
      toastMessage(
        this,
        `Could not locate the repository from the URL.`,
        10
      );
      return;
    }

    for (const which of ['plugin', 'theme']) {
      if (params[which]) {
        const modal = which === 'plugin' ? new AddNewPluginModal(this, this.betaPlugins) : new AddNewTheme(this);
        modal.address = params[which];
        modal.open();
        return;
      }
    }
  }
}
