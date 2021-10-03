import { App, PluginSettingTab, Setting, ToggleComponent, Platform } from 'obsidian';
import ThePlugin from './main';
import { Settings, DEFAULT_SETTINGS } from './settings';


export class SettingsTab extends PluginSettingTab {
	plugin: ThePlugin;

	constructor(app: App, plugin: ThePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: this.plugin.appName });

		new Setting(containerEl)
			.setName('Auto-update at startup')
			.setDesc('If enabled all beta plugins will be checked for updates each time Obsidian starts.')
			.addToggle((cb: ToggleComponent) => {
				cb.setValue(this.plugin.settings.updateAtStartup);
				cb.onChange(async (value: boolean) => {
					this.plugin.settings.updateAtStartup = value;
					await this.plugin.saveSettings();
				});
			});



	}
}
