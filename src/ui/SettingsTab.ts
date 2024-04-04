import type ThePlugin from '../main';
import type { App, ToggleComponent, ButtonComponent } from 'obsidian';
import { PluginSettingTab, Setting } from 'obsidian';
import { themeDelete } from '../features/themes';
import AddNewTheme from './AddNewTheme';
import { promotionalLinks } from './Promotional';

const createLink = (githubResource: string, optionalText?: string): DocumentFragment => {
  const newLink = new DocumentFragment();
  const linkElement = document.createElement('a');
  linkElement.textContent = githubResource;
  linkElement.href = `https://github.com/${githubResource}`;
  newLink.appendChild(linkElement);
  if (optionalText) {
    const textNode = document.createTextNode(optionalText);
    newLink.appendChild(textNode);
  }
  return newLink;
};

export class BratSettingsTab extends PluginSettingTab {
  plugin: ThePlugin;

  constructor(app: App, plugin: ThePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Auto-enable plugins after installation')
      .setDesc(
        'If enabled beta plugins will be automatically enabled after installtion by default. Note: you can toggle this on and off for each plugin in the "Add Plugin" form.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.enableAfterInstall);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.enableAfterInstall = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Auto-update plugins at startup')
      .setDesc(
        'If enabled all beta plugins will be checked for updates each time Obsidian starts. Note: this does not update frozen version plugins.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.updateAtStartup);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.updateAtStartup = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Auto-update themes at startup')
      .setDesc(
        'If enabled all beta themes will be checked for updates each time Obsidian starts.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.updateThemesAtStartup);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.updateThemesAtStartup = value;
          await this.plugin.saveSettings();
        });
      });

    promotionalLinks(containerEl, true);
    containerEl.createEl('hr');
    containerEl.createEl('h2', { text: 'Beta Plugin List' });
    containerEl.createEl('div', {
      text: `The following is a list of beta plugins added via the command palette "Add a beta plugin for testing" or "Add a beta plugin with frozen version for testing". A frozen version is a specific release of a plugin based on its releease tag. `,
    });
    containerEl.createEl('p');
    containerEl.createEl('div', {
      text: `Click the x button next to a plugin to remove it from the list.`,
    });
    containerEl.createEl('p');
    containerEl.createEl('span').createEl('b', { text: 'Note: ' });
    containerEl.createSpan({
      text: 'This does not delete the plugin, this should be done from the  Community Plugins tab in Settings.',
    });

    new Setting(containerEl).addButton((cb: ButtonComponent) => {
      cb.setButtonText('Add Beta plugin');
      cb.onClick(() => {
        this.plugin.app.setting.close();
        this.plugin.betaPlugins.displayAddNewPluginModal(true, false);
      });
    });

    const pluginSubListFrozenVersionNames = new Set(
      this.plugin.settings.pluginSubListFrozenVersion.map((x) => x.repo)
    );
    for (const bp of this.plugin.settings.pluginList) {
      if (pluginSubListFrozenVersionNames.has(bp)) {
        continue;
      }
      new Setting(containerEl)
        .setName(createLink(bp))
        .addButton((btn: ButtonComponent) => {
          btn.setIcon('cross');
          btn.setTooltip('Delete this beta plugin');
          btn.onClick(() => {
            if (btn.buttonEl.textContent === '')
              btn.setButtonText('Click once more to confirm removal');
            else {
              const { buttonEl } = btn;
              const { parentElement } = buttonEl;
              if (parentElement?.parentElement) {
                parentElement.parentElement.remove();
                this.plugin.betaPlugins.deletePlugin(bp);
              }
            }
          });
        });
    }

    new Setting(containerEl).addButton((cb: ButtonComponent) => {
      cb.setButtonText('Add Beta plugin with frozen version');
      cb.onClick(() => {
        this.plugin.app.setting.close();
        this.plugin.betaPlugins.displayAddNewPluginModal(true, true);
      });
    });
    for (const bp of this.plugin.settings.pluginSubListFrozenVersion) {
      new Setting(containerEl)
        .setName(createLink(bp.repo, ` (version ${bp.version})`))
        .addButton((btn: ButtonComponent) => {
          btn.setIcon('cross');
          btn.setTooltip('Delete this beta plugin');
          btn.onClick(() => {
            if (btn.buttonEl.textContent === '')
              btn.setButtonText('Click once more to confirm removal');
            else {
              const { buttonEl } = btn;
              const { parentElement } = buttonEl;
              if (parentElement?.parentElement) {
                parentElement.parentElement.remove();
                this.plugin.betaPlugins.deletePlugin(bp.repo);
              }
            }
          });
        });
    }

    containerEl.createEl('h2', { text: 'Beta Themes List' });

    new Setting(containerEl).addButton((cb: ButtonComponent) => {
      cb.setButtonText('Add Beta Theme');
      cb.onClick(() => {
        this.plugin.app.setting.close();
        new AddNewTheme(this.plugin).open();
      });
    });

    for (const bp of this.plugin.settings.themesList) {
      new Setting(containerEl)
        .setName(createLink(bp.repo))
        .addButton((btn: ButtonComponent) => {
          btn.setIcon('cross');
          btn.setTooltip('Delete this beta theme');
          btn.onClick(() => {
            if (btn.buttonEl.textContent === '')
              btn.setButtonText('Click once more to confirm removal');
            else {
              const { buttonEl } = btn;
              const { parentElement } = buttonEl;
              if (parentElement?.parentElement) {
                parentElement.parentElement.remove();
                themeDelete(this.plugin, bp.repo);
              }
            }
          });
        });
    }

    containerEl.createEl('h2', { text: 'Monitoring' });

    new Setting(containerEl)
      .setName('Enable Notifications')
      .setDesc(
        'BRAT will provide popup notifications for its various activities. Turn this off means  no notifications from BRAT.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.notificationsEnabled);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.notificationsEnabled = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Enable Logging')
      .setDesc('Plugin updates will be logged to a file in the log file.')
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.loggingEnabled);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.loggingEnabled = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(this.containerEl)
      .setName('BRAT Log File Location')
      .setDesc("Logs will be saved to this file. Don't add .md to the file name.")
      .addSearch((cb) => {
        cb.setPlaceholder('Example: BRAT-log')
          .setValue(this.plugin.settings.loggingPath)
          .onChange(async (newFolder) => {
            this.plugin.settings.loggingPath = newFolder;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Enable Verbose Logging')
      .setDesc('Get a lot  more information in  the log.')
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.loggingVerboseEnabled);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.loggingVerboseEnabled = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Debugging Mode')
      .setDesc(
        'Atomic Bomb level console logging. Can be used for troubleshoting and development.'
      )
      .addToggle((cb: ToggleComponent) => {
        cb.setValue(this.plugin.settings.debuggingMode);
        cb.onChange(async (value: boolean) => {
          this.plugin.settings.debuggingMode = value;
          await this.plugin.saveSettings();
        });
      });

    new Setting(containerEl)
      .setName('Personal Access Token')
      .setDesc(
        'If you need to access private repositories, enter the personal access token here.'
      )
      .addText((text) => {
        text
          .setPlaceholder('Enter your personal access token')
          .setValue(this.plugin.settings.personalAccessToken ?? '')
          .onChange(async (value: string) => {
            this.plugin.settings.personalAccessToken = value;
            await this.plugin.saveSettings();
          });
      });
  }
}
